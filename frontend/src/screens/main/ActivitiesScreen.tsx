import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { RunningActivity, StrengthActivity } from '../../types';

type Activity = (RunningActivity & { type: 'running' }) | (StrengthActivity & { type: 'strength' });

export default function ActivitiesScreen() {
  const navigation = useNavigation();
  const theme = useColors();
  const [activities, setActivities] = useState<Activity[]>([]);
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

      const runningWithType = runningData.map(a => ({ ...a, type: 'running' as const }));
      const strengthWithType = strengthData.map(a => ({ ...a, type: 'strength' as const }));

      const combined = [...runningWithType, ...strengthWithType].sort(
        (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );

      setActivities(combined);
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

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  function getEffortLabel(effort: number | null | undefined): string {
    if (!effort) return '';
    if (effort <= 2) return 'Muito fácil';
    if (effort <= 4) return 'Fácil';
    if (effort <= 6) return 'Moderado';
    if (effort <= 8) return 'Difícil';
    return 'Máximo';
  }

  function getEffortColor(effort: number | null | undefined): string {
    if (!effort) return theme.text.secondary;
    if (effort <= 2) return theme.semantic.success;
    if (effort <= 4) return '#30D158';
    if (effort <= 6) return theme.semantic.warning;
    if (effort <= 8) return '#FF6B35';
    return theme.semantic.error;
  }

  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }

  function handleActivityPress(item: Activity) {
    if (item.type === 'running') {
      (navigation as any).navigate('ActivityDetail', { activityId: item.id });
    } else {
      (navigation as any).navigate('StrengthActivityDetail', { activityId: item.id });
    }
  }

  function renderActivityCard({ item }: { item: Activity }) {
    if (item.type === 'strength') {
      return (
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.background.secondary }]}
          activeOpacity={0.7}
          onPress={() => handleActivityPress(item)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Feather name="target" size={16} color={theme.accent.primary} style={styles.activityIcon} />
              <Text style={[styles.cardTitle, { color: theme.text.primary }]} numberOfLines={1}>
                {item.title || item.division_name || 'Treino de Força'}
              </Text>
            </View>
            <Text style={[styles.cardDate, { color: theme.text.secondary }]}>
              {formatDate(item.start_time)}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValueStrength, { color: theme.semantic.success }]}>
                {item.exercises.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>exercícios</Text>
            </View>

            {item.duration && (
              <View style={styles.stat}>
                <Text style={[styles.statValueStrength, { color: theme.semantic.success }]}>
                  {formatDuration(item.duration)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.text.secondary }]}>duração</Text>
              </View>
            )}
          </View>

          {item.effort && (
            <View style={styles.effortRow}>
              <View
                style={[
                  styles.effortBadge,
                  { backgroundColor: getEffortColor(item.effort) },
                ]}
              >
                <Text style={[styles.effortText, { color: theme.text.primary }]}>
                  {getEffortLabel(item.effort)}
                </Text>
              </View>
            </View>
          )}

          {item.notes && (
            <Text style={[styles.notes, { color: theme.text.secondary }]} numberOfLines={2}>
              {item.notes}
            </Text>
          )}
        </TouchableOpacity>
      );
    }

    // Running activity
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.background.secondary }]}
        activeOpacity={0.7}
        onPress={() => handleActivityPress(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Feather name="zap" size={16} color={theme.accent.primary} style={styles.activityIcon} />
            <Text style={[styles.cardTitle, { color: theme.text.primary }]} numberOfLines={1}>
              {item.title || 'Corrida'}
            </Text>
          </View>
          <Text style={[styles.cardDate, { color: theme.text.secondary }]}>
            {formatDate(item.start_time)}
          </Text>
        </View>

        <View style={styles.statsRow}>
          {item.distance !== null && (
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.accent.primary }]}>
                {item.distance.toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>km</Text>
            </View>
          )}

          {item.duration_formatted && (
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.accent.primary }]}>
                {item.duration_formatted}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>tempo</Text>
            </View>
          )}

          {item.pace_formatted && (
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.accent.primary }]}>
                {item.pace_formatted}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>pace</Text>
            </View>
          )}
        </View>

        {item.effort && (
          <View style={styles.effortRow}>
            <View
              style={[
                styles.effortBadge,
                { backgroundColor: getEffortColor(item.effort) },
              ]}
            >
              <Text style={[styles.effortText, { color: theme.text.primary }]}>
                {getEffortLabel(item.effort)}
              </Text>
            </View>
          </View>
        )}

        {item.notes && (
          <Text style={[styles.notes, { color: theme.text.secondary }]} numberOfLines={2}>
            {item.notes}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  function renderEmptyList() {
    return (
      <View style={styles.emptyContainer}>
        <Feather name="inbox" size={48} color={theme.text.tertiary} style={styles.emptyIcon} />
        <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>Nenhuma atividade</Text>
        <Text style={[styles.emptyDescription, { color: theme.text.secondary }]}>
          Registre uma corrida ou treino de força
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background.primary }]}>
        <ActivityIndicator size="large" color={theme.accent.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={renderActivityCard}
        contentContainerStyle={
          activities.length === 0 ? styles.emptyListContent : styles.listContent
        }
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadActivities(true)}
            colors={[theme.accent.primary]}
            tintColor={theme.accent.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
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
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  activityIcon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  cardDate: {
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  stat: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statValueStrength: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  effortRow: {
    marginTop: 12,
    flexDirection: 'row',
  },
  effortBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  effortText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notes: {
    marginTop: 12,
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: 'center',
  },
});
