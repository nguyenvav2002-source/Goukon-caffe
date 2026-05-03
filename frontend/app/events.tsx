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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { eventsApi, Event, EventType } from '@/services/api';

const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  ONE_VS_ONE:     { label: '1 vs 1',   icon: '👫',    color: '#FF6B9D' },
  THREE_VS_THREE: { label: '3 vs 3',   icon: '👨‍👩‍👧', color: '#4A90E2' },
  FIVE_VS_FIVE:   { label: '5 vs 5',   icon: '🎉',    color: '#34C759' },
};

const ALL_TYPES: EventType[] = ['ONE_VS_ONE', 'THREE_VS_THREE', 'FIVE_VS_FIVE'];

export default function EventsScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const [activeType, setActiveType] = useState<EventType | undefined>(
    type && TYPE_META[type] ? (type as EventType) : undefined,
  );
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await eventsApi.list({
        status: 'OPEN',
        ...(activeType ? { type: activeType } : {}),
      });
      setEvents(data);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải danh sách event');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeType]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const onRefresh = () => { setRefreshing(true); fetchEvents(); };

  const formatPrice = (price: string) =>
    parseInt(price).toLocaleString('vi-VN') + 'đ';

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', {
      weekday: 'short', day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: Event }) => {
    const meta = TYPE_META[item.eventType];
    const spotsLeft = item.maxSlots - item._count.registrations;
    const urgent = spotsLeft <= 2;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/event/[id]', params: { id: item.id } })}
      >
        <View style={[styles.typeBadge, { backgroundColor: meta.color + '18' }]}>
          <Text style={styles.typeIcon}>{meta.icon}</Text>
          <Text style={[styles.typeLabel, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.cardMeta}>{formatDate(item.scheduledAt)}</Text>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.row}>
            <Text style={styles.price}>{formatPrice(item.price)}</Text>
            <View style={styles.freeTag}><Text style={styles.freeTagText}>+1 ly FREE</Text></View>
          </View>
          <Text style={[styles.spots, urgent && styles.spotsUrgent]}>
            Còn {spotsLeft} chỗ
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh sách event</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Type filter tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, !activeType && styles.tabActive]}
          onPress={() => setActiveType(undefined)}
        >
          <Text style={[styles.tabText, !activeType && styles.tabTextActive]}>Tất cả</Text>
        </TouchableOpacity>
        {ALL_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeType === t && styles.tabActive]}
            onPress={() => setActiveType(t)}
          >
            <Text style={[styles.tabText, activeType === t && styles.tabTextActive]}>
              {TYPE_META[t].icon} {TYPE_META[t].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : events.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>Không có event nào đang mở</Text>
        </View>
      ) : (
        <FlatList
          data={events}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  header: {
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
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.base,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: '#fff' },
  list: { padding: SPACING.base, gap: 12 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    gap: 5,
    marginBottom: 8,
  },
  typeIcon: { fontSize: 14 },
  typeLabel: { fontSize: 12, fontWeight: '700' },
  cardTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMeta: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  price: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  freeTag: {
    marginLeft: 6,
    backgroundColor: '#FFD700',
    borderRadius: RADIUS.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  freeTagText: { fontSize: 10, fontWeight: '700', color: '#1C1C1E' },
  spots: { fontSize: 12, color: COLORS.textMuted },
  spotsUrgent: { color: COLORS.heart, fontWeight: '700' },
  emptyText: { marginTop: 12, fontSize: FONTS.sizes.base, color: COLORS.textMuted, textAlign: 'center' },
});

