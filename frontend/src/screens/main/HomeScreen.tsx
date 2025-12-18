import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { RunningActivity, StrengthActivity } from '../../types';

type Activity = (RunningActivity & { type: 'running' }) | (StrengthActivity & { type: 'strength' });

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const [runningActivities, setRunningActivities] = useState<RunningActivity[]>([]);
  const [strengthActivities, setStrengthActivities] = useState<StrengthActivity[]>([]);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadActivities = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    }

    try {
      const [runningData, strengthData] = await Promise.all([
        api.getRunningActivities(),
        api.getStrengthActivities(),
      ]);

      setRunningActivities(runningData);
      setStrengthActivities(strengthData);

      const runningWithType = runningData.map(a => ({ ...a, type: 'running' as const }));
      const strengthWithType = strengthData.map(a => ({ ...a, type: 'strength' as const }));

      const combined = [...runningWithType, ...strengthWithType].sort(
        (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );

      setAllActivities(combined);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadActivities();
    }, [loadActivities])
  );

  // Calcular estatísticas de corrida
  const totalDistance = runningActivities.reduce((sum, a) => sum + (a.distance || 0), 0);
  const totalRunningDuration = runningActivities.reduce((sum, a) => sum + (a.duration || 0), 0);
  const totalRunning = runningActivities.length;
  const totalStrength = strengthActivities.length;
  const totalActivities = totalRunning + totalStrength;

  // Atividades desta semana
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const thisWeekRunning = runningActivities.filter(a => new Date(a.start_time) >= startOfWeek);
  const thisWeekStrength = strengthActivities.filter(a => new Date(a.start_time) >= startOfWeek);
  const weekDistance = thisWeekRunning.reduce((sum, a) => sum + (a.distance || 0), 0);
  const weekActivitiesCount = thisWeekRunning.length + thisWeekStrength.length;

  // Últimas 3 atividades (combinadas)
  const recentActivities = allActivities.slice(0, 3);

  function formatDuration(seconds: number, short = false): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (short) {
      if (hours > 0) {
        return `${hours}h${minutes}m`;
      }
      return `${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => loadActivities(true)}
          colors={['#007AFF']}
          tintColor="#007AFF"
        />
      }
    >
      <View style={styles.content}>
        {/* Saudação */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0] || 'Atleta'}!</Text>
          <Text style={styles.subtitle}>Veja seu progresso</Text>
        </View>

        {/* Cards de estatísticas da semana */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Esta semana</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <Text style={styles.statValuePrimary}>{weekDistance.toFixed(1)}</Text>
              <Text style={styles.statLabelPrimary}>km percorridos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{weekActivitiesCount}</Text>
              <Text style={styles.statLabel}>atividades</Text>
            </View>
          </View>
        </View>

        {/* Cards de estatísticas totais */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Total geral</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('Stats')}>
              <Text style={styles.seeAll}>Ver estatísticas</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCardSmall}>
              <Text style={styles.statIcon}>🏃</Text>
              <Text style={[styles.statValueSmall, isSmallScreen && styles.statValueSmallCompact]}>
                {totalRunning}
              </Text>
              <Text style={styles.statLabelSmall}>corridas</Text>
            </View>
            <View style={styles.statCardSmall}>
              <Text style={styles.statIcon}>💪</Text>
              <Text style={[styles.statValueSmall, isSmallScreen && styles.statValueSmallCompact]}>
                {totalStrength}
              </Text>
              <Text style={styles.statLabelSmall}>treinos</Text>
            </View>
            <View style={styles.statCardSmall}>
              <Text style={styles.statIcon}>📏</Text>
              <Text style={[styles.statValueSmall, isSmallScreen && styles.statValueSmallCompact]}>
                {totalDistance.toFixed(1)}
              </Text>
              <Text style={styles.statLabelSmall}>km</Text>
            </View>
          </View>
        </View>

        {/* Botão Ver Estatísticas */}
        <TouchableOpacity
          style={styles.statsButton}
          onPress={() => (navigation as any).navigate('Stats')}
        >
          <Text style={styles.statsButtonIcon}>📊</Text>
          <View style={styles.statsButtonContent}>
            <Text style={styles.statsButtonTitle}>Ver Estatísticas Completas</Text>
            <Text style={styles.statsButtonSubtitle}>Gráficos e análise de desempenho</Text>
          </View>
          <Text style={styles.statsButtonArrow}>›</Text>
        </TouchableOpacity>

        {/* Atividades recentes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Atividades recentes</Text>
            {allActivities.length > 3 && (
              <TouchableOpacity onPress={() => (navigation as any).navigate('Activities')}>
                <Text style={styles.seeAll}>Ver todas</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentActivities.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>Nenhuma atividade ainda</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => (navigation as any).navigate('AddActivity')}
              >
                <Text style={styles.emptyButtonText}>Registrar primeira atividade</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recentActivities.map((activity) => (
              <View key={activity.id} style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <View style={styles.activityTitleRow}>
                    <Text style={styles.activityIcon}>
                      {activity.type === 'strength' ? '💪' : '🏃'}
                    </Text>
                    <Text style={styles.activityTitle} numberOfLines={1}>
                      {activity.type === 'strength'
                        ? (activity.title || activity.division_name || 'Treino de Força')
                        : (activity.title || 'Corrida')}
                    </Text>
                  </View>
                  <Text style={styles.activityDate}>{formatDate(activity.start_time)}</Text>
                </View>
                <View style={styles.activityStats}>
                  {activity.type === 'running' ? (
                    <>
                      {activity.distance !== null && (
                        <Text style={styles.activityStat}>
                          {activity.distance.toFixed(2)} km
                        </Text>
                      )}
                      {activity.duration_formatted && (
                        <Text style={styles.activityStat}>{activity.duration_formatted}</Text>
                      )}
                      {activity.pace_formatted && (
                        <Text style={styles.activityStat}>{activity.pace_formatted}/km</Text>
                      )}
                    </>
                  ) : (
                    <>
                      <Text style={styles.activityStatStrength}>
                        {activity.exercises.length} exercícios
                      </Text>
                      {activity.duration && (
                        <Text style={styles.activityStatStrength}>
                          {formatDuration(activity.duration, true)}
                        </Text>
                      )}
                    </>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
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
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statCardPrimary: {
    backgroundColor: '#007AFF',
    flex: 1.5,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
  },
  statValuePrimary: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  statLabelPrimary: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCardSmall: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    minWidth: 0,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  statValueSmall: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  statValueSmallCompact: {
    fontSize: 15,
  },
  statLabelSmall: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  activityIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  activityDate: {
    fontSize: 13,
    color: '#8E8E93',
  },
  activityStats: {
    flexDirection: 'row',
    gap: 16,
  },
  activityStat: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  activityStatStrength: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  statsButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  statsButtonIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  statsButtonContent: {
    flex: 1,
  },
  statsButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  statsButtonSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  statsButtonArrow: {
    fontSize: 24,
    color: '#C7C7CC',
    fontWeight: '300',
  },
});
