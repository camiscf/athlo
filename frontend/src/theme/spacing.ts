/**
 * Athlo Design System - Espaçamento, Border Radius e Sombras
 */

// ============================================
// ESPAÇAMENTO
// ============================================
export const spacing = {
  xs: 4,    // Margin mínima entre elementos relacionados
  sm: 8,    // Padding interno mínimo
  md: 12,   // Margin entre items de lista
  lg: 16,   // Padding padrão de containers
  xl: 24,   // Margin entre seções
  '2xl': 32, // Espaçamento grande
  '3xl': 48, // Hero sections
} as const;

// ============================================
// BORDER RADIUS
// ============================================
export const borderRadius = {
  sm: 6,        // Badges, tags
  md: 10,       // Botões, inputs
  lg: 14,       // Cards
  xl: 20,       // Modais, sheets
  full: 9999,   // Avatares, FABs
} as const;

// ============================================
// SOMBRAS (Dark Mode otimizado)
// ============================================
export const shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  // Glow amber para elementos destacados
  glow: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 0,
  },
} as const;

// ============================================
// TAMANHOS DE ÍCONES
// ============================================
export const iconSizes = {
  sm: 16,       // Ícones pequenos, inline
  md: 20,       // Navegação
  lg: 24,       // Ações
  xl: 32,       // Empty states
  '2xl': 48,    // Estados vazios grandes
} as const;

// ============================================
// LAYOUT HELPERS
// ============================================
export const layout = {
  // Padding padrão das telas
  screenPadding: spacing.lg,

  // Gap entre cards em grid
  cardGap: spacing.md,

  // Altura da tab bar
  tabBarHeight: 80,

  // Altura do header
  headerHeight: 56,

  // Tamanho do FAB
  fabSize: 56,
} as const;

export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
export type ShadowKey = keyof typeof shadows;
