export const COLORS = {
  // Brand
  primary: '#FF6B9D',     // Gōkon pink
  primaryDark: '#E05080',
  primaryLight: '#FFB3CF',
  secondary: '#4A90E2',   // Blue accent
  accent: '#FFD700',      // Gold for promotions

  // Match
  heart: '#FF3B62',       // ❤️ red
  reject: '#8E8E93',      // ❌ grey

  // Status
  matched: '#34C759',     // Green – match success
  pending: '#FF9500',     // Orange – waiting
  notMatched: '#8E8E93',  // Grey – no match

  // UI
  background: '#FFF9FC',
  surface: '#FFFFFF',
  surfaceAlt: '#F8F0F5',
  border: '#E8D5E5',

  // Text
  textPrimary: '#1C1C1E',
  textSecondary: '#6C6C70',
  textMuted: '#AEAEB2',
  textOnPrimary: '#FFFFFF',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 30,
    xxxl: 36,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
};
