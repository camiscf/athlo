import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { ChartDataPoint } from '../../types';

interface SimpleLineChartProps {
  data: ChartDataPoint[];
  title?: string;
  color?: string;
  height?: number;
  showDataPoints?: boolean;
  unit?: string;
  formatValue?: (value: number) => string;
}

export default function SimpleLineChart({
  data,
  title,
  color = '#007AFF',
  height = 180,
  showDataPoints = true,
  unit,
  formatValue,
}: SimpleLineChartProps) {
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
  const chartData = data.map((point, index) => ({
    value: point.value,
    label: index === 0 || index === data.length - 1 || index % Math.ceil(data.length / 4) === 0
      ? point.label || ''
      : '',
    dataPointText: formatValue ? formatValue(point.value) : undefined,
  }));

  // Calculate spacing based on data points
  const spacing = data.length > 1 ? Math.max(20, chartWidth / (data.length + 1)) : chartWidth / 2;

  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {unit && <Text style={styles.unit}>{unit}</Text>}
        </View>
      )}
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          height={height}
          width={chartWidth}
          spacing={spacing}
          color={color}
          thickness={2}
          dataPointsColor={color}
          dataPointsRadius={showDataPoints ? 4 : 0}
          startFillColor={`${color}30`}
          endFillColor={`${color}05`}
          areaChart
          curved
          hideRules={false}
          rulesType="dashed"
          rulesColor="#E5E5EA"
          xAxisColor="#E5E5EA"
          yAxisColor="#E5E5EA"
          yAxisTextStyle={styles.axisLabel}
          xAxisLabelTextStyle={styles.axisLabel}
          noOfSections={4}
          maxValue={Math.max(...data.map(d => d.value)) * 1.1}
          initialSpacing={20}
          endSpacing={20}
          adjustToWidth
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
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
});
