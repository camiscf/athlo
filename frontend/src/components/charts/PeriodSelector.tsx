import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColors } from '../../context/ThemeContext';
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
  const theme = useColors();

  return (
    <View style={[styles.container, { backgroundColor: theme.background.tertiary }]}>
      {periods.map((period) => (
        <TouchableOpacity
          key={period.key}
          style={[
            styles.button,
            selected === period.key && [
              styles.buttonSelected,
              { backgroundColor: theme.background.secondary }
            ]
          ]}
          onPress={() => onSelect(period.key)}
        >
          <Text style={[
            styles.buttonText,
            { color: theme.text.secondary },
            selected === period.key && { color: theme.accent.primary, fontWeight: '600' }
          ]}>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
