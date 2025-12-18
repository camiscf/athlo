import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useColors } from '../../context/ThemeContext';
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
  color,
  height = 180,
  showDataPoints = true,
  unit,
  formatValue,
}: SimpleLineChartProps) {
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
    <View style={[styles.container, { backgroundColor: theme.background.secondary }]}>
      {title && (
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text.primary }]}>{title}</Text>
          {unit && <Text style={[styles.unit, { color: theme.text.secondary }]}>{unit}</Text>}
        </View>
      )}
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          height={height}
          width={chartWidth}
          spacing={spacing}
          color={chartColor}
          thickness={2}
          dataPointsColor={chartColor}
          dataPointsRadius={showDataPoints ? 4 : 0}
          startFillColor={`${chartColor}30`}
          endFillColor={`${chartColor}05`}
          areaChart
          curved
          hideRules={false}
          rulesType="dashed"
          rulesColor={theme.border.primary}
          xAxisColor={theme.border.primary}
          yAxisColor={theme.border.primary}
          yAxisTextStyle={[styles.axisLabel, { color: theme.text.secondary }]}
          xAxisLabelTextStyle={[styles.axisLabel, { color: theme.text.secondary }]}
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
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
});
