import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { StrengthActivity } from '../../types';

interface StrengthActivityDetailScreenProps {
  route: {
    params: {
      activityId: string;
    };
  };
  navigation: any;
}

export default function StrengthActivityDetailScreen({ route, navigation }: StrengthActivityDetailScreenProps) {
  const theme = useColors();
  const { activityId } = route.params;
  const [activity, setActivity] = useState<StrengthActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadActivity();
  }, [activityId]);

  async function loadActivity() {
    try {
      const data = await api.getStrengthActivity(activityId);
      setActivity(data);
    } catch (error) {
      console.error('Erro ao carregar treino:', error);
      showAlert('Erro', 'Não foi possível carregar o treino.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }

  function showAlert(title: string, message: string) {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    }
  }

  async function handleDelete() {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Tem certeza que deseja excluir este treino?')
      : true;

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await api.deleteStrengthActivity(activityId);
      showAlert('Sucesso', 'Treino excluído com sucesso.');
      navigation.goBack();
    } catch (error) {
      showAlert('Erro', 'Não foi possível excluir o treino.');
    } finally {
      setIsDeleting(false);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }

  function getEffortLabel(effort: number | null | undefined): string {
    if (!effort) return '-';
    if (effort <= 2) return 'Muito fácil';
    if (effort <= 4) return 'Fácil';
    if (effort <= 6) return 'Moderado';
    if (effort <= 8) return 'Difícil';
    return 'Máximo';
  }

  function getEffortColor(effort: number | null | undefined): string {
    if (!effort) return theme.text.secondary;
    if (effort <= 4) return theme.semantic.success;
    if (effort <= 6) return theme.semantic.warning;
    if (effort <= 8) return '#F97316';
    return theme.semantic.error;
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background.primary }]}>
        <ActivityIndicator size="large" color={theme.accent.primary} />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background.primary }]}>
        <Text style={{ color: theme.text.primary }}>Treino não encontrado</Text>
      </View>
    );
  }

  // Agrupar exercícios por grupo muscular
  const muscleGroups = [...new Set(activity.exercises.map(e => e.muscle_group))];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text.primary }]}>{activity.title || activity.division_name || 'Treino de Força'}</Text>
          <Text style={[styles.date, { color: theme.text.secondary }]}>{formatDate(activity.start_time)}</Text>
          <Text style={[styles.time, { color: theme.text.secondary }]}>às {formatTime(activity.start_time)}</Text>
        </View>

        {/* Stats principais */}
        <View style={[styles.mainStats, { backgroundColor: theme.background.secondary }]}>
          <View style={styles.mainStat}>
            <Text style={[styles.mainStatValue, { color: theme.accent.primary }]}>{activity.exercises.length}</Text>
            <Text style={[styles.mainStatLabel, { color: theme.text.secondary }]}>exercícios</Text>
          </View>
          {activity.duration && (
            <View style={styles.mainStat}>
              <Text style={[styles.mainStatValue, { color: theme.accent.primary }]}>{formatDuration(activity.duration)}</Text>
              <Text style={[styles.mainStatLabel, { color: theme.text.secondary }]}>duração</Text>
            </View>
          )}
          {activity.effort && (
            <View style={styles.mainStat}>
              <View style={[styles.effortBadgeLarge, { backgroundColor: getEffortColor(activity.effort) }]}>
                <Text style={styles.effortTextLarge}>{activity.effort}</Text>
              </View>
              <Text style={[styles.mainStatLabel, { color: theme.text.secondary }]}>esforço</Text>
            </View>
          )}
        </View>

        {/* Grupos musculares */}
        {muscleGroups.length > 0 && (
          <View style={styles.muscleGroupsContainer}>
            {muscleGroups.map((group) => (
              <View key={group} style={[styles.muscleGroupBadge, { backgroundColor: theme.accent.primary }]}>
                <Text style={styles.muscleGroupText}>{group}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Exercícios */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Exercícios</Text>
          {activity.exercises.map((exercise, index) => (
            <View key={index} style={[styles.exerciseCard, { backgroundColor: theme.background.secondary }]}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseTitleRow}>
                  <Text style={[styles.exerciseName, { color: theme.text.primary }]}>{exercise.exercise_name}</Text>
                  <View style={[styles.muscleBadge, { backgroundColor: theme.accent.muted }]}>
                    <Text style={[styles.muscleBadgeText, { color: theme.accent.primary }]}>{exercise.muscle_group}</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.exerciseStats, { backgroundColor: theme.background.tertiary }]}>
                <View style={styles.exerciseStat}>
                  <Text style={[styles.exerciseStatValue, { color: theme.text.primary }]}>{exercise.sets_completed}</Text>
                  <Text style={[styles.exerciseStatLabel, { color: theme.text.secondary }]}>séries</Text>
                </View>
                <View style={styles.exerciseStat}>
                  <Text style={[styles.exerciseStatValue, { color: theme.text.primary }]}>{exercise.reps_completed}</Text>
                  <Text style={[styles.exerciseStatLabel, { color: theme.text.secondary }]}>reps</Text>
                </View>
                <View style={styles.exerciseStat}>
                  <Text style={[styles.exerciseStatValue, { color: theme.text.primary }]}>{exercise.weight || '-'}</Text>
                  <Text style={[styles.exerciseStatLabel, { color: theme.text.secondary }]}>kg</Text>
                </View>
                <View style={styles.exerciseStat}>
                  <Text style={[styles.exerciseStatValue, { color: theme.text.primary }]}>{exercise.rpe || '-'}</Text>
                  <Text style={[styles.exerciseStatLabel, { color: theme.text.secondary }]}>RPE</Text>
                </View>
              </View>

              {exercise.notes && (
                <Text style={[styles.exerciseNotes, { color: theme.text.secondary }]}>{exercise.notes}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Notas */}
        {activity.notes && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Notas do Treino</Text>
            <View style={[styles.notesCard, { backgroundColor: theme.background.secondary }]}>
              <Text style={[styles.notesText, { color: theme.text.primary }]}>{activity.notes}</Text>
            </View>
          </View>
        )}

        {/* Botões de ação */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: theme.accent.primary }]}
            onPress={() => navigation.navigate('EditStrengthWorkout', { activityId })}
            disabled={isDeleting}
          >
            <Feather name="edit-2" size={18} color="#000000" style={styles.buttonIcon} />
            <Text style={styles.editButtonText}>Editar Treino</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: theme.semantic.error }, isDeleting && styles.deleteButtonDisabled]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Feather name="trash-2" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.deleteButtonText}>Excluir Treino</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    textTransform: 'capitalize',
  },
  time: {
    fontSize: 14,
  },
  mainStats: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    justifyContent: 'space-around',
  },
  mainStat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 60,
  },
  mainStatValue: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  mainStatLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  effortBadgeLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  effortTextLarge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  muscleGroupsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  muscleGroupBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  muscleGroupText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  exerciseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  exerciseHeader: {
    marginBottom: 14,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  muscleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  muscleBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  exerciseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 10,
    padding: 12,
  },
  exerciseStat: {
    flex: 1,
    alignItems: 'center',
  },
  exerciseStatValue: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  exerciseStatLabel: {
    fontSize: 11,
    marginTop: 3,
    textAlign: 'center',
  },
  exerciseNotes: {
    marginTop: 12,
    fontSize: 14,
    fontStyle: 'italic',
  },
  notesCard: {
    borderRadius: 16,
    padding: 16,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  editButton: {
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
