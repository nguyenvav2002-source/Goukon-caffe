import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';

export default function MyEventsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <View style={styles.card}>
        <Ionicons name="calendar" size={56} color={COLORS.primary} />
        <Text style={styles.title}>Lịch tham gia</Text>
        <Text style={styles.description}>
          Các event bạn đã đăng ký sẽ hiển thị tại đây khi backend trả dữ liệu lịch tham gia.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/')}>
          <Text style={styles.primaryBtnText}>Xem event mới</Text>
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
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.md,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  description: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: SPACING.md,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    marginTop: SPACING.xl,
  },
  primaryBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
});
