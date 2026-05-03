import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { MatchesService } from './matches.service';
import { SubmitChoiceDto, CreateMatchDto } from './dto/match.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Matches')
@Controller('api/matches')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.MC, Role.ADMIN)
  @ApiOperation({ summary: 'Create a match pair (MC only)' })
  createMatch(@Body() dto: CreateMatchDto) {
    return this.matchesService.createMatch(dto);
  }

  @Post('choice')
  @ApiOperation({ summary: 'Submit ❤️ or ❌ choice (User)' })
  submitChoice(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitChoiceDto,
  ) {
    return this.matchesService.submitChoice(userId, dto);
  }

  @Get(':matchId/status')
  @ApiOperation({ summary: 'Get my match status' })
  getMatchStatus(
    @Param('matchId') matchId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.matchesService.getMatchStatus(matchId, userId);
  }

  @Get('session/:sessionId/results')
  @UseGuards(RolesGuard)
  @Roles(Role.MC, Role.ADMIN)
  @ApiOperation({ summary: 'Get all match results for a session (MC only)' })
  getSessionResults(@Param('sessionId') sessionId: string) {
    return this.matchesService.getSessionMatchResults(sessionId);
  }
}
