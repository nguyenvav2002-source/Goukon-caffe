import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import api from '@/services/api';

type MatchStatus = 'PENDING' | 'MATCHED' | 'NOT_MATCHED';
type Choice = 'HEART' | 'REJECT' | null;

export default function MatchScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const [choice, setChoice] = useState<Choice>(null);
  const [status, setStatus] = useState<MatchStatus>('PENDING');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const submitChoice = async (selected: 'HEART' | 'REJECT') => {
    if (choice !== null) return;

    Alert.alert(
      selected === 'HEART' ? '💚 Gửi tim?' : '❌ Từ chối?',
      selected === 'HEART'
        ? 'Bạn muốn gửi ❤️ cho người này?'
        : 'Bạn muốn từ chối người này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setChoice(selected);
            setSubmitting(true);
            try {
              const res = await api.post('/api/matches/choice', {
                matchId,
                choice: selected,
              });
              setStatus(res.data.status);
              setMessage(res.data.message);

              if (res.data.status === 'MATCHED') {
                setTimeout(() => {
                  router.push({
                    pathname: '/match-success',
                    params: { matchId },
                  });
                }, 1500);
              }
            } catch (e: any) {
              Alert.alert('Lỗi', e.response?.data?.message ?? 'Lỗi gửi lựa chọn');
              setChoice(null);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Background decoration */}
      <View style={styles.bgDecoration} />

      <View style={styles.content}>
        <Text style={styles.title}>Lựa chọn của bạn</Text>
        <Text style={styles.subtitle}>
          Bạn cảm thấy thế nào về người bạn vừa gặp?
        </Text>

        {/* Status indicator */}
        {status === 'PENDING' && choice !== null && (
          <View style={styles.waitingBanner}>
            <ActivityIndicator color={COLORS.primary} size="small" />
            <Text style={styles.waitingText}>Đang chờ kết quả...</Text>
          </View>
        )}

        {message && status !== 'PENDING' && (
          <View style={[
            styles.resultBanner,
            status === 'MATCHED' ? styles.matchedBanner : styles.notMatchedBanner,
          ]}>
            <Text style={styles.resultText}>{message}</Text>
          </View>
        )}

        {/* Choice buttons */}
        {choice === null && (
          <View style={styles.choiceRow}>
            {/* Reject */}
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => submitChoice('REJECT')}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <Text style={styles.choiceEmoji}>❌</Text>
              <Text style={styles.rejectText}>Không phải người này</Text>
            </TouchableOpacity>

            {/* Heart */}
            <TouchableOpacity
              style={styles.heartBtn}
              onPress={() => submitChoice('HEART')}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <Text style={styles.choiceEmoji}>💚</Text>
              <Text style={styles.heartText}>Thích người này!</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Already chose */}
        {choice !== null && status === 'PENDING' && (
          <View style={styles.chosenContainer}>
            <Text style={styles.chosenEmoji}>{choice === 'HEART' ? '💚' : '❌'}</Text>
            <Text style={styles.chosenText}>
              Bạn đã {choice === 'HEART' ? 'gửi tim' : 'từ chối'}
            </Text>
            <Text style={styles.chosenSubtext}>Đang chờ đối phương lựa chọn...</Text>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Bạn biết không?</Text>
          <Text style={styles.tipsText}>
            Kết quả chỉ được tiết lộ khi cả hai cùng gửi tim. Nếu bạn từ chối,
            đối phương sẽ không biết – chỉ có MC được thông báo.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  bgDecoration: {
    position: 'absolute',
    top: -100,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primaryLight + '30',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: 100,
    alignItems: 'center',
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xxl,
    lineHeight: 22,
  },
  waitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight + '30',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  waitingText: { fontSize: FONTS.sizes.base, color: COLORS.primary, fontWeight: '600' },
  resultBanner: {
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
    width: '100%',
    alignItems: 'center',
  },
  matchedBanner: { backgroundColor: '#E8F5E9' },
  notMatchedBanner: { backgroundColor: COLORS.surfaceAlt },
  resultText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  choiceRow: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginTop: SPACING.md,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.reject + '40',
    ...SHADOWS.sm,
  },
  heartBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  choiceEmoji: { fontSize: 48, marginBottom: SPACING.sm },
  rejectText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.reject,
    textAlign: 'center',
  },
  heartText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textOnPrimary,
    textAlign: 'center',
  },
  chosenContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    ...SHADOWS.md,
    width: '80%',
  },
  chosenEmoji: { fontSize: 64, marginBottom: SPACING.md },
  chosenText: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary },
  chosenSubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  tipsCard: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    marginHorizontal: SPACING.xl,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
  },
  tipsTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  tipsText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, lineHeight: 18 },
});
