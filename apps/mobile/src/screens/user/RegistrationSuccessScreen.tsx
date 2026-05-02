import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '@/constants/theme';

export default function RegistrationSuccessScreen() {
  const { eventTitle } = useLocalSearchParams<{
    eventTitle: string;
  }>();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.bg1} />
      <View style={styles.bg2} />

      <View style={styles.content}>
        {/* Success icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.matched} />
        </View>

        <Text style={styles.title}>Đăng ký thành công! 🎉</Text>
        <Text style={styles.eventName}>{eventTitle}</Text>

        {/* Promotions */}
        <View style={styles.promoCard}>
          <Text style={styles.promoTitle}>Ưu đãi của bạn đã sẵn sàng!</Text>

          <View style={styles.promoItem}>
            <Text style={styles.promoEmoji}>🥤</Text>
            <View>
              <Text style={styles.promoItemTitle}>1 ly nước MIỄN PHÍ</Text>
              <Text style={styles.promoItemDesc}>Tự động áp dụng khi bạn gọi nước đầu tiên</Text>
            </View>
          </View>

          <View style={styles.promoDivider} />

          <View style={styles.promoItem}>
            <Text style={styles.promoEmoji}>🏷️</Text>
            <View>
              <Text style={styles.promoItemTitle}>Giảm 50% tất cả ly tiếp theo</Text>
              <Text style={styles.promoItemDesc}>Áp dụng trong suốt event</Text>
            </View>
          </View>
        </View>

        {/* Next steps */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Bước tiếp theo</Text>
          {[
            { step: '1', text: 'Đến quán đúng giờ và check-in' },
            { step: '2', text: 'MC sẽ phân phòng và giới thiệu nhóm' },
            { step: '3', text: 'Gọi nước và tận hưởng buổi tối!' },
          ].map((s) => (
            <View key={s.step} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>{s.step}</Text>
              </View>
              <Text style={styles.stepText}>{s.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace('/')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Về trang chủ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/my-events')}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryBtnText}>Xem lịch tham gia</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  bg1: {
    position: 'absolute', top: -100, right: -80,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: COLORS.matched + '20',
  },
  bg2: {
    position: 'absolute', bottom: 50, left: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: COLORS.primary + '10',
  },
  content: { flex: 1, paddingHorizontal: SPACING.base, paddingTop: 80 },
  iconContainer: { alignItems: 'center', marginBottom: SPACING.md },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  eventName: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  promoCard: {
    backgroundColor: '#FFFBEA',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    marginBottom: SPACING.md,
  },
  promoTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: '700',
    color: '#D4800A',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  promoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  promoEmoji: { fontSize: 32 },
  promoItemTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary },
  promoItemDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  promoDivider: { height: 1, backgroundColor: COLORS.accent + '40', marginVertical: SPACING.xs },
  stepsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  stepsTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textOnPrimary },
  stepText: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, flex: 1 },
  footer: {
    padding: SPACING.base,
    paddingBottom: 40,
    gap: SPACING.sm,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  primaryBtnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textOnPrimary },
  secondaryBtn: {
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  secondaryBtnText: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.textSecondary },
});
