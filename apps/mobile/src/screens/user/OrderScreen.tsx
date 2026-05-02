import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import api from '@/services/api';

interface MenuItem {
  id: string;
  name: string;
  basePrice: string;
  category: string;
  imageUrl?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

const DISCOUNT_RATE = 0.5;

export default function OrderScreen() {
  const router = useRouter();
  const { sessionId: sessionIdParam } = useLocalSearchParams<{ sessionId?: string }>();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const sessionId = sessionIdParam ?? '';

  useEffect(() => {
    if (!sessionId) {
      Alert.alert('Lỗi', 'Không tìm thấy phiên event. Vui lòng check-in trước.');
    }
    api.get('/api/orders/menu')
      .then((res) => setMenuItems(res.data))
      .catch(() => Alert.alert('Lỗi', 'Không thể tải menu'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === itemId);
      if (!existing || existing.quantity <= 1) {
        return prev.filter((c) => c.id !== itemId);
      }
      return prev.map((c) => c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
    });
  };

  const getCartQuantity = (itemId: string) =>
    cart.find((c) => c.id === itemId)?.quantity ?? 0;

  // Pricing: 1st item free, rest 50% off
  const calculatePricing = () => {
    let totalItems = 0;
    let original = 0;
    let final = 0;
    let savings = 0;

    for (const item of cart) {
      const price = parseInt(item.basePrice);
      for (let q = 0; q < item.quantity; q++) {
        original += price;
        totalItems++;
        if (totalItems === 1) {
          // First item: FREE
          final += 0;
          savings += price;
        } else {
          // All others: 50% off
          final += price * (1 - DISCOUNT_RATE);
          savings += price * DISCOUNT_RATE;
        }
      }
    }

    return { original, final, savings, totalItems };
  };

  const { original, final, savings, totalItems } = calculatePricing();

  const placeOrder = async () => {
    if (cart.length === 0) return;

    Alert.alert(
      'Xác nhận đặt nước',
      `Tổng thanh toán: ${final.toLocaleString('vi-VN')}đ\n(Tiết kiệm: ${savings.toLocaleString('vi-VN')}đ 🎉)`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đặt ngay',
          onPress: async () => {
            setPlacing(true);
            try {
              await api.post('/api/orders', {
                sessionId,
                items: cart.map((c) => ({ menuItemId: c.id, quantity: c.quantity })),
              });
              setCart([]);
              Alert.alert('✅ Đặt nước thành công!', 'Nhân viên sẽ mang nước đến cho bạn sớm nhất.');
            } catch (e: any) {
              Alert.alert('Lỗi', e.response?.data?.message ?? 'Đặt hàng thất bại');
            } finally {
              setPlacing(false);
            }
          },
        },
      ],
    );
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => {
    const qty = getCartQuantity(item.id);
    const price = parseInt(item.basePrice);

    return (
      <View style={styles.menuItem}>
        <View style={styles.menuItemLeft}>
          <Text style={styles.menuItemName}>{item.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.menuItemPrice}>{price.toLocaleString('vi-VN')}đ</Text>
            <Text style={styles.discountBadge}>-50%</Text>
          </View>
        </View>

        <View style={styles.qtyControl}>
          {qty > 0 ? (
            <>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id)}>
                <Ionicons name="remove" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty}</Text>
            </>
          ) : null}
          <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
            <Ionicons name="add" size={18} color={COLORS.textOnPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gọi nước 🥤</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Promo Banner */}
      <View style={styles.promoBanner}>
        <Text style={styles.promoText}>🎁 Ly đầu tiên MIỄN PHÍ · Ly tiếp theo giảm 50%</Text>
      </View>

      {/* Menu */}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        <FlatList
          data={menuItems}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.menuList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: 200 }} />}
        />
      )}

      {/* Cart Summary */}
      {cart.length > 0 && (
        <View style={styles.cartSummary}>
          <View style={styles.savingsRow}>
            <Text style={styles.savingsText}>🎉 Tiết kiệm: {savings.toLocaleString('vi-VN')}đ</Text>
          </View>
          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>{totalItems} món</Text>
              <Text style={styles.totalAmount}>{final.toLocaleString('vi-VN')}đ</Text>
            </View>
            <TouchableOpacity
              style={styles.orderBtn}
              onPress={placeOrder}
              disabled={placing}
              activeOpacity={0.85}
            >
              {placing ? (
                <ActivityIndicator color={COLORS.textOnPrimary} />
              ) : (
                <Text style={styles.orderBtnText}>Đặt nước</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: 56,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  promoBanner: {
    backgroundColor: '#FFF8E1',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent + '40',
  },
  promoText: { fontSize: FONTS.sizes.sm, color: '#856404', textAlign: 'center', fontWeight: '600' },
  menuList: { paddingHorizontal: SPACING.base, paddingTop: SPACING.md },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  menuItemLeft: { flex: 1 },
  menuItemName: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.textPrimary },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: 4 },
  menuItemPrice: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  discountBadge: {
    backgroundColor: COLORS.primary + '20',
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    paddingHorizontal: 4,
    borderRadius: RADIUS.sm,
  },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary, minWidth: 20, textAlign: 'center' },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartSummary: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.base,
    paddingBottom: 32,
    ...SHADOWS.lg,
  },
  savingsRow: {
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    alignItems: 'center',
  },
  savingsText: { fontSize: FONTS.sizes.sm, color: '#2E7D32', fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  totalAmount: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  orderBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    ...SHADOWS.md,
  },
  orderBtnText: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textOnPrimary },
});
