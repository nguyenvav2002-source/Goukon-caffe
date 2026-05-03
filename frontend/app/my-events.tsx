import React, { useCallback, useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { eventsApi, EventRegistration } from '@/services/api';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'Chờ xác nhận', color: '#FF9500' },
  CONFIRMED:  { label: 'Đã xác nhận',  color: '#4A90E2' },
  CHECKED_IN: { label: 'Đã check-in',  color: COLORS.matched },
  CANCELLED:  { label: 'Đã huỷ',       color: COLORS.reject  },
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  ONE_VS_ONE:     '👫 1 vs 1',
  THREE_VS_THREE: '👨‍👩‍👧 3 vs 3',
  FIVE_VS_FIVE:   '🎉 5 vs 5',
};

export default function MyEventsScreen() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    try {
      const data = await eventsApi.myRegistrations();
      setRegistrations(data);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải lịch tham gia');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRegistrations(); }, [fetchRegistrations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRegistrations();
  };

  const renderItem = ({ item }: { item: EventRegistration }) => {
    const st = STATUS_LABEL[item.status] ?? STATUS_LABEL.PENDING;
    const d = new Date(item.event.scheduledAt);
    const dateStr = d.toLocaleDateString('vi-VN', {
      weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.eventType}>{EVENT_TYPE_LABEL[item.event.eventType] ?? item.event.eventType}</Text>
          <View style={[styles.statusBadge, { backgroundColor: st.color + '20' }]}>
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>
        <Text style={styles.eventTitle}>{item.event.title}</Text>
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.meta}>{dateStr} · {timeStr}</Text>
        </View>
        {item.freedrink && (
          <View style={styles.promoRow}>
            <Ionicons name="gift-outline" size={14} color={COLORS.primary} />
            <Text style={styles.promoText}>1 ly nước MIỄN PHÍ + 50% off</Text>
          </View>
        )}
        {item.status === 'CONFIRMED' && (
          <TouchableOpacity
            style={styles.checkinBtn}
            onPress={() =>
              router.push({
                pathname: '/order',
                params: { sessionId: item.id },
              })
            }
          >
            <Text style={styles.checkinBtnText}>Check-in &amp; Gọi nước</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Lịch tham gia</Text>
        <View style={{ width: 24 }} />
      </View>

      {registrations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={56} color={COLORS.primary} />
          <Text style={styles.emptyTitle}>Chưa có event nào</Text>
          <Text style={styles.emptyDesc}>Hãy đăng ký event để tham gia Gōkon!</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/')}>
            <Text style={styles.primaryBtnText}>Xem event mới</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={registrations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: 52,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pageTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary },
  list: { padding: SPACING.base, gap: 12 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventType: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '600' },
  statusBadge: { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },
  eventTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  meta: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  promoRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  promoText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
  checkinBtn: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 10,
    alignItems: 'center',
  },
  checkinBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.base },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  emptyTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary, marginTop: SPACING.md },
  emptyDesc: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 22 },
  primaryBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.base },
});

