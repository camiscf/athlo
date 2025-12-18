/**
 * Athlo Design System - Cores
 * Estética: Premium Fitness - Dark mode com verde vibrante
 * Inspirado no design FitCore
 */

export const colors = {
  // ============================================
  // DARK MODE - PREMIUM FITNESS
  // ============================================
  dark: {
    // Backgrounds - Preto profundo com tons verdes
    background: {
      primary: '#0A0F0D',     // Fundo principal - quase preto
      secondary: '#111916',   // Cards, containers
      tertiary: '#1A2420',    // Inputs, elementos elevados
      elevated: '#243028',    // Hover states, destaques
    },

    // Texto - Alto contraste
    text: {
      primary: '#FFFFFF',     // Títulos - branco puro
      secondary: '#9CA3AF',   // Labels, descrições
      tertiary: '#6B7280',    // Placeholders, hints
      disabled: '#374151',    // Estados desabilitados
    },

    // Cor de Destaque (Verde vibrante - Energia fitness)
    accent: {
      primary: '#22C55E',     // Verde vibrante - principal
      light: '#4ADE80',       // Hover states
      dark: '#16A34A',        // Pressed states
      muted: '#22C55E15',     // Backgrounds sutis
    },

    // Estados Semânticos
    semantic: {
      success: '#22C55E',         // Verde
      successMuted: '#22C55E15',
      warning: '#F59E0B',         // Amarelo/laranja
      warningMuted: '#F59E0B15',
      error: '#EF4444',           // Vermelho
      errorMuted: '#EF444415',
      info: '#3B82F6',            // Azul
      infoMuted: '#3B82F615',
    },

    // Borders - Sutis com tom verde
    border: {
      primary: '#1F2A25',
      secondary: '#2D3B34',
      accent: '#22C55E',
    },
  },

  // ============================================
  // LIGHT MODE (Secundário)
  // ============================================
  light: {
    // Backgrounds
    background: {
      primary: '#FAFAFA',     // Fundo principal
      secondary: '#FFFFFF',   // Cards, containers
      tertiary: '#F4F4F5',    // Inputs
      elevated: '#E4E4E7',    // Hover states
    },

    // Texto
    text: {
      primary: '#18181B',     // Títulos
      secondary: '#52525B',   // Labels
      tertiary: '#A1A1AA',    // Placeholders
      disabled: '#D4D4D8',    // Estados desabilitados
    },

    // Cor de Destaque (Verde Menta) - mesma do dark
    accent: {
      primary: '#22C55E',     // Verde (mais escuro para light mode)
      light: '#4ADE80',
      dark: '#16A34A',
      muted: '#22C55E12',
    },

    // Estados Semânticos - mesmos do dark
    semantic: {
      success: '#22C55E',
      successMuted: '#22C55E1A',
      warning: '#EAB308',
      warningMuted: '#EAB3081A',
      error: '#EF4444',
      errorMuted: '#EF44441A',
      info: '#3B82F6',
      infoMuted: '#3B82F61A',
    },

    // Borders
    border: {
      primary: '#E4E4E7',
      secondary: '#D4D4D8',
      accent: '#22C55E',
    },
  },

  // ============================================
  // CORES PARA GRÁFICOS
  // ============================================
  chart: {
    primary: '#22C55E',           // Série principal - verde
    secondary: '#22C55E66',       // Série secundária (40% opacity)
    comparison: '#6B7280',        // Série de comparação
    grid: '#1F2A25',              // Linhas de grid
    positive: '#22C55E',          // Trends positivos
    negative: '#EF4444',          // Trends negativos
  },

  // ============================================
  // CORES PARA TIPOS DE ATIVIDADE
  // ============================================
  activity: {
    running: '#22C55E',           // Corrida - verde (principal)
    strength: '#3B82F6',          // Força - azul
    cycling: '#EC4899',           // Ciclismo - rosa
    swimming: '#06B6D4',          // Natação - cyan
    other: '#6B7280',             // Outros - cinza
  },
} as const;

// Tipo para acesso às cores
export type ColorScheme = typeof colors.dark;
export type ThemeMode = 'dark' | 'light';
