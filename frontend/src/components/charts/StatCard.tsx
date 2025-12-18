import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
  color = '#007AFF',
}: StatCardProps) {
  const hasChange = change !== undefined && change !== null;
  const isPositive = change && change > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      {hasChange && (
        <View style={styles.changeContainer}>
          <Text style={[styles.change, isPositive ? styles.changeUp : styles.changeDown]}>
            {isPositive ? '+' : ''}{typeof change === 'number' ? change.toFixed(1) : change}
          </Text>
          {changeLabel && <Text style={styles.changeLabel}>{changeLabel}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
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
    fontSize: 16,
    marginRight: 6,
  },
  title: {
    fontSize: 13,
    color: '#8E8E93',
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
    color: '#8E8E93',
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
  changeUp: {
    color: '#FF9500',
  },
  changeDown: {
    color: '#34C759',
  },
  changeLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
});
