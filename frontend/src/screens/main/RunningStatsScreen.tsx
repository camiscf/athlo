import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { RunningActivity, PeriodType } from '../../types';
import {
  StatCard,
  PeriodSelector,
  SimpleLineChart,
  SimpleBarChart,
} from '../../components/charts';
import {
  filterByPeriod,
  calculateRunningStats,
  getRunningDistanceChartData,
  getRunningPaceChartData,
  getWeeklyDistanceData,
  formatPace,
  formatDistance,
  formatDuration,
} from '../../utils/statsCalculations';

export default function RunningStatsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [activities, setActivities] = useState<RunningActivity[]>([]);

  const loadData = useCallback(async () => {
    try {
      const data = await api.getRunningActivities();
      setActivities(data);
    } catch (error) {
      console.error('Error loading running stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // Filter by period
  const filteredActivities = filterByPeriod(activities, period);
  const stats = calculateRunningStats(filteredActivities);

  // Chart data
  const distanceChartData = getRunningDistanceChartData(filteredActivities.slice(-15));
  const paceChartData = getRunningPaceChartData(filteredActivities.slice(-15));
  const weeklyData = getWeeklyDistanceData(filteredActivities);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Period Selector */}
        <View style={styles.periodContainer}>
          <PeriodSelector selected={period} onSelect={setPeriod} />
        </View>

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <StatCard
            title="Distância Total"
            value={formatDistance(stats.totalDistance)}
            unit="km"
            icon="📏"
            color="#007AFF"
          />
          <StatCard
            title="Tempo Total"
            value={formatDuration(stats.totalDuration)}
            icon="⏱️"
            color="#FF9500"
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Corridas"
            value={stats.totalActivities}
            icon="🏃"
            color="#34C759"
          />
          <StatCard
            title="Pace Médio"
            value={formatPace(stats.averagePace)}
            unit="/km"
            icon="⚡"
            color="#5856D6"
          />
        </View>

        {/* Distance Chart */}
        <SimpleLineChart
          data={distanceChartData}
          title="Distância por Corrida"
          color="#007AFF"
          unit="km"
        />

        {/* Pace Chart */}
        <SimpleLineChart
          data={paceChartData}
          title="Pace por Corrida"
          color="#FF9500"
          unit="min/km"
          formatValue={(v) => formatPace(v * 60)}
        />

        {/* Weekly Distance */}
        <SimpleBarChart
          data={weeklyData}
          title="Distância Semanal"
          color="#34C759"
          unit="km"
        />

        {/* Records */}
        <View style={styles.recordsCard}>
          <Text style={styles.recordsTitle}>Recordes</Text>
          <View style={styles.recordsGrid}>
            <View style={styles.recordItem}>
              <Text style={styles.recordLabel}>Corrida mais longa</Text>
              <Text style={styles.recordValue}>
                {formatDistance(stats.longestRun)} km
              </Text>
            </View>
            <View style={styles.recordItem}>
              <Text style={styles.recordLabel}>Pace mais rápido</Text>
              <Text style={styles.recordValue}>
                {formatPace(stats.fastestPace)} /km
              </Text>
            </View>
            <View style={styles.recordItem}>
              <Text style={styles.recordLabel}>Média por corrida</Text>
              <Text style={styles.recordValue}>
                {formatDistance(stats.averageDistance)} km
              </Text>
            </View>
            <View style={styles.recordItem}>
              <Text style={styles.recordLabel}>Total de atividades</Text>
              <Text style={styles.recordValue}>{stats.totalActivities}</Text>
            </View>
          </View>
        </View>

        {/* Empty State */}
        {stats.totalActivities === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🏃</Text>
            <Text style={styles.emptyText}>
              Nenhuma corrida registrada neste período
            </Text>
            <Text style={styles.emptySubtext}>
              Registre suas corridas para ver estatísticas detalhadas
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  periodContainer: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  recordsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  recordsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  recordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recordItem: {
    width: '50%',
    paddingVertical: 8,
    paddingRight: 8,
  },
  recordLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  recordValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
