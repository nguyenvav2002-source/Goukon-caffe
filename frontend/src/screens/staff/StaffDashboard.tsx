import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

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

interface DrinkIngredient {
  name: string;
  amount: string;
}

interface DrinkRecipe {
  id: string;
  name: string;
  emoji: string;
  category: 'cocktail' | 'mocktail' | 'coffee' | 'softdrink';
  difficulty: 'Dễ' | 'Vừa' | 'Khó';
  time: string;
  glass: string;
  ingredients: DrinkIngredient[];
  steps: string[];
  note?: string;
}

const DRINK_RECIPES: DrinkRecipe[] = [
  {
    id: '1',
    name: 'Mojito',
    emoji: '🍃',
    category: 'mocktail',
    difficulty: 'Dễ',
    time: '3 phút',
    glass: 'Ly highball',
    ingredients: [
      { name: 'Lá bạc hà tươi', amount: '10–12 lá' },
      { name: 'Đường mía (syrup)', amount: '20ml' },
      { name: 'Nước cốt chanh xanh', amount: '30ml' },
      { name: 'Soda lạnh', amount: '120ml' },
      { name: 'Đá viên', amount: 'Đầy ly' },
    ],
    steps: [
      'Cho lá bạc hà + syrup vào ly, giã nhẹ tay (muddling).',
      'Vắt chanh vào ly.',
      'Cho đá viên vào đầy ly.',
      'Rót soda từ từ, khuấy nhẹ.',
      'Trang trí lá bạc hà & khoanh chanh.',
    ],
  },
  {
    id: '2',
    name: 'Passion Fruit Fizz',
    emoji: '🍊',
    category: 'mocktail',
    difficulty: 'Dễ',
    time: '2 phút',
    glass: 'Ly collins',
    ingredients: [
      { name: 'Chanh leo (thịt)', amount: '1 trái' },
      { name: 'Syrup đường', amount: '15ml' },
      { name: 'Nước cốt chanh vàng', amount: '20ml' },
      { name: 'Soda / Tonic water', amount: '100ml' },
      { name: 'Đá', amount: 'Đầy ly' },
    ],
    steps: [
      'Đổ thịt chanh leo vào đáy ly.',
      'Thêm syrup và nước cốt chanh.',
      'Cho đá đầy ly.',
      'Rót soda từ từ, khuấy nhẹ.',
      'Trang trí khoanh chanh vàng.',
    ],
  },
  {
    id: '3',
    name: 'Strawberry Lemonade',
    emoji: '🍓',
    category: 'mocktail',
    difficulty: 'Dễ',
    time: '3 phút',
    glass: 'Ly mason jar',
    ingredients: [
      { name: 'Dâu tây', amount: '5–6 trái' },
      { name: 'Nước cốt chanh', amount: '30ml' },
      { name: 'Syrup đường', amount: '20ml' },
      { name: 'Nước lọc / Soda', amount: '150ml' },
      { name: 'Đá viên', amount: 'Đầy ly' },
    ],
    steps: [
      'Xay hoặc giã nhuyễn dâu tây.',
      'Lọc lấy nước dâu qua rây.',
      'Mix nước dâu + syrup + nước cốt chanh.',
      'Cho đá vào ly, rót hỗn hợp dâu.',
      'Thêm soda/nước lọc, khuấy đều.',
    ],
    note: '💡 Có thể thêm vài lá bạc hà cho thơm.',
  },
  {
    id: '4',
    name: 'Blue Ocean Fizz',
    emoji: '🌊',
    category: 'mocktail',
    difficulty: 'Vừa',
    time: '4 phút',
    glass: 'Ly hurricane',
    ingredients: [
      { name: 'Syrup blue curacao (không cồn)', amount: '20ml' },
      { name: 'Nước cốt chanh', amount: '20ml' },
      { name: 'Grenadine syrup', amount: '10ml' },
      { name: 'Soda lạnh', amount: '120ml' },
      { name: 'Đá viên', amount: 'Đầy ly' },
    ],
    steps: [
      'Cho syrup curacao + nước cốt chanh vào ly.',
      'Thêm đá đầy ly.',
      'Rót soda từ từ để giữ màu.',
      'Nhỏ grenadine xuống đáy ly (hiệu ứng hoàng hôn).',
      'Trang trí trái cây nhiều màu.',
    ],
    note: '💡 Không khuấy để giữ hiệu ứng gradient màu đẹp.',
  },
  {
    id: '5',
    name: 'Iced Vietnamese Coffee',
    emoji: '☕',
    category: 'coffee',
    difficulty: 'Dễ',
    time: '5 phút',
    glass: 'Ly thủy tinh cao',
    ingredients: [
      { name: 'Cà phê robusta xay', amount: '20g' },
      { name: 'Nước nóng 90°C', amount: '80ml' },
      { name: 'Sữa đặc', amount: '25ml' },
      { name: 'Đá viên', amount: 'Đầy ly' },
    ],
    steps: [
      'Pha cà phê qua phin (4–5 phút).',
      'Cho sữa đặc vào đáy ly riêng.',
      'Đổ cà phê nóng vào, khuấy tan sữa.',
      'Cho đá đầy vào ly khác.',
      'Rót hỗn hợp cà phê qua đá.',
    ],
  },
  {
    id: '6',
    name: 'Matcha Latte Đá',
    emoji: '🍵',
    category: 'coffee',
    difficulty: 'Vừa',
    time: '5 phút',
    glass: 'Ly 300ml',
    ingredients: [
      { name: 'Bột matcha ceremonial grade', amount: '5g (1 muỗng cà phê)' },
      { name: 'Nước nóng 75°C', amount: '30ml' },
      { name: 'Sữa tươi không đường', amount: '150ml' },
      { name: 'Syrup đường / Mật ong', amount: '15ml' },
      { name: 'Đá viên', amount: 'Đầy ly' },
    ],
    steps: [
      'Hòa bột matcha + nước nóng 75°C bằng whisk đến khi mịn.',
      'Cho đá đầy ly.',
      'Rót sữa lạnh vào ly.',
      'Từ từ đổ matcha lên trên.',
      'Khuấy nhẹ trước khi uống.',
    ],
    note: '💡 Không dùng nước quá 80°C, matcha sẽ đắng.',
  },
  {
    id: '7',
    name: 'Gōkon Special Sunrise',
    emoji: '🌅',
    category: 'mocktail',
    difficulty: 'Khó',
    time: '6 phút',
    glass: 'Ly champagne flute',
    ingredients: [
      { name: 'Nước cam tươi', amount: '80ml' },
      { name: 'Grenadine syrup', amount: '15ml' },
      { name: 'Blue syrup', amount: '10ml' },
      { name: 'Soda lạnh', amount: '60ml' },
      { name: 'Nước cốt chanh', amount: '10ml' },
      { name: 'Đá viên nhỏ', amount: 'Vừa đủ' },
    ],
    steps: [
      'Làm lạnh ly champagne flute trước.',
      'Rót nước cam + nước cốt chanh vào ly.',
      'Thêm soda nhẹ nhàng.',
      'Nhỏ từng giọt grenadine xuống đáy (tạo lớp đỏ).',
      'Cuối cùng nhỏ blue syrup ở giữa (tạo lớp xanh).',
      'Không khuấy – giữ 3 lớp màu rõ ràng.',
    ],
    note: '🌅 Signature drink của Gōkon – phục vụ với MATCHED couples!',
  },
];

