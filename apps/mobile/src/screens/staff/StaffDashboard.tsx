import React, { useEffect, useState } from 'react';
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
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface OrderItem {
  id: string;
  menuItem: { name: string; category: string };
  quantity: number;
  finalPrice: string;
  isFree: boolean;
}

interface Order {
  id: string;
  status: 'PENDING' | 'PREPARING' | 'SERVED' | 'CANCELLED';
  note?: string;
  finalAmount: string;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_CONFIG = {
  PENDING: { label: 'Chờ xử lý', color: '#FF9500', nextStatus: 'PREPARING', nextLabel: '▶ Bắt đầu pha' },
  PREPARING: { label: 'Đang pha', color: '#4A90E2', nextStatus: 'SERVED', nextLabel: '✅ Đã phục vụ' },
  SERVED: { label: 'Đã phục vụ', color: COLORS.matched, nextStatus: null, nextLabel: null },
  CANCELLED: { label: 'Đã huỷ', color: COLORS.reject, nextStatus: null, nextLabel: null },
};

export default function StaffOrderDashboard() {
  const { user, logout } = useAuthStore();
  const { sessionId: sessionIdParam } = useLocalSearchParams<{ sessionId?: string }>();
  const sessionId = sessionIdParam ?? '';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    if (!sessionId) {
      setOrders([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const res = await api.get(`/api/orders/session/${sessionId}`);
      setOrders(res.data);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải đơn hàng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o),
      );
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const preparingCount = orders.filter((o) => o.status === 'PREPARING').length;

  const renderOrder = ({ item: order }: { item: Order }) => {
    const statusConfig = STATUS_CONFIG[order.status];

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
          <Text style={styles.orderTime}>
            {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Items – no user info shown */}
        {order.items.map((item) => (
          <View key={item.id} style={styles.orderItem}>
            <Text style={styles.itemName}>
              {item.isFree && <Text style={styles.freeTag}>[FREE] </Text>}
              {item.menuItem.name}
            </Text>
            <Text style={styles.itemPrice}>
              {item.isFree ? 'Miễn phí' : `${parseInt(item.finalPrice).toLocaleString('vi-VN')}đ`}
            </Text>
          </View>
        ))}

        {order.note && (
          <View style={styles.noteRow}>
            <Ionicons name="chatbubble-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.noteText}>{order.note}</Text>
          </View>
        )}

        <View style={styles.orderFooter}>
          <Text style={styles.totalText}>
            Tổng: {parseInt(order.finalAmount).toLocaleString('vi-VN')}đ
          </Text>

          {statusConfig.nextStatus && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: statusConfig.color }]}
              onPress={() => updateStatus(order.id, statusConfig.nextStatus!)}
            >
              <Text style={styles.actionBtnText}>{statusConfig.nextLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Staff Dashboard</Text>
          <Text style={styles.headerName}>{user?.displayName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: '#FF9500' }]}>
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Chờ xử lý</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#4A90E2' }]}>
          <Text style={styles.statNumber}>{preparingCount}</Text>
          <Text style={styles.statLabel}>Đang pha</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: COLORS.matched }]}>
          <Text style={styles.statNumber}>{orders.filter((o) => o.status === 'SERVED').length}</Text>
          <Text style={styles.statLabel}>Đã phục vụ</Text>
        </View>
      </View>

      {/* Orders List */}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xxl }} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>☕</Text>
          <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
        </View>
      ) : (
        <FlatList
          data={orders.sort((a, b) => {
            const order: Record<string, number> = { PENDING: 0, PREPARING: 1, SERVED: 2, CANCELLED: 3 };
            return (order[a.status] ?? 4) - (order[b.status] ?? 4);
          })}
          renderItem={renderOrder}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={COLORS.primary} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.base,
    paddingTop: 56,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerGreeting: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  headerName: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary },
  logoutBtn: { padding: SPACING.sm },
  statsRow: {
    flexDirection: 'row',
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 3,
    ...SHADOWS.sm,
  },
  statNumber: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  list: { padding: SPACING.base },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  orderTime: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemName: { fontSize: FONTS.sizes.base, color: COLORS.textPrimary, flex: 1 },
  freeTag: { color: COLORS.matched, fontWeight: '700' },
  itemPrice: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.sm },
  noteText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontStyle: 'italic' },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  totalText: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary },
  actionBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  actionBtnText: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: 'white' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: SPACING.md },
  emptyText: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary },
});
