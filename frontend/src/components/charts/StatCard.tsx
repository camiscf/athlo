import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';

// Mapeamento de nomes para ícones Feather
const iconMap: Record<string, string> = {
  running: 'zap',
  strength: 'target',
  distance: 'map-pin',
  time: 'clock',
  pace: 'trending-up',
  weight: 'disc',
  chart: 'bar-chart-2',
  sets: 'layers',
  reps: 'hash',
  calendar: 'calendar',
};

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: string;
  change?: number;
  changeLabel?: string;
  color?: string;
}

export default function StatCard({
  title,
  value,
  unit,
  icon,
  change,
  changeLabel,
  color,
}: StatCardProps) {
  const theme = useColors();
  const accentColor = color || theme.accent.primary;
  const hasChange = change !== undefined && change !== null;
  const isPositive = change && change > 0;

  const featherIcon = icon ? (iconMap[icon] || 'circle') : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background.secondary }]}>
      <View style={styles.header}>
        {featherIcon && (
          <Feather name={featherIcon as any} size={14} color={accentColor} style={styles.icon} />
        )}
        <Text style={[styles.title, { color: theme.text.secondary }]}>{title}</Text>
      </View>
      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
        {unit && <Text style={[styles.unit, { color: theme.text.secondary }]}>{unit}</Text>}
      </View>
      {hasChange && (
        <View style={styles.changeContainer}>
          <Text style={[
            styles.change,
            { color: isPositive ? theme.semantic.warning : theme.semantic.success }
          ]}>
            {isPositive ? '+' : ''}{typeof change === 'number' ? change.toFixed(1) : change}
          </Text>
          {changeLabel && (
            <Text style={[styles.changeLabel, { color: theme.text.secondary }]}>
              {changeLabel}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    minWidth: 140,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
  },
  unit: {
    fontSize: 14,
    marginLeft: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
  },
  changeLabel: {
    fontSize: 12,
    marginLeft: 4,
  },
});
