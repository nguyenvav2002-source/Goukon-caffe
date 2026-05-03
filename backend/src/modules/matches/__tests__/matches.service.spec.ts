import { MatchesService } from '../matches.service';
import { BadRequestException, ConflictException } from '@nestjs/common';

const makePrisma = () => ({
  match: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  matchChoice_: { create: jest.fn() },
  eventSession: { findUnique: jest.fn() },
});

describe('MatchesService', () => {
  let service: MatchesService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new MatchesService(prisma as any);
  });

  describe('submitChoice', () => {
    it('should resolve MATCHED when both users choose HEART', async () => {
      const matchId = 'match-1';
      const userId = 'user-1';

      prisma.match.findUnique
        .mockResolvedValueOnce({
          id: matchId,
          status: 'PENDING',
          choices: [{ userId: 'user-2', choice: 'HEART' }],
        })
        .mockResolvedValueOnce({
          id: matchId,
          status: 'PENDING',
          choices: [
            { userId: 'user-2', choice: 'HEART' },
            { userId, choice: 'HEART' },
          ],
        });

      prisma.matchChoice_.create.mockResolvedValue({});
      prisma.match.update.mockResolvedValue({
        id: matchId,
        status: 'MATCHED',
        choices: [],
      });

      const result = await service.submitChoice(userId, { matchId, choice: 'HEART' });

      expect(result.status).toBe('MATCHED');
      expect(result.isMatched).toBe(true);
      expect(prisma.match.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'MATCHED' } }),
      );
    });

    it('should resolve NOT_MATCHED when one user chooses REJECT', async () => {
      const matchId = 'match-2';
      const userId = 'user-1';

      prisma.match.findUnique
        .mockResolvedValueOnce({
          id: matchId,
          status: 'PENDING',
          choices: [{ userId: 'user-2', choice: 'HEART' }],
        })
        .mockResolvedValueOnce({
          id: matchId,
          status: 'PENDING',
          choices: [
            { userId: 'user-2', choice: 'HEART' },
            { userId, choice: 'REJECT' },
          ],
        });

      prisma.matchChoice_.create.mockResolvedValue({});
      prisma.match.update.mockResolvedValue({ id: matchId, status: 'NOT_MATCHED', choices: [] });

      const result = await service.submitChoice(userId, { matchId, choice: 'REJECT' });

      expect(result.status).toBe('NOT_MATCHED');
      expect(result.isMatched).toBe(false);
    });

    it('should throw ConflictException when user submits twice', async () => {
      const matchId = 'match-3';
      const userId = 'user-1';

      prisma.match.findUnique.mockResolvedValue({
        id: matchId,
        status: 'PENDING',
        choices: [{ userId, choice: 'HEART' }], // already submitted
      });

      await expect(
        service.submitChoice(userId, { matchId, choice: 'HEART' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when match is already resolved', async () => {
      const matchId = 'match-4';
      const userId = 'user-1';

      prisma.match.findUnique.mockResolvedValue({
        id: matchId,
        status: 'MATCHED',
        choices: [],
      });

      await expect(
        service.submitChoice(userId, { matchId, choice: 'HEART' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return PENDING when only first user has submitted', async () => {
      const matchId = 'match-5';
      const userId = 'user-1';

      prisma.match.findUnique
        .mockResolvedValueOnce({ id: matchId, status: 'PENDING', choices: [] })
        .mockResolvedValueOnce({
          id: matchId,
          status: 'PENDING',
          choices: [{ userId, choice: 'HEART' }],
        });

      prisma.matchChoice_.create.mockResolvedValue({});

      const result = await service.submitChoice(userId, { matchId, choice: 'HEART' });

      expect(result.status).toBe('PENDING');
      expect(prisma.match.update).not.toHaveBeenCalled();
    });
  });
});
