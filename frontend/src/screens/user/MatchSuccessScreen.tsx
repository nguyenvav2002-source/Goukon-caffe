import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import api from '@/services/api';

type CameraFacing = 'front' | 'back';

export default function MatchSuccessScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();

  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<CameraFacing>('front');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoSaved, setPhotoSaved] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const openCamera = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Cần quyền camera', 'Vui lòng cấp quyền camera để chụp ảnh kỷ niệm.');
        return;
      }
    }
    setShowCamera(true);
  };

  const takePhoto = async () => {
    if (!cameraRef.current || capturing) return;

    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: false,
      });

      if (!photo) throw new Error('Failed to capture photo');

      setShowCamera(false);
      await uploadPhoto(photo.uri);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
    } finally {
      setCapturing(false);
    }
  };

  const uploadPhoto = async (uri: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri,
        name: `match-${matchId}-${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);

      await api.post(`/api/photos/match/${matchId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Also save to device gallery
      if (!mediaPermission?.granted) {
        await requestMediaPermission();
      }
      try {
        await MediaLibrary.saveToLibraryAsync(uri);
      } catch {
        // Non-critical: if save to gallery fails, the photo is still uploaded
      }

      setPhotoSaved(true);
      Alert.alert('📸 Lưu ảnh thành công!', 'Ảnh kỷ niệm của bạn đã được lưu.');
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message ?? 'Không thể lưu ảnh');
    } finally {
      setUploading(false);
    }
  };

  // Camera view
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
          {/* Frame overlay */}
          <View style={styles.cameraFrame}>
            <View style={styles.frameCornerTL} />
            <View style={styles.frameCornerTR} />
            <View style={styles.frameCornerBL} />
            <View style={styles.frameCornerBR} />
          </View>

          {/* Gōkon watermark */}
          <View style={styles.watermark}>
            <Text style={styles.watermarkText}>💕 Gōkon</Text>
          </View>

          {/* Camera controls */}
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.cameraActionBtn}
              onPress={() => setShowCamera(false)}
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captureBtn}
              onPress={takePhoto}
              disabled={capturing}
            >
              {capturing ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <View style={styles.captureBtnInner} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cameraActionBtn}
              onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}
            >
              <Ionicons name="camera-reverse" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Confetti-like background */}
      <View style={styles.bg1} />
      <View style={styles.bg2} />

      <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
        {/* Success indicator */}
        <Text style={styles.successEmoji}>💚</Text>
        <Text style={styles.successTitle}>Match thành công!</Text>
        <Text style={styles.successSubtitle}>
          Chúc mừng! Cả hai đã có cùng cảm xúc 🎉
        </Text>

        {/* Hearts decoration */}
        <View style={styles.heartsRow}>
          {['💕', '❤️', '💖', '💗', '💓'].map((h, i) => (
            <Text key={i} style={styles.heartDecor}>{h}</Text>
          ))}
        </View>
      </Animated.View>

      {/* Photo section */}
      <View style={styles.photoSection}>
        <Text style={styles.photoTitle}>📸 Chụp ảnh kỷ niệm</Text>
        <Text style={styles.photoSubtitle}>
          Lưu lại khoảnh khắc đặc biệt này cùng Gōkon
        </Text>

        {photoSaved ? (
          <View style={styles.savedBadge}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.matched} />
            <Text style={styles.savedText}>Ảnh đã được lưu!</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.photoBtn}
            onPress={openCamera}
            disabled={uploading}
            activeOpacity={0.85}
          >
            {uploading ? (
              <ActivityIndicator color={COLORS.textOnPrimary} />
            ) : (
              <>
                <Ionicons name="camera" size={22} color={COLORS.textOnPrimary} />
                <Text style={styles.photoBtnText}>Chụp ảnh ngay</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.privacyNote}>
          <Ionicons name="lock-closed" size={14} color={COLORS.textSecondary} />
          <Text style={styles.privacyText}>
            Ảnh chỉ 2 bạn mới xem được. Dữ liệu được bảo mật.
          </Text>
        </View>
      </View>

      {/* Done button */}
      <TouchableOpacity
        style={styles.doneBtn}
        onPress={() => router.replace('/')}
        activeOpacity={0.85}
      >
        <Text style={styles.doneBtnText}>Về trang chủ</Text>
      </TouchableOpacity>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  bg1: {
    position: 'absolute', top: -80, right: -60,
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: COLORS.primaryLight + '25',
  },
  bg2: {
    position: 'absolute', bottom: 100, left: -80,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: COLORS.secondary + '15',
  },
  content: {
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: SPACING.xl,
  },
  successEmoji: { fontSize: 80, marginBottom: SPACING.md },
  successTitle: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 22,
  },
  heartsRow: {
    flexDirection: 'row',
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  heartDecor: { fontSize: 24 },
  photoSection: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    margin: SPACING.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  photoTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  photoSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  photoBtnText: {
    fontSize: FONTS.sizes.base,
    fontWeight: '700',
    color: COLORS.textOnPrimary,
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
  },
  savedText: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.matched },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  privacyText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, flex: 1 },
  doneBtn: {
    marginHorizontal: SPACING.xl,
    marginBottom: 40,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  doneBtnText: {
    fontSize: FONTS.sizes.base,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  // Camera styles
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  cameraFrame: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    right: '10%',
    bottom: '25%',
  },
  frameCornerTL: {
    position: 'absolute', top: 0, left: 0,
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
    borderColor: 'white',
  },
  frameCornerTR: {
    position: 'absolute', top: 0, right: 0,
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
    borderColor: 'white',
  },
  frameCornerBL: {
    position: 'absolute', bottom: 0, left: 0,
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
    borderColor: 'white',
  },
  frameCornerBR: {
    position: 'absolute', bottom: 0, right: 0,
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
    borderColor: 'white',
  },
  watermark: {
    position: 'absolute',
    bottom: '28%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  watermarkText: { color: 'white', fontSize: FONTS.sizes.sm, fontWeight: '700' },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  cameraActionBtn: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
  },
});
