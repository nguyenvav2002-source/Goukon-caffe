/**
 * BuildingScreen – Gōkon Floor Visualizer
 *
 * Displays a 3-floor building:
 *   Floor 1 → 1v1 (ONE_VS_ONE)
 *   Floor 2 → 3v3 (THREE_VS_THREE)
 *   Floor 3 → 5v5 (FIVE_VS_FIVE)
 *
 * Tapping a floor reveals who is currently using that package.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import api from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────────────────

interface Participant {
  id: string;
  displayName: string;
  gender?: string;
  teamSide?: 'TEAM_A' | 'TEAM_B';
}

interface FloorEvent {
  id: string;
  title: string;
  roomName: string;
  status: string;
  scheduledAt: string;
  participants: Participant[];
}

type EventType = 'ONE_VS_ONE' | 'THREE_VS_THREE' | 'FIVE_VS_FIVE';

// ─── Floor config ────────────────────────────────────────────────────────────

const FLOOR_CONFIG: Array<{
  floor: number;
  eventType: EventType;
  label: string;
  sublabel: string;
  emoji: string;
  color: string;
  gradient: [string, string];
  windowRows: number;
  windowCols: number;
}> = [
  {
    floor: 3,
    eventType: 'FIVE_VS_FIVE',
    label: 'Lầu 3',
    sublabel: '5 vs 5',
    emoji: '🎉',
    color: '#34C759',
    gradient: ['#34C759', '#27A348'],
    windowRows: 2,
    windowCols: 5,
  },
  {
    floor: 2,
    eventType: 'THREE_VS_THREE',
    label: 'Lầu 2',
    sublabel: '3 vs 3',
    emoji: '👨‍👩‍👧',
    color: '#4A90E2',
    gradient: ['#4A90E2', '#2E6BC4'],
    windowRows: 2,
    windowCols: 3,
  },
  {
    floor: 1,
    eventType: 'ONE_VS_ONE',
    label: 'Lầu 1',
    sublabel: '1 vs 1',
    emoji: '👫',
    color: '#FF6B9D',
    gradient: ['#FF6B9D', '#E05080'],
    windowRows: 2,
    windowCols: 2,
  },
];

// ─── Animated Window ─────────────────────────────────────────────────────────

const AnimatedWindow = React.memo(
  ({ delay, color, occupied }: { delay: number; color: string; occupied: boolean }) => {
    const pulseAnim = useRef(new Animated.Value(0.7)).current;

    useEffect(() => {
      if (!occupied) return;
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            delay,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
      return () => animation.stop();
    }, [occupied, delay]);

    return (
      <Animated.View
        style={[
          styles.window,
          {
            backgroundColor: occupied ? color : '#2C2C2E',
            opacity: occupied ? pulseAnim : 0.3,
            shadowColor: occupied ? color : 'transparent',
            shadowOpacity: occupied ? 0.8 : 0,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 0 },
            elevation: occupied ? 4 : 0,
          },
        ]}
      />
    );
  },
);

// ─── Floor Card ───────────────────────────────────────────────────────────────

interface FloorCardProps {
  config: (typeof FLOOR_CONFIG)[number];
  events: FloorEvent[];
  entranceAnim: Animated.Value;
  onPress: () => void;
}

const FloorCard = ({ config, events, entranceAnim, onPress }: FloorCardProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const activeCount = events.reduce((sum, e) => sum + e.participants.length, 0);
  const isActive = activeCount > 0;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  return (
    <Animated.View
      style={[
        styles.floorCardWrapper,
        {
          opacity: entranceAnim,
          transform: [
            {
              translateY: entranceAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [60, 0],
              }),
            },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.floorCard, { borderLeftColor: config.color, borderLeftWidth: 4 }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Windows grid */}
        <View style={styles.windowGrid}>
          {Array.from({ length: config.windowRows }).map((_, row) => (
            <View key={row} style={styles.windowRow}>
              {Array.from({ length: config.windowCols }).map((_, col) => {
                const idx = row * config.windowCols + col;
                const occupied = idx < activeCount;
                return (
                  <AnimatedWindow
                    key={col}
                    delay={(row * config.windowCols + col) * 200}
                    color={config.color}
                    occupied={occupied}
                  />
                );
              })}
            </View>
          ))}
        </View>

        {/* Floor info */}
        <View style={styles.floorInfo}>
          <View style={styles.floorLabelRow}>
            <Text style={styles.floorEmoji}>{config.emoji}</Text>
            <View>
              <Text style={styles.floorLabel}>{config.label}</Text>
              <Text style={[styles.floorSublabel, { color: config.color }]}>{config.sublabel}</Text>
            </View>
            <View style={styles.floorSpacer} />
            <View style={[styles.floorBadge, { backgroundColor: config.color + '20' }]}>
              <Text style={[styles.floorBadgeText, { color: config.color }]}>
                {isActive ? `${activeCount} người` : 'Trống'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} style={{ marginLeft: 4 }} />
          </View>

          {events.length > 0 && (
            <Text style={styles.floorEventPreview} numberOfLines={1}>
              📍 {events[0].roomName} — {events[0].title}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Participant Row ──────────────────────────────────────────────────────────

const ParticipantItem = ({ participant, index }: { participant: Participant; index: number }) => {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const genderIcon = participant.gender === 'female' ? '👩' : participant.gender === 'male' ? '👨' : '🧑';
  const teamColor = participant.teamSide === 'TEAM_A' ? '#FF6B9D' : '#4A90E2';

  return (
    <Animated.View
      style={[
        styles.participantRow,
        { transform: [{ translateX: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <Text style={styles.participantAvatar}>{genderIcon}</Text>
      <Text style={styles.participantName}>{participant.displayName}</Text>
      {participant.teamSide && (
        <View style={[styles.teamBadge, { backgroundColor: teamColor + '20' }]}>
          <Text style={[styles.teamBadgeText, { color: teamColor }]}>
            {participant.teamSide === 'TEAM_A' ? 'Đội A' : 'Đội B'}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function BuildingScreen() {
  const router = useRouter();
  const [floorData, setFloorData] = useState<Record<EventType, FloorEvent[]>>({
    ONE_VS_ONE: [],
    THREE_VS_THREE: [],
    FIVE_VS_FIVE: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<(typeof FLOOR_CONFIG)[number] | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Per-floor entrance animations
  const floorAnims = useRef(FLOOR_CONFIG.map(() => new Animated.Value(0))).current;
  // Building float animation
  const floatAnim = useRef(new Animated.Value(0)).current;
  // Title slide
  const titleAnim = useRef(new Animated.Value(-30)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/api/events?status=IN_PROGRESS&include=participants');
      const events: Array<{ eventType: EventType; rooms?: FloorEvent[] } & FloorEvent> = res.data;

      const grouped: Record<EventType, FloorEvent[]> = {
        ONE_VS_ONE: [],
        THREE_VS_THREE: [],
        FIVE_VS_FIVE: [],
      };

      for (const evt of events) {
        if (grouped[evt.eventType] !== undefined) {
          grouped[evt.eventType].push(evt);
        }
      }

      setFloorData(grouped);
    } catch {
      // Silently handle – show empty floors
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Title entrance
    Animated.parallel([
      Animated.timing(titleAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Staggered floor cards
    Animated.stagger(
      160,
      floorAnims.map((anim) =>
        Animated.spring(anim, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }),
      ),
    ).start();

    // Gentle building float
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    floatLoop.start();
    return () => floatLoop.stop();
  }, []);

  const openFloorModal = (config: (typeof FLOOR_CONFIG)[number]) => {
    setSelectedFloor(config);
    setModalVisible(true);
  };

  const totalActive = Object.values(floorData).reduce(
    (sum, arr) => sum + arr.reduce((s, e) => s + e.participants.length, 0),
    0,
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Animated.View style={{ transform: [{ translateY: titleAnim }], opacity: titleOpacity }}>
          <Text style={styles.headerTitle}>🏢 Sảnh Gōkon</Text>
          <Text style={styles.headerSubtitle}>{totalActive} người đang hoạt động</Text>
        </Animated.View>
        <TouchableOpacity
          onPress={() => { setRefreshing(true); fetchData(); }}
          style={styles.refreshBtn}
        >
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.primary} />
        }
      >
        {/* Building illustration */}
        <Animated.View style={[styles.buildingWrapper, { transform: [{ translateY: floatAnim }] }]}>
          <View style={styles.buildingIllustration}>
            {/* Roof */}
            <View style={styles.roof}>
              <View style={styles.roofTriangle} />
              <Text style={styles.roofText}>GŌKON</Text>
            </View>

            {/* Floors visual (top = floor 3, bottom = floor 1) */}
            {FLOOR_CONFIG.map((fc) => (
              <View
                key={fc.floor}
                style={[styles.buildingFloor, { borderTopColor: fc.color + '40' }]}
              >
                <View style={styles.buildingWindowRow}>
                  {Array.from({ length: fc.windowCols }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.buildingWindowSmall,
                        {
                          backgroundColor:
                            (floorData[fc.eventType]?.reduce((s, e) => s + e.participants.length, 0) ?? 0) > i
                              ? fc.color + 'CC'
                              : '#2C2C2E40',
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.buildingFloorTag, { color: fc.color }]}>{fc.sublabel}</Text>
              </View>
            ))}

            {/* Ground */}
            <View style={styles.ground}>
              <View style={styles.door} />
            </View>
          </View>
        </Animated.View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.legendText}>Có người</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2C2C2E' }]} />
            <Text style={styles.legendText}>Trống</Text>
          </View>
        </View>

        {/* Floor Cards */}
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xxl }} />
        ) : (
          <View style={styles.floorList}>
            {FLOOR_CONFIG.map((fc, i) => (
              <FloorCard
                key={fc.floor}
                config={fc}
                events={floorData[fc.eventType] ?? []}
                entranceAnim={floorAnims[i]}
                onPress={() => openFloorModal(fc)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floor Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedFloor && (
              <>
                {/* Handle */}
                <View style={styles.modalHandle} />

                {/* Modal Header */}
                <View style={[styles.modalHeader, { borderBottomColor: selectedFloor.color + '30' }]}>
                  <Text style={styles.modalEmoji}>{selectedFloor.emoji}</Text>
                  <View>
                    <Text style={styles.modalTitle}>{selectedFloor.label} — {selectedFloor.sublabel}</Text>
                    <Text style={styles.modalSubtitle}>
                      {(floorData[selectedFloor.eventType] ?? []).reduce((s, e) => s + e.participants.length, 0)} người đang tham gia
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={22} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Events list */}
                {(floorData[selectedFloor.eventType] ?? []).length === 0 ? (
                  <View style={styles.modalEmpty}>
                    <Text style={styles.modalEmptyEmoji}>🪑</Text>
                    <Text style={styles.modalEmptyTitle}>Lầu này đang trống</Text>
                    <Text style={styles.modalEmptyText}>Chưa có event nào đang diễn ra ở đây</Text>
                  </View>
                ) : (
                  <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                    {(floorData[selectedFloor.eventType] ?? []).map((event) => (
                      <View key={event.id} style={styles.eventGroup}>
                        <View style={[styles.eventGroupHeader, { borderLeftColor: selectedFloor.color }]}>
                          <Text style={styles.eventGroupName}>{event.title}</Text>
                          <Text style={styles.eventGroupRoom}>📍 {event.roomName}</Text>
                        </View>

                        {/* Team A */}
                        {selectedFloor.eventType !== 'ONE_VS_ONE' && (
                          <Text style={[styles.teamLabel, { color: '#FF6B9D' }]}>Đội A</Text>
                        )}
                        {event.participants
                          .filter((p) =>
                            selectedFloor.eventType === 'ONE_VS_ONE' ? true : p.teamSide === 'TEAM_A',
                          )
                          .map((p, idx) => (
                            <ParticipantItem key={p.id} participant={p} index={idx} />
                          ))}

                        {/* Team B */}
                        {selectedFloor.eventType !== 'ONE_VS_ONE' && (
                          <>
                            <Text style={[styles.teamLabel, { color: '#4A90E2' }]}>Đội B</Text>
                            {event.participants
                              .filter((p) => p.teamSide === 'TEAM_B')
                              .map((p, idx) => (
                                <ParticipantItem key={p.id} participant={p} index={idx} />
                              ))}
                          </>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F0F1A' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.base,
    backgroundColor: '#0F0F1A',
  },
  backBtn: { padding: SPACING.xs, marginRight: SPACING.sm },
  refreshBtn: { padding: SPACING.xs, marginLeft: 'auto' },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: { fontSize: FONTS.sizes.sm, color: '#888' },

  scroll: { paddingBottom: SPACING.xxxl },

  // Building illustration
  buildingWrapper: { alignItems: 'center', paddingVertical: SPACING.lg },
  buildingIllustration: {
    width: SCREEN_WIDTH * 0.65,
    backgroundColor: '#1A1A2E',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFFFFF10',
  },
  roof: {
    backgroundColor: '#2A2A3E',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF10',
  },
  roofTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 30,
    borderRightWidth: 30,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FF6B9D60',
    marginBottom: 4,
  },
  roofText: { fontSize: FONTS.sizes.xs, fontWeight: '800', color: '#FF6B9D', letterSpacing: 2 },
  buildingFloor: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  buildingWindowRow: { flexDirection: 'row', gap: SPACING.sm },
  buildingWindowSmall: {
    width: 20,
    height: 14,
    borderRadius: 3,
  },
  buildingFloorTag: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  ground: {
    height: 28,
    backgroundColor: '#1C1C2E',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 2,
    borderTopColor: '#FFFFFF10',
  },
  door: {
    width: 22,
    height: 20,
    borderRadius: 4,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    backgroundColor: '#FF6B9D40',
    borderWidth: 1,
    borderColor: '#FF6B9D60',
  },

  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: FONTS.sizes.sm, color: '#888' },

  // Floor cards
  floorList: { paddingHorizontal: SPACING.base, gap: SPACING.md },
  floorCardWrapper: {},
  floorCard: {
    backgroundColor: '#1C1C2E',
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: '#FFFFFF08',
  },
  windowGrid: { gap: 4 },
  windowRow: { flexDirection: 'row', gap: 4 },
  window: {
    width: 14,
    height: 10,
    borderRadius: 2,
  },
  floorInfo: { flex: 1 },
  floorLabelRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  floorEmoji: { fontSize: 22 },
  floorLabel: { fontSize: FONTS.sizes.base, fontWeight: '700', color: '#FFFFFF' },
  floorSublabel: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  floorSpacer: { flex: 1 },
  floorBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  floorBadgeText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  floorEventPreview: { fontSize: FONTS.sizes.xs, color: '#666', marginTop: 4 },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    backgroundColor: '#1C1C2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.xl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#444',
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.base,
    borderBottomWidth: 1,
  },
  modalEmoji: { fontSize: 32 },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: '#FFFFFF' },
  modalSubtitle: { fontSize: FONTS.sizes.sm, color: '#888' },
  modalCloseBtn: { marginLeft: 'auto', padding: SPACING.xs },
  modalScroll: { padding: SPACING.base },

  modalEmpty: { alignItems: 'center', paddingVertical: SPACING.xxxl },
  modalEmptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
  modalEmptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: '#FFFFFF', marginBottom: SPACING.xs },
  modalEmptyText: { fontSize: FONTS.sizes.sm, color: '#666' },

  eventGroup: { marginBottom: SPACING.xl },
  eventGroupHeader: {
    borderLeftWidth: 3,
    paddingLeft: SPACING.sm,
    marginBottom: SPACING.md,
  },
  eventGroupName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: '#FFFFFF' },
  eventGroupRoom: { fontSize: FONTS.sizes.xs, color: '#888', marginTop: 2 },
  teamLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },

  // Participant
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: '#252535',
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  participantAvatar: { fontSize: 20 },
  participantName: { flex: 1, fontSize: FONTS.sizes.base, color: '#FFFFFF', fontWeight: '600' },
  teamBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  teamBadgeText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
});