const STATUS_CONFIG = {
  PENDING: { label: 'Chờ xử lý', color: '#FF9500', nextStatus: 'PREPARING', nextLabel: '▶ Bắt đầu pha' },
  PREPARING: { label: 'Đang pha', color: '#4A90E2', nextStatus: 'SERVED', nextLabel: '✅ Đã phục vụ' },
  SERVED: { label: 'Đã phục vụ', color: COLORS.matched, nextStatus: null, nextLabel: null },
  CANCELLED: { label: 'Đã huỷ', color: COLORS.reject, nextStatus: null, nextLabel: null },
};

const CATEGORY_LABEL: Record<string, { label: string; color: string }> = {
  cocktail: { label: 'Cocktail', color: '#FF6B9D' },
  mocktail: { label: 'Mocktail', color: '#34C759' },
  coffee: { label: 'Coffee', color: '#8B4513' },
  softdrink: { label: 'Soft Drink', color: '#4A90E2' },
};

const DIFFICULTY_COLOR: Record<string, string> = {
  'Dễ': '#34C759',
  'Vừa': '#FF9500',
  'Khó': '#FF3B62',
};

export default function StaffOrderDashboard() {
  const { user, logout } = useAuthStore();
  const { sessionId: sessionIdParam } = useLocalSearchParams<{ sessionId?: string }>();
  const sessionId = sessionIdParam ?? '';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'recipes'>('orders');
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

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

  const switchTab = (tab: 'orders' | 'recipes') => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setActiveTab(tab);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  };

  const toggleRecipe = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedRecipe(expandedRecipe === id ? null : id);
  };

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

  const filteredRecipes = filterCategory
    ? DRINK_RECIPES.filter((r) => r.category === filterCategory)
    : DRINK_RECIPES;

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

  const renderRecipe = (recipe: DrinkRecipe) => {
    const isExpanded = expandedRecipe === recipe.id;
    const catStyle = CATEGORY_LABEL[recipe.category];
    return (
      <View key={recipe.id} style={styles.recipeCard}>
        <TouchableOpacity style={styles.recipeHeader} onPress={() => toggleRecipe(recipe.id)} activeOpacity={0.8}>
          <Text style={styles.recipeEmoji}>{recipe.emoji}</Text>
          <View style={styles.recipeTitleBlock}>
            <Text style={styles.recipeName}>{recipe.name}</Text>
            <View style={styles.recipeMetaRow}>
              <View style={[styles.catBadge, { backgroundColor: catStyle.color + '20' }]}>
                <Text style={[styles.catBadgeText, { color: catStyle.color }]}>{catStyle.label}</Text>
              </View>
              <Text style={[styles.diffBadge, { color: DIFFICULTY_COLOR[recipe.difficulty] }]}>
                ● {recipe.difficulty}
              </Text>
              <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
              <Text style={styles.recipeTime}>{recipe.time}</Text>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.recipeBody}>
            <View style={styles.recipeGlassRow}>
              <Ionicons name="wine-outline" size={14} color={COLORS.secondary} />
              <Text style={styles.recipeGlass}>Dụng cụ: {recipe.glass}</Text>
            </View>

            {/* Ingredients */}
            <Text style={styles.recipeSection}>🧪 Nguyên liệu</Text>
            {recipe.ingredients.map((ing, i) => (
              <View key={i} style={styles.ingredientRow}>
                <View style={styles.ingredientDot} />
                <Text style={styles.ingredientName}>{ing.name}</Text>
                <Text style={styles.ingredientAmount}>{ing.amount}</Text>
              </View>
            ))}

            {/* Steps */}
            <Text style={styles.recipeSection}>📋 Các bước thực hiện</Text>
            {recipe.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}

            {recipe.note && (
              <View style={styles.recipeNote}>
                <Text style={styles.recipeNoteText}>{recipe.note}</Text>
              </View>
            )}
          </View>
        )}
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

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'orders' && styles.tabItemActive]}
          onPress={() => switchTab('orders')}
        >
          <Ionicons
            name="receipt-outline"
            size={18}
            color={activeTab === 'orders' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabLabel, activeTab === 'orders' && styles.tabLabelActive]}>
            Đơn hàng
            {pendingCount > 0 && (
              <Text style={styles.tabBadge}> ({pendingCount})</Text>
            )}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'recipes' && styles.tabItemActive]}
          onPress={() => switchTab('recipes')}
        >
          <Ionicons
            name="flask-outline"
            size={18}
            color={activeTab === 'recipes' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabLabel, activeTab === 'recipes' && styles.tabLabelActive]}>
            Công thức pha chế
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
        {activeTab === 'orders' ? (
          <>
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
          </>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.recipeList}>
            <Text style={styles.recipesTitle}>🍹 Công thức pha chế</Text>
            <Text style={styles.recipesSubtitle}>Tap vào từng công thức để xem chi tiết</Text>

            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              {[null, 'mocktail', 'coffee', 'cocktail', 'softdrink'].map((cat) => (
                <TouchableOpacity
                  key={cat ?? 'all'}
                  style={[styles.filterChip, filterCategory === cat && styles.filterChipActive]}
                  onPress={() => setFilterCategory(cat)}
                >
                  <Text style={[styles.filterChipText, filterCategory === cat && styles.filterChipTextActive]}>
                    {cat === null ? 'Tất cả' : CATEGORY_LABEL[cat].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filteredRecipes.map(renderRecipe)}
          </ScrollView>
        )}
      </Animated.View>
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

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: COLORS.primary },
  tabLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '600' },
  tabLabelActive: { color: COLORS.primary },
  tabBadge: { color: '#FF9500', fontWeight: '800' },
  tabContent: { flex: 1 },

  // Orders
  statsRow: { flexDirection: 'row', padding: SPACING.base, gap: SPACING.sm },
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

  // Recipes
  recipeList: { padding: SPACING.base, paddingBottom: SPACING.xxxl },
  recipesTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  recipesSubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.md },
  filterRow: { marginBottom: SPACING.md },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  recipeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  recipeEmoji: { fontSize: 28 },
  recipeTitleBlock: { flex: 1 },
  recipeName: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  recipeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: 4 },
  catBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  catBadgeText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  diffBadge: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  recipeTime: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  recipeBody: {
    padding: SPACING.base,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  recipeGlassRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.md, marginTop: SPACING.md },
  recipeGlass: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  recipeSection: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm, marginTop: SPACING.sm },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    gap: SPACING.sm,
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  ingredientName: { flex: 1, fontSize: FONTS.sizes.base, color: COLORS.textPrimary },
  ingredientAmount: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '600' },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumberText: { fontSize: FONTS.sizes.xs, color: '#fff', fontWeight: '800' },
  stepText: { flex: 1, fontSize: FONTS.sizes.base, color: COLORS.textPrimary, lineHeight: 22 },
  recipeNote: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.accent + '20',
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  recipeNoteText: { fontSize: FONTS.sizes.sm, color: COLORS.textPrimary, lineHeight: 20 },
});
