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
import { RunningActivity } from '../../types';

interface ActivityDetailScreenProps {
  route: {
    params: {
      activityId: string;
    };
  };
  navigation: any;
}

export default function ActivityDetailScreen({ route, navigation }: ActivityDetailScreenProps) {
  const { activityId } = route.params;
  const [activity, setActivity] = useState<RunningActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadActivity();
  }, [activityId]);

  async function loadActivity() {
    try {
      const data = await api.getRunningActivity(activityId);
      setActivity(data);
    } catch (error) {
      console.error('Erro ao carregar atividade:', error);
      showAlert('Erro', 'Não foi possível carregar a atividade.');
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
      ? window.confirm('Tem certeza que deseja excluir esta atividade?')
      : true;

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await api.deleteRunningActivity(activityId);
      showAlert('Sucesso', 'Atividade excluída com sucesso.');
      navigation.goBack();
    } catch (error) {
      showAlert('Erro', 'Não foi possível excluir a atividade.');
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
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Atividade não encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{activity.title || 'Corrida'}</Text>
          <Text style={styles.date}>{formatDate(activity.start_time)}</Text>
          <Text style={styles.time}>às {formatTime(activity.start_time)}</Text>
        </View>

        {/* Stats principais */}
        <View style={styles.mainStats}>
          {activity.distance !== null && (
            <View style={styles.mainStat}>
              <Text style={styles.mainStatValue}>{activity.distance.toFixed(2)}</Text>
              <Text style={styles.mainStatLabel}>km</Text>
            </View>
          )}
          {activity.duration_formatted && (
            <View style={styles.mainStat}>
              <Text style={styles.mainStatValue}>{activity.duration_formatted}</Text>
              <Text style={styles.mainStatLabel}>tempo</Text>
            </View>
          )}
          {activity.pace_formatted && (
            <View style={styles.mainStat}>
              <Text style={styles.mainStatValue}>{activity.pace_formatted}</Text>
              <Text style={styles.mainStatLabel}>pace/km</Text>
            </View>
          )}
        </View>

        {/* Detalhes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhes</Text>
          <View style={styles.detailsCard}>
            {activity.speed_kmh !== null && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Velocidade média</Text>
                <Text style={styles.detailValue}>{activity.speed_kmh.toFixed(1)} km/h</Text>
              </View>
            )}
            {activity.effort && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Esforço</Text>
                <View style={[styles.effortBadge, { backgroundColor: getEffortColor(activity.effort) }]}>
                  <Text style={styles.effortText}>{getEffortLabel(activity.effort)}</Text>
                </View>
              </View>
            )}
            {activity.cadence && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Cadência</Text>
                <Text style={styles.detailValue}>{activity.cadence} ppm</Text>
              </View>
            )}
            {activity.avg_heart_rate && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>FC média</Text>
                <Text style={styles.detailValue}>{activity.avg_heart_rate} bpm</Text>
              </View>
            )}
            {activity.calories && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Calorias</Text>
                <Text style={styles.detailValue}>{activity.calories} kcal</Text>
              </View>
            )}
          </View>
        </View>

        {/* Notas */}
        {activity.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{activity.notes}</Text>
            </View>
          </View>
        )}

        {/* Botão excluir */}
        <TouchableOpacity
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.deleteButtonText}>Excluir Atividade</Text>
          )}
        </TouchableOpacity>
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
    padding: 20,
    marginBottom: 24,
    gap: 16,
  },
  mainStat: {
    flex: 1,
    alignItems: 'center',
  },
  mainStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
  },
  mainStatLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
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
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  detailLabel: {
    fontSize: 15,
    color: '#000000',
  },
  detailValue: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  effortBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  effortText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
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
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
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
