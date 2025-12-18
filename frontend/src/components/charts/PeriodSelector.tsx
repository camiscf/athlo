import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PeriodType } from '../../types';

interface PeriodSelectorProps {
  selected: PeriodType;
  onSelect: (period: PeriodType) => void;
}

const periods: { key: PeriodType; label: string }[] = [
  { key: 'week', label: '7 dias' },
  { key: 'month', label: '30 dias' },
  { key: 'year', label: '1 ano' },
  { key: 'all', label: 'Tudo' },
];

export default function PeriodSelector({ selected, onSelect }: PeriodSelectorProps) {
  return (
    <View style={styles.container}>
      {periods.map((period) => (
        <TouchableOpacity
          key={period.key}
          style={[styles.button, selected === period.key && styles.buttonSelected]}
          onPress={() => onSelect(period.key)}
        >
          <Text style={[styles.buttonText, selected === period.key && styles.buttonTextSelected]}>
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  buttonTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
