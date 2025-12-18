import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
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
  color = '#007AFF',
  height = 180,
  unit,
}: SimpleBarChartProps) {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 80;

  if (data.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.emptyText}>Sem dados para exibir</Text>
      </View>
    );
  }

  // Transform data for gifted-charts
  const chartData = data.map((point) => ({
    value: point.value,
    label: point.label || '',
    frontColor: color,
    topLabelComponent: () => (
      <Text style={styles.barLabel}>{point.value.toFixed(1)}</Text>
    ),
  }));

  // Calculate bar width based on data points
  const barWidth = Math.max(20, Math.min(40, (chartWidth - 40) / data.length - 10));
  const spacing = Math.max(8, (chartWidth - barWidth * data.length) / (data.length + 1));

  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {unit && <Text style={styles.unit}>{unit}</Text>}
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
          xAxisColor="#E5E5EA"
          rulesType="dashed"
          rulesColor="#E5E5EA"
          yAxisTextStyle={styles.axisLabel}
          xAxisLabelTextStyle={styles.axisLabel}
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
    backgroundColor: '#FFFFFF',
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
    color: '#000000',
  },
  unit: {
    fontSize: 12,
    color: '#8E8E93',
  },
  chartContainer: {
    alignItems: 'center',
  },
  axisLabel: {
    fontSize: 10,
    color: '#8E8E93',
  },
  barLabel: {
    fontSize: 10,
    color: '#8E8E93',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
});
