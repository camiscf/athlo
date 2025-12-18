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
import { Feather } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
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
  const theme = useColors();
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
      <View style={[styles.loadingContainer, { backgroundColor: theme.background.primary }]}>
        <ActivityIndicator size="large" color={theme.accent.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.accent.primary]}
            tintColor={theme.accent.primary}
          />
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
            icon="distance"
            color={theme.accent.primary}
          />
          <StatCard
            title="Tempo Total"
            value={formatDuration(stats.totalDuration)}
            icon="time"
            color={theme.semantic.warning}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Corridas"
            value={stats.totalActivities}
            icon="running"
            color={theme.semantic.success}
          />
          <StatCard
            title="Pace Médio"
            value={formatPace(stats.averagePace)}
            unit="/km"
            icon="pace"
            color={theme.semantic.info}
          />
        </View>

        {/* Distance Chart */}
        <SimpleLineChart
          data={distanceChartData}
          title="Distância por Corrida"
          color={theme.accent.primary}
          unit="km"
        />

        {/* Pace Chart */}
        <SimpleLineChart
          data={paceChartData}
          title="Pace por Corrida"
          color={theme.semantic.warning}
          unit="min/km"
          formatValue={(v) => formatPace(v * 60)}
        />

        {/* Weekly Distance */}
        <SimpleBarChart
          data={weeklyData}
          title="Distância Semanal"
          color={theme.semantic.success}
          unit="km"
        />

        {/* Records */}
        <View style={[styles.recordsCard, { backgroundColor: theme.background.secondary }]}>
          <Text style={[styles.recordsTitle, { color: theme.text.primary }]}>Recordes</Text>
          <View style={styles.recordsGrid}>
            <View style={styles.recordItem}>
              <Text style={[styles.recordLabel, { color: theme.text.secondary }]}>Corrida mais longa</Text>
              <Text style={[styles.recordValue, { color: theme.accent.primary }]}>
                {formatDistance(stats.longestRun)} km
              </Text>
            </View>
            <View style={styles.recordItem}>
              <Text style={[styles.recordLabel, { color: theme.text.secondary }]}>Pace mais rápido</Text>
              <Text style={[styles.recordValue, { color: theme.accent.primary }]}>
                {formatPace(stats.fastestPace)} /km
              </Text>
            </View>
            <View style={styles.recordItem}>
              <Text style={[styles.recordLabel, { color: theme.text.secondary }]}>Média por corrida</Text>
              <Text style={[styles.recordValue, { color: theme.accent.primary }]}>
                {formatDistance(stats.averageDistance)} km
              </Text>
            </View>
            <View style={styles.recordItem}>
              <Text style={[styles.recordLabel, { color: theme.text.secondary }]}>Total de atividades</Text>
              <Text style={[styles.recordValue, { color: theme.accent.primary }]}>{stats.totalActivities}</Text>
            </View>
          </View>
        </View>

        {/* Empty State */}
        {stats.totalActivities === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: theme.background.secondary }]}>
            <Feather name="zap" size={48} color={theme.text.tertiary} style={styles.emptyIcon} />
            <Text style={[styles.emptyText, { color: theme.text.primary }]}>
              Nenhuma corrida registrada neste período
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.text.secondary }]}>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  recordsTitle: {
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 4,
  },
  recordValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
