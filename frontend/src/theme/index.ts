/**
 * Athlo Design System
 *
 * Estética: Minimalista Premium
 * Tema Principal: Dark Mode
 * Cor de Destaque: Amber/Dourado (#F59E0B)
 *
 * Uso:
 * import { colors, typography, spacing, borderRadius } from '@/theme';
 * import { useTheme } from '@/context/ThemeContext';
 */

// Cores
export { colors } from './colors';
export type { ColorScheme, ThemeMode } from './colors';

// Tipografia
export {
  fontSizes,
  lineHeights,
  fontWeights,
  typography
} from './typography';
export type { TypographyVariant } from './typography';

// Espaçamento, Radius e Sombras
export {
  spacing,
  borderRadius,
  shadows,
  iconSizes,
  layout
} from './spacing';
export type { SpacingKey, BorderRadiusKey, ShadowKey } from './spacing';

// ============================================
// THEME OBJECT COMPLETO
// ============================================
import { colors } from './colors';
import { typography, fontSizes, fontWeights } from './typography';
import { spacing, borderRadius, shadows, iconSizes, layout } from './spacing';

export const theme = {
  colors,
  typography,
  fontSizes,
  fontWeights,
  spacing,
  borderRadius,
  shadows,
  iconSizes,
  layout,
} as const;

export type Theme = typeof theme;
