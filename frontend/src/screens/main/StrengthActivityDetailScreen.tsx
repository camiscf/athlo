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
    if (!effort) return '#8E8E93';
    if (effort <= 2) return '#34C759';
    if (effort <= 4) return '#30D158';
    if (effort <= 6) return '#FF9500';
    if (effort <= 8) return '#FF6B35';
    return '#FF3B30';
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34C759" />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Treino não encontrado</Text>
      </View>
    );
  }

  // Agrupar exercícios por grupo muscular
  const muscleGroups = [...new Set(activity.exercises.map(e => e.muscle_group))];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{activity.title || activity.division_name || 'Treino de Força'}</Text>
          <Text style={styles.date}>{formatDate(activity.start_time)}</Text>
          <Text style={styles.time}>às {formatTime(activity.start_time)}</Text>
        </View>

        {/* Stats principais */}
        <View style={styles.mainStats}>
          <View style={styles.mainStat}>
            <Text style={styles.mainStatValue}>{activity.exercises.length}</Text>
            <Text style={styles.mainStatLabel}>exercícios</Text>
          </View>
          {activity.duration && (
            <View style={styles.mainStat}>
              <Text style={styles.mainStatValue}>{formatDuration(activity.duration)}</Text>
              <Text style={styles.mainStatLabel}>duração</Text>
            </View>
          )}
          {activity.effort && (
            <View style={styles.mainStat}>
              <View style={[styles.effortBadgeLarge, { backgroundColor: getEffortColor(activity.effort) }]}>
                <Text style={styles.effortTextLarge}>{activity.effort}</Text>
              </View>
              <Text style={styles.mainStatLabel}>esforço</Text>
            </View>
          )}
        </View>

        {/* Grupos musculares */}
        {muscleGroups.length > 0 && (
          <View style={styles.muscleGroupsContainer}>
            {muscleGroups.map((group) => (
              <View key={group} style={styles.muscleGroupBadge}>
                <Text style={styles.muscleGroupText}>{group}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Exercícios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercícios</Text>
          {activity.exercises.map((exercise, index) => (
            <View key={index} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseTitleRow}>
                  <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
                  <View style={styles.muscleBadge}>
                    <Text style={styles.muscleBadgeText}>{exercise.muscle_group}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.exerciseStats}>
                <View style={styles.exerciseStat}>
                  <Text style={styles.exerciseStatValue}>{exercise.sets_completed}</Text>
                  <Text style={styles.exerciseStatLabel}>séries</Text>
                </View>
                <View style={styles.exerciseStat}>
                  <Text style={styles.exerciseStatValue}>{exercise.reps_completed}</Text>
                  <Text style={styles.exerciseStatLabel}>reps</Text>
                </View>
                <View style={styles.exerciseStat}>
                  <Text style={styles.exerciseStatValue}>{exercise.weight || '-'}</Text>
                  <Text style={styles.exerciseStatLabel}>kg</Text>
                </View>
                <View style={styles.exerciseStat}>
                  <Text style={styles.exerciseStatValue}>{exercise.rpe || '-'}</Text>
                  <Text style={styles.exerciseStatLabel}>RPE</Text>
                </View>
              </View>

              {exercise.notes && (
                <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Notas */}
        {activity.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas do Treino</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{activity.notes}</Text>
            </View>
          </View>
        )}

        {/* Botões de ação */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditStrengthWorkout', { activityId })}
            disabled={isDeleting}
          >
            <Text style={styles.editButtonText}>Editar Treino</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.deleteButtonText}>Excluir Treino</Text>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  time: {
    fontSize: 14,
    color: '#8E8E93',
  },
  mainStats: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
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
    color: '#34C759',
    textAlign: 'center',
  },
  mainStatLabel: {
    fontSize: 12,
    color: '#8E8E93',
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
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  muscleGroupText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
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
    color: '#000000',
    flex: 1,
    marginRight: 8,
  },
  muscleBadge: {
    backgroundColor: '#34C75920',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  muscleBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#34C759',
  },
  exerciseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
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
    color: '#000000',
    textAlign: 'center',
  },
  exerciseStatLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 3,
    textAlign: 'center',
  },
  exerciseNotes: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  notesText: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 22,
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  editButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: '#FF8A80',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
