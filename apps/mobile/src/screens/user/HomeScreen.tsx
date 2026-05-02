import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface Event {
  id: string;
  title: string;
  eventType: 'ONE_VS_ONE' | 'THREE_VS_THREE' | 'FIVE_VS_FIVE';
  status: string;
  price: string;
  scheduledAt: string;
  _count: { registrations: number };
  maxSlots: number;
}

const EVENT_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  ONE_VS_ONE: { label: '1 vs 1', icon: '👫', color: '#FF6B9D' },
  THREE_VS_THREE: { label: '3 vs 3', icon: '👨‍👩‍👧', color: '#4A90E2' },
  FIVE_VS_FIVE: { label: '5 vs 5', icon: '🎉', color: '#34C759' },
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/api/events?status=OPEN');
      setEvents(res.data);
    } catch (e) {
      console.error('Failed to load events', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const formatPrice = (price: string) =>
    parseInt(price).toLocaleString('vi-VN') + 'đ';

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderEventCard = ({ item: event }: { item: Event }) => {
    const type = EVENT_LABELS[event.eventType];
    const spotsLeft = event.maxSlots - event._count.registrations;

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => router.push(`/event/${event.id}`)}
        activeOpacity={0.85}
      >
        <View style={[styles.eventTypeBadge, { backgroundColor: type.color + '20' }]}>
          <Text style={styles.eventTypeIcon}>{type.icon}</Text>
          <Text style={[styles.eventTypeText, { color: type.color }]}>{type.label}</Text>
        </View>

        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDate}>📅 {formatDate(event.scheduledAt)}</Text>

        <View style={styles.eventFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.eventPrice}>{formatPrice(event.price)}</Text>
            <View style={styles.freeTagSmall}>
              <Text style={styles.freeTagText}>+ 1 ly FREE</Text>
            </View>
          </View>
          <Text style={[styles.spotsText, spotsLeft <= 2 && styles.spotsUrgent]}>
            {spotsLeft > 0 ? `Còn ${spotsLeft} chỗ` : 'Đã đủ người'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Xin chào, {user?.displayName?.split(' ')[0] ?? 'bạn'} 👋
          </Text>
          <Text style={styles.headerTitle}>Gōkon</Text>
          <Text style={styles.headerSubtitle}>Hẹn hò – Kết nối – Trải nghiệm</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={44} color={COLORS.primary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroEmoji}>💕</Text>
        <Text style={styles.heroTitle}>Tìm kiếm nửa kia của bạn</Text>
        <Text style={styles.heroSubtitle}>
          Hẹn hò nhóm thú vị trong không gian cafe ấm cúng
        </Text>
      </View>

      {/* Event Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chọn hình thức hẹn hò</Text>
        <View style={styles.eventTypesRow}>
          {Object.entries(EVENT_LABELS).map(([key, val]) => (
            <TouchableOpacity
              key={key}
              style={styles.typeCard}
              onPress={() => router.push({ pathname: '/events', params: { type: key } })}
              activeOpacity={0.8}
            >
              <Text style={styles.typeIcon}>{val.icon}</Text>
              <Text style={[styles.typeLabel, { color: val.color }]}>{val.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Promotion Banner */}
      <View style={styles.promoBanner}>
        <View style={styles.promoItem}>
          <Text style={styles.promoIcon}>🎁</Text>
          <Text style={styles.promoTitle}>FREE 1 Ly Nước</Text>
          <Text style={styles.promoDesc}>Khi đăng ký tham gia event</Text>
        </View>
        <View style={styles.promoDivider} />
        <View style={styles.promoItem}>
          <Text style={styles.promoIcon}>🏷️</Text>
          <Text style={styles.promoTitle}>Giảm 50%</Text>
          <Text style={styles.promoDesc}>Tất cả các ly tiếp theo</Text>
        </View>
      </View>

      {/* Events List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Event đang mở</Text>
          <TouchableOpacity onPress={() => router.push('/events')}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
        ) : events.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyText}>Chưa có event nào. Quay lại sau nhé!</Text>
          </View>
        ) : (
          <FlatList
            data={events}
            renderItem={renderEventCard}
            keyExtractor={(e) => e.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
          />
        )}
      </View>

      {/* Space floor info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Không gian Gōkon</Text>
        {[
          { floor: 'Lầu 1', desc: '4 phòng riêng – Hẹn hò 1v1', icon: '🏠', color: '#FF6B9D' },
          { floor: 'Lầu 2', desc: '4 phòng nhóm – Hẹn hò 3v3', icon: '🏢', color: '#4A90E2' },
          { floor: 'Lầu 3', desc: 'Sân thượng ngoài trời – 5v5', icon: '🌙', color: '#34C759' },
        ].map((f) => (
          <View key={f.floor} style={styles.floorRow}>
            <Text style={styles.floorIcon}>{f.icon}</Text>
            <View>
              <Text style={[styles.floorName, { color: f.color }]}>{f.floor}</Text>
              <Text style={styles.floorDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: SPACING.xxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  greeting: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBanner: {
    margin: SPACING.base,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primary,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  heroTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textOnPrimary,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textOnPrimary + 'CC',
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  section: {
    paddingHorizontal: SPACING.base,
    marginTop: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  seeAll: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  eventTypesRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  typeCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  typeIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  typeLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
  },
  promoBanner: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.xl,
    backgroundColor: '#FFF8E1',
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
  },
  promoItem: {
    flex: 1,
    alignItems: 'center',
  },
  promoIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  promoTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: '#D4800A',
  },
  promoDesc: {
    fontSize: FONTS.sizes.xs,
    color: '#9A6B00',
    textAlign: 'center',
    marginTop: 2,
  },
  promoDivider: {
    width: 1,
    backgroundColor: COLORS.accent,
    marginVertical: SPACING.xs,
  },
  eventCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    ...SHADOWS.md,
  },
  eventTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
    gap: 4,
  },
  eventTypeIcon: {
    fontSize: 14,
  },
  eventTypeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
  },
  eventTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  eventDate: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  eventPrice: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  freeTagSmall: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  freeTagText: {
    fontSize: FONTS.sizes.xs,
    color: '#856404',
    fontWeight: '600',
  },
  spotsText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  spotsUrgent: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  floorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  floorIcon: {
    fontSize: 28,
  },
  floorName: {
    fontSize: FONTS.sizes.base,
    fontWeight: '700',
  },
  floorDesc: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
