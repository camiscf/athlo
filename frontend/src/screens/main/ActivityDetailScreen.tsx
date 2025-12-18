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
  const theme = useColors();
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
      weekday: 'short',
      day: '2-digit',
      month: 'short',
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
        <Text style={{ color: theme.text.primary }}>Atividade não encontrada</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={[styles.dateTime, { color: theme.text.secondary }]}>
              {formatDate(activity.start_time)} • {formatTime(activity.start_time)}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: theme.accent.primary }]}>
              <Feather name="zap" size={12} color="#000000" />
              <Text style={styles.typeBadgeText}>RUA</Text>
            </View>
          </View>
          <Text style={[styles.title, { color: theme.text.primary }]}>
            {activity.title || 'Corrida'}
          </Text>
        </View>

        {/* Main Stats Grid */}
        <View style={[styles.statsCard, { backgroundColor: theme.background.secondary }]}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={styles.statHeader}>
                <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Distância</Text>
                <Feather name="map-pin" size={14} color={theme.text.tertiary} />
              </View>
              <View style={styles.statValue}>
                <Text style={[styles.statNumber, { color: theme.accent.primary }]}>
                  {activity.distance?.toFixed(2) || '--'}
                </Text>
                <Text style={[styles.statUnit, { color: theme.text.secondary }]}>km</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statHeader}>
                <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Duração</Text>
                <Feather name="clock" size={14} color={theme.text.tertiary} />
              </View>
              <View style={styles.statValue}>
                <Text style={[styles.statNumber, { color: theme.text.primary }]}>
                  {activity.duration_formatted || '--'}
                </Text>
                <Text style={[styles.statUnit, { color: theme.text.secondary }]}>min</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statHeader}>
                <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Ritmo Médio</Text>
                <Feather name="trending-up" size={14} color={theme.text.tertiary} />
              </View>
              <View style={styles.statValue}>
                <Text style={[styles.statNumber, { color: theme.text.primary }]}>
                  {activity.pace_formatted || '--'}
                </Text>
                <Text style={[styles.statUnit, { color: theme.text.secondary }]}>/km</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statHeader}>
                <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Calorias</Text>
                <Feather name="zap" size={14} color={theme.text.tertiary} />
              </View>
              <View style={styles.statValue}>
                <Text style={[styles.statNumber, { color: theme.text.primary }]}>
                  {activity.calories || '--'}
                </Text>
                <Text style={[styles.statUnit, { color: theme.text.secondary }]}>kcal</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Heart Rate */}
        {activity.avg_heart_rate && (
          <View style={[styles.hrCard, { backgroundColor: theme.background.secondary }]}>
            <View style={styles.hrHeader}>
              <Feather name="heart" size={16} color={theme.semantic.error} />
              <Text style={[styles.hrLabel, { color: theme.text.secondary }]}>BATIMENTO CARDÍACO</Text>
              <Text style={[styles.hrValue, { color: theme.text.primary }]}>
                {activity.avg_heart_rate} BPM Médio
              </Text>
            </View>
            <View style={styles.hrBarContainer}>
              <View style={[styles.hrBar, { backgroundColor: theme.background.tertiary }]}>
                <View
                  style={[
                    styles.hrBarFill,
                    {
                      backgroundColor: theme.accent.primary,
                      width: `${Math.min((activity.avg_heart_rate / 200) * 100, 100)}%`
                    }
                  ]}
                />
                <View
                  style={[
                    styles.hrIndicator,
                    {
                      backgroundColor: theme.accent.primary,
                      left: `${Math.min((activity.avg_heart_rate / 200) * 100, 100)}%`
                    }
                  ]}
                >
                  <Text style={styles.hrIndicatorText}>{activity.avg_heart_rate}</Text>
                </View>
              </View>
              <View style={styles.hrLabels}>
                <Text style={[styles.hrLabelText, { color: theme.text.tertiary }]}>LEVE</Text>
                <Text style={[styles.hrLabelText, { color: theme.text.tertiary }]}>INTENSO</Text>
              </View>
            </View>
          </View>
        )}

        {/* Additional Details */}
        <View style={[styles.detailsCard, { backgroundColor: theme.background.secondary }]}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Detalhes</Text>

          {activity.speed_kmh !== null && (
            <View style={[styles.detailRow, { borderBottomColor: theme.border.primary }]}>
              <Text style={[styles.detailLabel, { color: theme.text.secondary }]}>Velocidade média</Text>
              <Text style={[styles.detailValue, { color: theme.text.primary }]}>
                {activity.speed_kmh.toFixed(1)} km/h
              </Text>
            </View>
          )}

          {activity.cadence && (
            <View style={[styles.detailRow, { borderBottomColor: theme.border.primary }]}>
              <Text style={[styles.detailLabel, { color: theme.text.secondary }]}>Cadência</Text>
              <Text style={[styles.detailValue, { color: theme.text.primary }]}>
                {activity.cadence} ppm
              </Text>
            </View>
          )}

          {activity.effort && (
            <View style={[styles.detailRow, { borderBottomColor: theme.border.primary }]}>
              <Text style={[styles.detailLabel, { color: theme.text.secondary }]}>Esforço Percebido</Text>
              <View style={styles.effortContainer}>
                <Text style={[styles.effortValue, { color: getEffortColor(activity.effort) }]}>
                  {activity.effort}/10
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Notes */}
        {activity.notes && (
          <View style={[styles.notesCard, { backgroundColor: theme.background.secondary }]}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Notas</Text>
            <Text style={[styles.notesText, { color: theme.text.secondary }]}>
              {activity.notes}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomAction, { backgroundColor: theme.background.primary, borderTopColor: theme.border.primary }]}>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.accent.primary }]}
          onPress={() => navigation.navigate('EditActivity', { activityId })}
          disabled={isDeleting}
        >
          <Feather name="edit-2" size={18} color="#000000" />
          <Text style={styles.editButtonText}>Editar Treino</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.background.tertiary }]}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color={theme.semantic.error} size="small" />
          ) : (
            <Feather name="trash-2" size={20} color={theme.semantic.error} />
          )}
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateTime: {
    fontSize: 14,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000000',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  statUnit: {
    fontSize: 14,
    marginLeft: 4,
  },
  hrCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  hrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  hrLabel: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  hrValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  hrBarContainer: {
    marginTop: 8,
  },
  hrBar: {
    height: 8,
    borderRadius: 4,
    position: 'relative',
  },
  hrBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  hrIndicator: {
    position: 'absolute',
    top: -8,
    width: 28,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -14,
  },
  hrIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  hrLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  hrLabelText: {
    fontSize: 10,
    fontWeight: '500',
  },
  detailsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 15,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  effortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  effortValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  notesCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  deleteButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
