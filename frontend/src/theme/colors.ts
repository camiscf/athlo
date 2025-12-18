/**
 * Athlo Design System - Cores
 * Estética: Minimalista Premium
 * Tema Principal: Dark Mode com accent Amber/Dourado
 */

export const colors = {
  // ============================================
  // DARK MODE (Prioritário)
  // ============================================
  dark: {
    // Backgrounds
    background: {
      primary: '#0A0A0B',    // Fundo principal do app
      secondary: '#141416',   // Cards, modais, containers
      tertiary: '#1C1C1F',    // Inputs, elementos elevados
      elevated: '#252528',    // Hover states, elementos destacados
    },

    // Texto
    text: {
      primary: '#FAFAFA',     // Títulos, valores principais
      secondary: '#A1A1AA',   // Labels, descrições
      tertiary: '#71717A',    // Placeholders, hints
      disabled: '#52525B',    // Estados desabilitados
    },

    // Cor de Destaque (Amber/Dourado)
    accent: {
      primary: '#F59E0B',     // Botões principais, ícones ativos, CTAs
      light: '#FBBF24',       // Hover states, destaques
      dark: '#D97706',        // Pressed states
      muted: '#F59E0B1A',     // Backgrounds com accent (10% opacity)
    },

    // Estados Semânticos
    semantic: {
      success: '#22C55E',         // Metas atingidas, trends positivos
      successMuted: '#22C55E1A',  // Background de sucesso
      warning: '#EAB308',         // Alertas, atenção
      warningMuted: '#EAB3081A',  // Background de warning
      error: '#EF4444',           // Erros, trends negativos
      errorMuted: '#EF44441A',    // Background de erro
      info: '#3B82F6',            // Informações, dicas
      infoMuted: '#3B82F61A',     // Background de info
    },

    // Borders
    border: {
      primary: '#27272A',     // Borders de cards, divisores
      secondary: '#3F3F46',   // Borders de inputs, focus states
      accent: '#F59E0B',      // Focus com accent, selecionados
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

    // Cor de Destaque (Amber/Dourado) - mesma do dark
    accent: {
      primary: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
      muted: '#F59E0B1A',
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
      accent: '#F59E0B',
    },
  },

  // ============================================
  // CORES PARA GRÁFICOS
  // ============================================
  chart: {
    primary: '#F59E0B',           // Série principal
    secondary: '#F59E0B99',       // Série secundária (60% opacity)
    comparison: '#71717A',        // Série de comparação
    grid: '#27272A',              // Linhas de grid
    positive: '#22C55E',          // Trends positivos
    negative: '#EF4444',          // Trends negativos
  },

  // ============================================
  // CORES PARA TIPOS DE ATIVIDADE
  // ============================================
  activity: {
    running: '#F59E0B',           // Corrida - amber
    strength: '#22C55E',          // Força - verde
    cycling: '#3B82F6',           // Ciclismo - azul
    swimming: '#06B6D4',          // Natação - cyan
    other: '#A1A1AA',             // Outros - cinza
  },
} as const;

// Tipo para acesso às cores
export type ColorScheme = typeof colors.dark;
export type ThemeMode = 'dark' | 'light';
