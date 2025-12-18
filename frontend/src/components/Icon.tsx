import React from 'react';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';

// Mapeamento de nomes semânticos para ícones Feather
const iconMap = {
  // Navegação
  home: 'home',
  list: 'list',
  activity: 'activity',
  user: 'user',
  settings: 'settings',

  // Atividades
  running: 'zap',
  strength: 'target',
  cycling: 'wind',
  swimming: 'droplet',

  // Stats
  chart: 'bar-chart-2',
  stats: 'trending-up',
  distance: 'map-pin',
  time: 'clock',
  pace: 'zap',
  weight: 'disc',
  reps: 'hash',
  sets: 'layers',

  // Ações
  add: 'plus',
  close: 'x',
  edit: 'edit-2',
  delete: 'trash-2',
  check: 'check',
  chevronRight: 'chevron-right',
  chevronLeft: 'chevron-left',

  // UI
  calendar: 'calendar',
  clock: 'clock',
  empty: 'inbox',
  search: 'search',
  filter: 'filter',
  play: 'play',
  pause: 'pause',

  // Body
  scale: 'percent',
  ruler: 'maximize-2',
  body: 'user',
} as const;

type IconName = keyof typeof iconMap;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export default function Icon({ name, size = 20, color }: IconProps) {
  const theme = useColors();
  const iconColor = color || theme.text.primary;
  const featherName = iconMap[name] || 'circle';

  return (
    <Feather
      name={featherName as any}
      size={size}
      color={iconColor}
    />
  );
}

export { IconName };
