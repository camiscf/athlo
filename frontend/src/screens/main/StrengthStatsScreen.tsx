import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { api } from '../../services/api';
import {
  StrengthActivity,
  ExerciseHistory,
  PeriodType,
  ChartDataPoint,
} from '../../types';
import {
  StatCard,
  PeriodSelector,
  SimpleLineChart,
  SimpleBarChart,
} from '../../components/charts';
import {
  filterByPeriod,
  calculateStrengthStats,
  getMuscleGroupDistribution,
  getWorkoutVolumeChartData,
  formatDuration,
  formatDate,
} from '../../utils/statsCalculations';

export default function StrengthStatsScreen() {
  const theme = useColors();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [activities, setActivities] = useState<StrengthActivity[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await api.getStrengthActivities();
      setActivities(data);
    } catch (error) {
      console.error('Error loading strength stats:', error);
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

  const loadExerciseHistory = async (exerciseName: string) => {
    setSelectedExercise(exerciseName);
    setLoadingHistory(true);
    try {
      const history = await api.getExerciseHistory(exerciseName, 20);
      setExerciseHistory(history);
    } catch (error) {
      console.error('Error loading exercise history:', error);
      setExerciseHistory(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filter by period
  const filteredActivities = filterByPeriod(activities, period);
  const stats = calculateStrengthStats(filteredActivities);

  // Chart data
  const muscleGroupData = getMuscleGroupDistribution(filteredActivities);
  const volumeChartData = getWorkoutVolumeChartData(filteredActivities.slice(-15));

  // Get unique exercises for selection
  const allExercises = new Set<string>();
  filteredActivities.forEach(activity => {
    activity.exercises.forEach(ex => allExercises.add(ex.exercise_name));
  });
  const exerciseList = Array.from(allExercises).sort();

  // Exercise history chart data
  const exerciseChartData: ChartDataPoint[] = exerciseHistory?.records.map(r => ({
    value: r.weight || 0,
    label: formatDate(r.date),
    date: r.date,
  })) || [];

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
            title="Treinos"
            value={stats.totalWorkouts}
            icon="strength"
            color={theme.semantic.warning}
          />
          <StatCard
            title="Séries"
            value={stats.totalSets}
            icon="sets"
            color={theme.accent.primary}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Exercícios"
            value={stats.totalExercises}
            icon="chart"
            color={theme.semantic.success}
          />
          <StatCard
            title="Tempo médio"
            value={Math.round(stats.averageWorkoutDuration / 60)}
            unit="min"
            icon="time"
            color={theme.semantic.info}
          />
        </View>

        {/* Muscle Group Distribution */}
        <SimpleBarChart
          data={muscleGroupData}
          title="Grupos Musculares Trabalhados"
          color={theme.semantic.warning}
        />

        {/* Volume Over Time */}
        <SimpleLineChart
          data={volumeChartData}
          title="Séries por Treino"
          color={theme.accent.primary}
        />

        {/* Exercise Progression */}
        <View style={[styles.exerciseCard, { backgroundColor: theme.background.secondary }]}>
          <Text style={[styles.exerciseTitle, { color: theme.text.primary }]}>Progressão por Exercício</Text>

          {exerciseList.length > 0 ? (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.exerciseSelector}
                contentContainerStyle={styles.exerciseSelectorContent}
              >
                {exerciseList.map((exercise) => (
                  <TouchableOpacity
                    key={exercise}
                    style={[
                      styles.exerciseButton,
                      { backgroundColor: theme.background.tertiary },
                      selectedExercise === exercise && { backgroundColor: theme.accent.primary },
                    ]}
                    onPress={() => loadExerciseHistory(exercise)}
                  >
                    <Text
                      style={[
                        styles.exerciseButtonText,
                        { color: theme.text.primary },
                        selectedExercise === exercise && { color: '#000000' },
                      ]}
                      numberOfLines={1}
                    >
                      {exercise}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {loadingHistory && (
                <View style={styles.historyLoading}>
                  <ActivityIndicator size="small" color={theme.accent.primary} />
                </View>
              )}

              {selectedExercise && exerciseHistory && !loadingHistory && (
                <View style={styles.historyChart}>
                  {exerciseChartData.length > 0 ? (
                    <SimpleLineChart
                      data={exerciseChartData}
                      title={`${selectedExercise} - Peso (kg)`}
                      color={theme.semantic.success}
                    />
                  ) : (
                    <Text style={[styles.noHistoryText, { color: theme.text.secondary }]}>
                      Sem histórico de peso para este exercício
                    </Text>
                  )}
                </View>
              )}

              {!selectedExercise && (
                <Text style={[styles.selectExerciseText, { color: theme.text.secondary }]}>
                  Selecione um exercício para ver a progressão
                </Text>
              )}
            </>
          ) : (
            <Text style={[styles.noExercisesText, { color: theme.text.secondary }]}>
              Nenhum exercício registrado neste período
            </Text>
          )}
        </View>

        {/* Most Worked */}
        {stats.mostWorkedMuscleGroup && (
          <View style={[styles.highlightCard, { backgroundColor: theme.background.secondary }]}>
            <Text style={[styles.highlightLabel, { color: theme.text.secondary }]}>Grupo mais treinado</Text>
            <Text style={[styles.highlightValue, { color: theme.accent.primary }]}>{stats.mostWorkedMuscleGroup}</Text>
          </View>
        )}

        {/* Empty State */}
        {stats.totalWorkouts === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: theme.background.secondary }]}>
            <Feather name="target" size={48} color={theme.text.tertiary} style={styles.emptyIcon} />
            <Text style={[styles.emptyText, { color: theme.text.primary }]}>
              Nenhum treino registrado neste período
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.text.secondary }]}>
              Registre seus treinos para ver estatísticas detalhadas
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
  exerciseCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  exerciseSelector: {
    marginBottom: 16,
  },
  exerciseSelectorContent: {
    gap: 8,
  },
  exerciseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  exerciseButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  historyLoading: {
    padding: 32,
    alignItems: 'center',
  },
  historyChart: {
    marginTop: 8,
  },
  selectExerciseText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  noExercisesText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  noHistoryText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  highlightCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  highlightLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  highlightValue: {
    fontSize: 24,
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
