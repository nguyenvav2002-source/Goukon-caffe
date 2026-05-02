import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface MatchChoice {
  userId: string;
  choice: 'HEART' | 'REJECT';
  user: { displayName: string };
}

interface Match {
  id: string;
  status: 'PENDING' | 'MATCHED' | 'NOT_MATCHED';
  choices: MatchChoice[];
  photo?: { fileUrl: string };
}

const STATUS_CONFIG = {
  PENDING: { label: 'Chờ chọn', color: '#FF9500', emoji: '⏳' },
  MATCHED: { label: 'Match!', color: COLORS.matched, emoji: '💚' },
  NOT_MATCHED: { label: 'Không match', color: COLORS.reject, emoji: '😔' },
};

export default function MCDashboard() {
  const { user, logout } = useAuthStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionId] = useState(''); // In real app, comes from route params

  const fetchMatches = async () => {
    if (!sessionId) {
      setMatches([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const res = await api.get(`/api/matches/session/${sessionId}/results`);
      setMatches(res.data);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải kết quả match');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchMatches(); }, []);

  const matchedCount = matches.filter((m) => m.status === 'MATCHED').length;
  const pendingCount = matches.filter((m) => m.status === 'PENDING').length;

  const renderMatch = ({ item: match }: { item: Match }) => {
    const statusConfig = STATUS_CONFIG[match.status];
    const user1 = match.choices[0];
    const user2 = match.choices[1];

    return (
      <View style={styles.matchCard}>
        <View style={styles.matchHeader}>
          <Text style={styles.matchEmoji}>{statusConfig.emoji}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Participant choices (only visible to MC) */}
        <View style={styles.participantsRow}>
          <View style={styles.participant}>
            <Text style={styles.participantName}>
              {user1?.user.displayName ?? 'Người 1'}
            </Text>
            <Text style={styles.participantChoice}>
              {user1?.choice === 'HEART' ? '💚' : user1?.choice === 'REJECT' ? '❌' : '⏳'}
            </Text>
          </View>

          <Text style={styles.vsText}>vs</Text>

          <View style={styles.participant}>
            <Text style={styles.participantName}>
              {user2?.user.displayName ?? 'Người 2'}
            </Text>
            <Text style={styles.participantChoice}>
              {user2?.choice === 'HEART' ? '💚' : user2?.choice === 'REJECT' ? '❌' : '⏳'}
            </Text>
          </View>
        </View>

        {match.photo && (
          <View style={styles.photoIndicator}>
            <Ionicons name="image" size={14} color={COLORS.primary} />
            <Text style={styles.photoText}>Có ảnh kỷ niệm</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerRole}>MC Dashboard</Text>
          <Text style={styles.headerName}>{user?.displayName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: COLORS.matched }]}>
          <Text style={[styles.statNumber, { color: COLORS.matched }]}>{matchedCount}</Text>
          <Text style={styles.statLabel}>💚 Cặp match</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#FF9500' }]}>
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>⏳ Đang chờ</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: COLORS.reject }]}>
          <Text style={styles.statNumber}>{matches.filter((m) => m.status === 'NOT_MATCHED').length}</Text>
          <Text style={styles.statLabel}>😔 Không match</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Danh sách cặp đôi</Text>
      <Text style={styles.privacyNote}>
        🔒 Thông tin này chỉ hiển thị cho MC. User không nhìn thấy lựa chọn của nhau.
      </Text>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xxl }} />
      ) : matches.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💕</Text>
          <Text style={styles.emptyText}>Chưa có cặp nào trong session này</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMatches(); }} tintColor={COLORS.primary} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.base,
    paddingTop: 56,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerRole: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  headerName: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary },
  logoutBtn: { padding: SPACING.sm },
  statsRow: { flexDirection: 'row', padding: SPACING.base, gap: SPACING.sm },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 3,
    ...SHADOWS.sm,
  },
  statNumber: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.base,
    marginTop: SPACING.sm,
  },
  privacyNote: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
  list: { paddingHorizontal: SPACING.base, paddingBottom: SPACING.xxl },
  matchCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  matchEmoji: { fontSize: 24 },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  participant: { flex: 1, alignItems: 'center' },
  participantName: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.textPrimary },
  participantChoice: { fontSize: 28, marginTop: SPACING.xs },
  vsText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '600' },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  photoText: { fontSize: FONTS.sizes.xs, color: COLORS.primary },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: SPACING.md },
  emptyText: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary },
});
