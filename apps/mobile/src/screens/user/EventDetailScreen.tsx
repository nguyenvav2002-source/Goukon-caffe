import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import api from '@/services/api';

interface Event {
  id: string;
  title: string;
  description?: string;
  eventType: string;
  status: string;
  price: string;
  scheduledAt: string;
  durationMin: number;
  maxSlots: number;
  _count: { registrations: number };
}

const EVENT_INFO: Record<string, { label: string; icon: string; floor: string; description: string }> = {
  ONE_VS_ONE: {
    label: '1 vs 1',
    icon: '👫',
    floor: 'Lầu 1 – Phòng riêng',
    description: 'Hẹn hò cặp đôi riêng tư, ghép ngẫu nhiên với người phù hợp',
  },
  THREE_VS_THREE: {
    label: '3 vs 3',
    icon: '👨‍👩‍👧',
    floor: 'Lầu 2 – Phòng nhóm',
    description: 'Hẹn hò nhóm vui nhộn, 3 bạn nam + 3 bạn nữ cùng trải nghiệm',
  },
  FIVE_VS_FIVE: {
    label: '5 vs 5',
    icon: '🎉',
    floor: 'Lầu 3 – Sân thượng',
    description: 'Party hẹn hò ngoài trời dưới ánh đèn lung linh',
  },
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    api.get(`/api/events/${id}`)
      .then((res) => setEvent(res.data))
      .catch(() => Alert.alert('Lỗi', 'Không thể tải thông tin event'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRegister = async () => {
    if (!event) return;

    Alert.alert(
      'Xác nhận đăng ký',
      `Đăng ký tham gia "${event.title}"?\n\n💰 Phí: ${parseInt(event.price).toLocaleString('vi-VN')}đ\n🎁 Nhận ngay: 1 ly nước MIỄN PHÍ + 50% off các ly tiếp theo`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng ký ngay',
          style: 'default',
          onPress: async () => {
            setRegistering(true);
            try {
              const res = await api.post(`/api/events/${event.id}/register`);
              router.push({
                pathname: '/registration-success',
                params: {
                  registrationId: res.data.registration.id,
                  eventTitle: event.title,
                  freeDrink: 'true',
                },
              });
            } catch (e: any) {
              const msg = e.response?.data?.message ?? 'Đăng ký thất bại';
              Alert.alert('Lỗi', msg);
            } finally {
              setRegistering(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!event) return null;

  const info = EVENT_INFO[event.eventType];
  const spotsLeft = event.maxSlots - event._count.registrations;
  const isFull = spotsLeft <= 0 || event.status === 'FULL';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.heroSection}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textOnPrimary} />
        </TouchableOpacity>

        <Text style={styles.heroEmoji}>{info?.icon ?? '🎉'}</Text>
        <Text style={styles.heroTypeBadge}>{info?.label}</Text>
        <Text style={styles.heroTitle}>{event.title}</Text>
        <Text style={styles.heroFloor}>📍 {info?.floor}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Description */}
        {event.description && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Giới thiệu</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        )}

        {/* Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin event</Text>
          <InfoRow icon="calendar" label="Thời gian" value={
            new Date(event.scheduledAt).toLocaleDateString('vi-VN', {
              weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })
          } />
          <InfoRow icon="time" label="Thời lượng" value={`${event.durationMin} phút`} />
          <InfoRow icon="people" label="Số chỗ" value={`${event._count.registrations}/${event.maxSlots}`} />
          {!isFull && (
            <InfoRow
              icon="alert-circle"
              label="Còn lại"
              value={`${spotsLeft} chỗ trống`}
              valueColor={spotsLeft <= 2 ? '#FF3B30' : COLORS.matched}
            />
          )}
        </View>

        {/* Promotions */}
        <View style={[styles.card, styles.promoCard]}>
          <Text style={styles.cardTitle}>🎁 Ưu đãi khi đăng ký</Text>
          <View style={styles.promoRow}>
            <View style={styles.promoItem}>
              <Text style={styles.promoEmoji}>🥤</Text>
              <Text style={styles.promoTitle}>1 ly MIỄN PHÍ</Text>
              <Text style={styles.promoDesc}>Khi check-in</Text>
            </View>
            <View style={styles.promoDivider} />
            <View style={styles.promoItem}>
              <Text style={styles.promoEmoji}>🏷️</Text>
              <Text style={styles.promoTitle}>Giảm 50%</Text>
              <Text style={styles.promoDesc}>Các ly tiếp theo</Text>
            </View>
          </View>
        </View>

        {/* Price */}
        <View style={styles.card}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Phí tham gia</Text>
            <Text style={styles.price}>{parseInt(event.price).toLocaleString('vi-VN')}đ</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Register Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.registerBtn, isFull && styles.registerBtnDisabled]}
          onPress={handleRegister}
          disabled={isFull || registering}
          activeOpacity={0.85}
        >
          {registering ? (
            <ActivityIndicator color={COLORS.textOnPrimary} />
          ) : (
            <Text style={styles.registerBtnText}>
              {isFull ? 'Đã hết chỗ' : '🎉 Đăng ký tham gia'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InfoRow({
  icon, label, value, valueColor,
}: {
  icon: string; label: string; value: string; valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={16} color={COLORS.textSecondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroSection: {
    backgroundColor: COLORS.primary,
    paddingTop: 56,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.base,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: SPACING.base,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEmoji: { fontSize: 56, marginBottom: SPACING.sm },
  heroTypeBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  heroTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.textOnPrimary,
    textAlign: 'center',
  },
  heroFloor: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textOnPrimary + 'CC',
    marginTop: SPACING.xs,
  },
  content: { flex: 1 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    margin: SPACING.base,
    marginBottom: 0,
    ...SHADOWS.sm,
  },
  cardTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: { flex: 1, fontSize: FONTS.sizes.base, color: COLORS.textSecondary },
  infoValue: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.textPrimary },
  promoCard: { borderWidth: 1.5, borderColor: COLORS.accent, borderStyle: 'dashed' },
  promoRow: { flexDirection: 'row' },
  promoItem: { flex: 1, alignItems: 'center' },
  promoEmoji: { fontSize: 32, marginBottom: SPACING.xs },
  promoTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: '#D4800A' },
  promoDesc: { fontSize: FONTS.sizes.xs, color: '#9A6B00', marginTop: 2 },
  promoDivider: { width: 1, backgroundColor: COLORS.accent, marginVertical: SPACING.xs },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary },
  price: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.primary },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: SPACING.base,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  registerBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  registerBtnDisabled: { backgroundColor: COLORS.textMuted },
  registerBtnText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.textOnPrimary,
  },
});
