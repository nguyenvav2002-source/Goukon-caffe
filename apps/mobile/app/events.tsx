import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';

const TYPE_LABELS: Record<string, string> = {
  ONE_VS_ONE: '1 vs 1',
  THREE_VS_THREE: '3 vs 3',
  FIVE_VS_FIVE: '5 vs 5',
};

export default function EventsScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const selectedType = type ? TYPE_LABELS[type] ?? type : 'Tất cả event';

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <View style={styles.card}>
        <Text style={styles.title}>Danh sách event</Text>
        <Text style={styles.subtitle}>{selectedType}</Text>
        <Text style={styles.description}>
          Các event đang mở đã hiển thị ở trang chủ. Màn này sẽ sẵn sàng để mở rộng
          bộ lọc và danh sách đầy đủ.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/')}>
          <Text style={styles.primaryBtnText}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.base,
    paddingTop: 56,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.md,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONTS.sizes.base,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  description: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginTop: SPACING.md,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  primaryBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
});
