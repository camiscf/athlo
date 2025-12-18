import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useColors } from '../../context/ThemeContext';
import { ChartDataPoint } from '../../types';

interface SimpleBarChartProps {
  data: ChartDataPoint[];
  title?: string;
  color?: string;
  height?: number;
  unit?: string;
}

export default function SimpleBarChart({
  data,
  title,
  color,
  height = 180,
  unit,
}: SimpleBarChartProps) {
  const theme = useColors();
  const chartColor = color || theme.accent.primary;
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 80;

  if (data.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer, { backgroundColor: theme.background.secondary }]}>
        {title && <Text style={[styles.title, { color: theme.text.primary }]}>{title}</Text>}
        <Text style={[styles.emptyText, { color: theme.text.secondary }]}>Sem dados para exibir</Text>
      </View>
    );
  }

  // Transform data for gifted-charts
  const chartData = data.map((point) => ({
    value: point.value,
    label: point.label || '',
    frontColor: chartColor,
    topLabelComponent: () => (
      <Text style={[styles.barLabel, { color: theme.text.secondary }]}>{point.value.toFixed(1)}</Text>
    ),
  }));

  // Calculate bar width based on data points
  const barWidth = Math.max(20, Math.min(40, (chartWidth - 40) / data.length - 10));
  const spacing = Math.max(8, (chartWidth - barWidth * data.length) / (data.length + 1));

  return (
    <View style={[styles.container, { backgroundColor: theme.background.secondary }]}>
      {title && (
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text.primary }]}>{title}</Text>
          {unit && <Text style={[styles.unit, { color: theme.text.secondary }]}>{unit}</Text>}
        </View>
      )}
      <View style={styles.chartContainer}>
        <BarChart
          data={chartData}
          height={height}
          width={chartWidth}
          barWidth={barWidth}
          spacing={spacing}
          barBorderRadius={6}
          noOfSections={4}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={theme.border.primary}
          rulesType="dashed"
          rulesColor={theme.border.primary}
          yAxisTextStyle={[styles.axisLabel, { color: theme.text.secondary }]}
          xAxisLabelTextStyle={[styles.axisLabel, { color: theme.text.secondary }]}
          maxValue={Math.max(...data.map(d => d.value)) * 1.2}
          initialSpacing={15}
          disablePress
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  unit: {
    fontSize: 12,
  },
  chartContainer: {
    alignItems: 'center',
  },
  axisLabel: {
    fontSize: 10,
  },
  barLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
});
