/**
 * Athlo Design System - Tipografia
 * Sistema tipográfico com escala e pesos definidos
 */

import { TextStyle } from 'react-native';

// ============================================
// TAMANHOS DE FONTE
// ============================================
export const fontSizes = {
  micro: 10,      // Tags, badges
  caption: 12,    // Labels, metadados
  bodySmall: 14,  // Texto secundário
  body: 16,       // Texto principal
  heading3: 18,   // Subtítulos, cards
  heading2: 22,   // Títulos de seção
  heading1: 28,   // Títulos de tela
  display: 36,    // Valores grandes de estatísticas
} as const;

// ============================================
// LINE HEIGHTS
// ============================================
export const lineHeights = {
  tight: 1.1,     // Display
  snug: 1.2,      // Headings
  normal: 1.4,    // Body small, captions
  relaxed: 1.5,   // Body text
} as const;

// ============================================
// FONT WEIGHTS
// ============================================
export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// ============================================
// ESTILOS DE TEXTO PRÉ-DEFINIDOS
// ============================================
export const typography = {
  // Display - Valores grandes
  display: {
    fontSize: fontSizes.display,
    lineHeight: fontSizes.display * lineHeights.tight,
    fontWeight: fontWeights.bold,
  } as TextStyle,

  // Heading 1 - Títulos de tela
  heading1: {
    fontSize: fontSizes.heading1,
    lineHeight: fontSizes.heading1 * lineHeights.snug,
    fontWeight: fontWeights.bold,
  } as TextStyle,

  // Heading 2 - Títulos de seção
  heading2: {
    fontSize: fontSizes.heading2,
    lineHeight: fontSizes.heading2 * lineHeights.snug,
    fontWeight: fontWeights.semibold,
  } as TextStyle,

  // Heading 3 - Subtítulos, cards
  heading3: {
    fontSize: fontSizes.heading3,
    lineHeight: fontSizes.heading3 * lineHeights.normal,
    fontWeight: fontWeights.semibold,
  } as TextStyle,

  // Body - Texto principal
  body: {
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * lineHeights.relaxed,
    fontWeight: fontWeights.regular,
  } as TextStyle,

  // Body Medium - Labels ativas
  bodyMedium: {
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * lineHeights.relaxed,
    fontWeight: fontWeights.medium,
  } as TextStyle,

  // Body Semibold - Botões
  bodySemibold: {
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * lineHeights.relaxed,
    fontWeight: fontWeights.semibold,
  } as TextStyle,

  // Body Small - Texto secundário
  bodySmall: {
    fontSize: fontSizes.bodySmall,
    lineHeight: fontSizes.bodySmall * lineHeights.relaxed,
    fontWeight: fontWeights.regular,
  } as TextStyle,

  // Caption - Labels, metadados
  caption: {
    fontSize: fontSizes.caption,
    lineHeight: fontSizes.caption * lineHeights.normal,
    fontWeight: fontWeights.regular,
  } as TextStyle,

  // Caption Medium
  captionMedium: {
    fontSize: fontSizes.caption,
    lineHeight: fontSizes.caption * lineHeights.normal,
    fontWeight: fontWeights.medium,
  } as TextStyle,

  // Micro - Tags, badges
  micro: {
    fontSize: fontSizes.micro,
    lineHeight: fontSizes.micro * lineHeights.normal,
    fontWeight: fontWeights.medium,
  } as TextStyle,
} as const;

export type TypographyVariant = keyof typeof typography;
