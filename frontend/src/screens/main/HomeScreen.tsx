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
  ImageBackground,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { RunningActivity, StrengthActivity } from '../../types';

type Activity = (RunningActivity & { type: 'running' }) | (StrengthActivity & { type: 'strength' });

interface QuickStartCardProps {
  icon: string;
  label: string;
  color: string;
  theme: any;
  onPress: () => void;
  selected?: boolean;
}

function QuickStartCard({ icon, label, color, theme, onPress, selected }: QuickStartCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.quickStartCard,
        { backgroundColor: theme.background.secondary },
        selected && { borderColor: theme.accent.primary, borderWidth: 2 },
      ]}
      onPress={onPress}
    >
      <View style={[styles.quickStartIconContainer, { backgroundColor: color + '20' }]}>
        <Feather name={icon as any} size={24} color={color} />
      </View>
      <Text style={[styles.quickStartLabel, { color: theme.text.primary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

interface WeeklyStatCardProps {
  icon: string;
  value: string;
  label: string;
  subtitle?: string;
  theme: any;
  isPrimary?: boolean;
}

function WeeklyStatCard({ icon, value, label, subtitle, theme, isPrimary }: WeeklyStatCardProps) {
  return (
    <View
      style={[
        styles.weeklyStatCard,
        { backgroundColor: isPrimary ? theme.accent.primary : theme.background.secondary },
      ]}
    >
      <View style={styles.weeklyStatHeader}>
        <Feather
          name={icon as any}
          size={18}
          color={isPrimary ? '#000000' : theme.accent.primary}
        />
      </View>
      <Text
        style={[
          styles.weeklyStatValue,
          { color: isPrimary ? '#000000' : theme.text.primary },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.weeklyStatLabel,
          { color: isPrimary ? 'rgba(0,0,0,0.7)' : theme.text.secondary },
        ]}
      >
        {label}
      </Text>
      {subtitle && (
        <Text
          style={[
            styles.weeklyStatSubtitle,
            { color: isPrimary ? 'rgba(0,0,0,0.5)' : theme.text.tertiary },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

interface GoalProgressProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  theme: any;
}

function GoalProgress({ label, current, target, unit, theme }: GoalProgressProps) {
  const progress = Math.min((current / target) * 100, 100);
  return (
    <View style={styles.goalItem}>
      <View style={styles.goalHeader}>
        <Text style={[styles.goalLabel, { color: theme.text.primary }]}>{label}</Text>
        <Text style={[styles.goalValue, { color: theme.text.secondary }]}>
          {current.toFixed(1)}/{target} {unit}
        </Text>
      </View>
      <View style={[styles.goalBarBg, { backgroundColor: theme.background.tertiary }]}>
        <View
          style={[
            styles.goalBarFill,
            { backgroundColor: theme.accent.primary, width: `${progress}%` },
          ]}
        />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const theme = useColors();
  const { width } = useWindowDimensions();
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

  // Calcular estatísticas
  const totalDistance = runningActivities.reduce((sum, a) => sum + (a.distance || 0), 0);
  const totalRunningDuration = runningActivities.reduce((sum, a) => sum + (a.duration || 0), 0);

  // Atividades desta semana
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const thisWeekRunning = runningActivities.filter(a => new Date(a.start_time) >= startOfWeek);
  const thisWeekStrength = strengthActivities.filter(a => new Date(a.start_time) >= startOfWeek);
  const weekDistance = thisWeekRunning.reduce((sum, a) => sum + (a.distance || 0), 0);
  const weekDuration = thisWeekRunning.reduce((sum, a) => sum + (a.duration || 0), 0) +
    thisWeekStrength.reduce((sum, a) => sum + (a.duration || 0), 0);
  const weekActivitiesCount = thisWeekRunning.length + thisWeekStrength.length;

  // Últimas 5 atividades
  const recentActivities = allActivities.slice(0, 5);

  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  }

  function getActivityIcon(type: string): string {
    switch (type) {
      case 'running': return 'activity';
      case 'strength': return 'target';
      default: return 'activity';
    }
  }

  function getActivityColor(type: string): string {
    switch (type) {
      case 'running': return theme.accent.primary;
      case 'strength': return '#3B82F6';
      default: return theme.accent.primary;
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background.primary }]}>
        <ActivityIndicator size="large" color={theme.accent.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.primary }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => loadActivities(true)}
          colors={[theme.accent.primary]}
          tintColor={theme.accent.primary}
        />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: theme.text.secondary }]}>
              Bem-vindo de volta
            </Text>
            <Text style={[styles.userName, { color: theme.text.primary }]}>
              {user?.name?.split(' ')[0] || 'Atleta'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.avatarContainer, { backgroundColor: theme.background.secondary }]}
            onPress={() => (navigation as any).navigate('Profile')}
          >
            <Feather name="user" size={22} color={theme.accent.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Start */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Iniciar Treino</Text>
          <View style={styles.quickStartGrid}>
            <QuickStartCard
              icon="activity"
              label="Corrida"
              color={theme.accent.primary}
              theme={theme}
              onPress={() => (navigation as any).navigate('AddActivity', { activityType: 'running' })}
            />
            <QuickStartCard
              icon="droplet"
              label="Natacao"
              color="#06B6D4"
              theme={theme}
              onPress={() => (navigation as any).navigate('AddActivity', { activityType: 'swimming' })}
            />
            <QuickStartCard
              icon="disc"
              label="Ciclismo"
              color="#EC4899"
              theme={theme}
              onPress={() => (navigation as any).navigate('AddActivity', { activityType: 'cycling' })}
            />
            <QuickStartCard
              icon="target"
              label="Academia"
              color="#3B82F6"
              theme={theme}
              onPress={() => (navigation as any).navigate('Divisions')}
            />
          </View>
        </View>

        {/* Weekly Progress */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Progresso Semanal
            </Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('Stats')}>
              <Text style={[styles.seeAll, { color: theme.accent.primary }]}>Ver mais</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.weeklyStatsRow}>
            <WeeklyStatCard
              icon="clock"
              value={formatDuration(weekDuration)}
              label="Tempo Ativo"
              subtitle={`${weekActivitiesCount} treinos`}
              theme={theme}
              isPrimary
            />
            <WeeklyStatCard
              icon="map-pin"
              value={`${weekDistance.toFixed(1)}`}
              label="Distancia (km)"
              subtitle="corrida + ciclismo"
              theme={theme}
            />
          </View>
        </View>

        {/* My Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Minhas Metas</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: theme.accent.primary }]}>Editar</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.goalsCard, { backgroundColor: theme.background.secondary }]}>
            <GoalProgress
              label="Distancia Semanal"
              current={weekDistance}
              target={30}
              unit="km"
              theme={theme}
            />
            <GoalProgress
              label="Treinos Semanais"
              current={weekActivitiesCount}
              target={5}
              unit=""
              theme={theme}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Atividade Recente
            </Text>
            {allActivities.length > 5 && (
              <TouchableOpacity onPress={() => (navigation as any).navigate('Activities')}>
                <Text style={[styles.seeAll, { color: theme.accent.primary }]}>Ver todas</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentActivities.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.background.secondary }]}>
              <View style={[styles.emptyIconContainer, { backgroundColor: theme.accent.muted }]}>
                <Feather name="inbox" size={32} color={theme.accent.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>
                Nenhuma atividade ainda
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
                Comece seu primeiro treino agora
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: theme.accent.primary }]}
                onPress={() => (navigation as any).navigate('AddActivity')}
              >
                <Text style={styles.emptyButtonText}>Iniciar Treino</Text>
                <Feather name="arrow-right" size={18} color="#000000" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.activityList, { backgroundColor: theme.background.secondary }]}>
              {recentActivities.map((activity, index) => (
                <TouchableOpacity
                  key={activity.id}
                  style={[
                    styles.activityItem,
                    index !== recentActivities.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.border.primary,
                    },
                  ]}
                  onPress={() => {
                    if (activity.type === 'strength') {
                      (navigation as any).navigate('StrengthActivityDetail', { activityId: activity.id });
                    } else {
                      (navigation as any).navigate('ActivityDetail', { activityId: activity.id });
                    }
                  }}
                >
                  <View
                    style={[
                      styles.activityIconContainer,
                      { backgroundColor: getActivityColor(activity.type) + '20' },
                    ]}
                  >
                    <Feather
                      name={getActivityIcon(activity.type) as any}
                      size={18}
                      color={getActivityColor(activity.type)}
                    />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={[styles.activityTitle, { color: theme.text.primary }]} numberOfLines={1}>
                      {activity.type === 'strength'
                        ? (activity.title || activity.division_name || 'Treino de Forca')
                        : (activity.title || 'Corrida')}
                    </Text>
                    <Text style={[styles.activityMeta, { color: theme.text.secondary }]}>
                      {formatDate(activity.start_time)}
                      {activity.type === 'running' && activity.distance
                        ? ` • ${activity.distance.toFixed(1)} km`
                        : ''}
                      {activity.type === 'strength'
                        ? ` • ${activity.exercises.length} exercicios`
                        : ''}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={theme.text.tertiary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 20 }} />
      </View>
    </ScrollView>
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
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  headerLeft: {},
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 0,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickStartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  quickStartCard: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  quickStartIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickStartLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  weeklyStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  weeklyStatCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  weeklyStatHeader: {
    marginBottom: 12,
  },
  weeklyStatValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  weeklyStatLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  weeklyStatSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  goalsCard: {
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  goalItem: {},
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  goalValue: {
    fontSize: 13,
  },
  goalBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  activityList: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityMeta: {
    fontSize: 13,
  },
  emptyState: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});
