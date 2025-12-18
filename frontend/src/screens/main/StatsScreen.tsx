import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api } from '../../services/api';
import {
  RunningActivity,
  StrengthActivity,
  WeightRecord,
  PeriodType,
} from '../../types';
import {
  StatCard,
  PeriodSelector,
  SimpleLineChart,
} from '../../components/charts';
import {
  filterByPeriod,
  calculateRunningStats,
  calculateStrengthStats,
  getWeightChartData,
  formatPace,
  formatDistance,
} from '../../utils/statsCalculations';

export default function StatsScreen() {
  const navigation = useNavigation<any>();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [period, setPeriod] = useState<PeriodType>('month');

  // Raw data
  const [runningActivities, setRunningActivities] = useState<RunningActivity[]>([]);
  const [strengthActivities, setStrengthActivities] = useState<StrengthActivity[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [running, strength, weight] = await Promise.all([
        api.getRunningActivities(),
        api.getStrengthActivities(),
        api.getWeightHistory(60),
      ]);
      setRunningActivities(running);
      setStrengthActivities(strength);
      setWeightHistory(weight);
    } catch (error) {
      console.error('Error loading stats:', error);
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

  // Filter data by period
  const filteredRunning = filterByPeriod(runningActivities, period);
  const filteredStrength = filterByPeriod(strengthActivities, period);

  // Calculate stats
  const runningStats = calculateRunningStats(filteredRunning);
  const strengthStats = calculateStrengthStats(filteredStrength);

  // Weight chart data
  const weightChartData = getWeightChartData(weightHistory.slice(-14));
  const currentWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : null;
  const weightChange = weightHistory.length >= 2
    ? weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight
    : null;

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

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            title="Distância"
            value={formatDistance(runningStats.totalDistance)}
            unit="km"
            icon="🏃"
            color="#007AFF"
          />
          <StatCard
            title="Treinos"
            value={strengthStats.totalWorkouts}
            icon="💪"
            color="#FF9500"
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Corridas"
            value={runningStats.totalActivities}
            icon="📊"
            color="#34C759"
          />
          <StatCard
            title="Peso"
            value={currentWeight ? currentWeight.toFixed(1) : '--'}
            unit="kg"
            icon="⚖️"
            change={weightChange || undefined}
            changeLabel="total"
            color="#5856D6"
          />
        </View>

        {/* Weight Trend Chart */}
        <SimpleLineChart
          data={weightChartData}
          title="Tendência de Peso"
          color="#5856D6"
          unit="kg"
        />

        {/* Section Links */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Estatísticas Detalhadas</Text>

          <TouchableOpacity
            style={styles.sectionLink}
            onPress={() => navigation.navigate('RunningStats')}
          >
            <View style={styles.sectionLinkContent}>
              <Text style={styles.sectionLinkIcon}>🏃</Text>
              <View>
                <Text style={styles.sectionLinkTitle}>Corrida</Text>
                <Text style={styles.sectionLinkSubtitle}>
                  {runningStats.totalActivities} atividades • {formatDistance(runningStats.totalDistance)} km
                </Text>
              </View>
            </View>
            <Text style={styles.sectionLinkArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sectionLink}
            onPress={() => navigation.navigate('StrengthStats')}
          >
            <View style={styles.sectionLinkContent}>
              <Text style={styles.sectionLinkIcon}>💪</Text>
              <View>
                <Text style={styles.sectionLinkTitle}>Força</Text>
                <Text style={styles.sectionLinkSubtitle}>
                  {strengthStats.totalWorkouts} treinos • {strengthStats.totalSets} séries
                </Text>
              </View>
            </View>
            <Text style={styles.sectionLinkArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Running Highlights */}
        {runningStats.totalActivities > 0 && (
          <View style={styles.highlightsCard}>
            <Text style={styles.highlightsTitle}>Destaques de Corrida</Text>
            <View style={styles.highlightsGrid}>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightValue}>
                  {formatDistance(runningStats.longestRun)}
                </Text>
                <Text style={styles.highlightLabel}>Mais longa (km)</Text>
              </View>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightValue}>
                  {formatPace(runningStats.fastestPace)}
                </Text>
                <Text style={styles.highlightLabel}>Pace mais rápido</Text>
              </View>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightValue}>
                  {formatDistance(runningStats.averageDistance)}
                </Text>
                <Text style={styles.highlightLabel}>Média (km)</Text>
              </View>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightValue}>
                  {formatPace(runningStats.averagePace)}
                </Text>
                <Text style={styles.highlightLabel}>Pace médio</Text>
              </View>
            </View>
          </View>
        )}

        {/* Strength Highlights */}
        {strengthStats.totalWorkouts > 0 && (
          <View style={styles.highlightsCard}>
            <Text style={styles.highlightsTitle}>Destaques de Força</Text>
            <View style={styles.highlightsGrid}>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightValue}>{strengthStats.totalSets}</Text>
                <Text style={styles.highlightLabel}>Séries totais</Text>
              </View>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightValue}>{strengthStats.totalExercises}</Text>
                <Text style={styles.highlightLabel}>Exercícios</Text>
              </View>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightValue}>
                  {strengthStats.mostWorkedMuscleGroup || '-'}
                </Text>
                <Text style={styles.highlightLabel}>Mais treinado</Text>
              </View>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightValue}>
                  {Math.round(strengthStats.averageWorkoutDuration / 60)}
                </Text>
                <Text style={styles.highlightLabel}>Min/treino</Text>
              </View>
            </View>
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
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  sectionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  sectionLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionLinkIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sectionLinkTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  sectionLinkSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  sectionLinkArrow: {
    fontSize: 24,
    color: '#C7C7CC',
    fontWeight: '300',
  },
  highlightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  highlightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  highlightItem: {
    width: '50%',
    paddingVertical: 8,
    paddingRight: 8,
  },
  highlightValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  highlightLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
});
