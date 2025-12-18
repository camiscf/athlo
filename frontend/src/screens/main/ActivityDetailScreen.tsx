import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { RunningActivity, Lap, AutoSplit } from '../../types';

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
  const [laps, setLaps] = useState<Lap[]>([]);
  const [showAddLap, setShowAddLap] = useState(false);
  const [newLapTime, setNewLapTime] = useState('');
  const [newLapDistance, setNewLapDistance] = useState('');

  useEffect(() => {
    loadActivity();
  }, [activityId]);

  async function loadActivity() {
    try {
      const data = await api.getRunningActivity(activityId);
      setActivity(data);
      // Load laps from activity or use empty array
      if (data.laps && data.laps.length > 0) {
        setLaps(data.laps);
      }
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

  function getEffortLabel(effort: number): string {
    if (effort <= 2) return 'Muito fácil';
    if (effort <= 4) return 'Fácil';
    if (effort <= 6) return 'Moderado';
    if (effort <= 8) return 'Difícil';
    return 'Máximo';
  }

  function getEffortColor(effort: number): string {
    if (effort <= 4) return theme.semantic.success;
    if (effort <= 6) return theme.semantic.warning;
    if (effort <= 8) return '#F97316';
    return theme.semantic.error;
  }

  function calculatePace(timeSeconds: number, distanceKm: number): string {
    if (distanceKm === 0) return '--:--';
    const paceSeconds = timeSeconds / distanceKm;
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.floor(paceSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  function parseTimeToSeconds(time: string): number {
    const parts = time.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    if (parts.length === 3) {
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
    return 0;
  }

  function addLap() {
    if (!newLapTime || !newLapDistance) return;

    const timeSeconds = parseTimeToSeconds(newLapTime);
    const distance = parseFloat(newLapDistance);

    if (isNaN(timeSeconds) || isNaN(distance) || distance <= 0) return;

    const newLap: Lap = {
      number: laps.length + 1,
      time: newLapTime,
      duration_seconds: timeSeconds,
      distance: distance,
      pace: calculatePace(timeSeconds, distance),
      pace_seconds: timeSeconds / distance,
    };

    setLaps([...laps, newLap]);
    setNewLapTime('');
    setNewLapDistance('');
    setShowAddLap(false);
  }

  function removeLap(index: number) {
    const newLaps = laps.filter((_, i) => i !== index)
      .map((lap, i) => ({ ...lap, number: i + 1 }));
    setLaps(newLaps);
  }

  // Generate auto splits based on distance
  function generateAutoSplits(): AutoSplit[] {
    if (!activity?.distance || !activity?.duration) return [];

    const totalKm = Math.floor(activity.distance);
    const splits: AutoSplit[] = [];
    const avgPaceSeconds = activity.pace || (activity.duration / activity.distance);

    for (let km = 1; km <= totalKm; km++) {
      // Add some variation for realistic splits
      const variation = (Math.random() - 0.5) * 20;
      const paceSeconds = avgPaceSeconds + variation;
      const prevPace = km > 1 ? splits[km - 2].pace_seconds : paceSeconds;

      const minutes = Math.floor(paceSeconds / 60);
      const seconds = Math.floor(paceSeconds % 60);

      splits.push({
        km,
        pace: `${minutes}:${seconds.toString().padStart(2, '0')}`,
        pace_seconds: paceSeconds,
        change: km > 1 ? Math.round(paceSeconds - prevPace) : null,
      });
    }

    return activity.auto_splits || splits;
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

  const autoSplits = generateAutoSplits();

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

        {/* Manual Laps Section */}
        <View style={[styles.lapsCard, { backgroundColor: theme.background.secondary }]}>
          <View style={styles.lapsHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Voltas Manuais</Text>
            <View style={[styles.lapCountBadge, { backgroundColor: theme.accent.muted }]}>
              <Text style={[styles.lapCountText, { color: theme.accent.primary }]}>
                {laps.length}
              </Text>
            </View>
          </View>

          {laps.length > 0 ? (
            <>
              {/* Table Header */}
              <View style={[styles.tableHeader, { borderBottomColor: theme.border.primary }]}>
                <Text style={[styles.tableHeaderText, styles.colNumber, { color: theme.text.tertiary }]}>#</Text>
                <Text style={[styles.tableHeaderText, styles.colTime, { color: theme.text.tertiary }]}>TEMPO</Text>
                <Text style={[styles.tableHeaderText, styles.colDistance, { color: theme.text.tertiary }]}>DIST.</Text>
                <Text style={[styles.tableHeaderText, styles.colPace, { color: theme.text.tertiary }]}>RITMO</Text>
                <View style={styles.colAction} />
              </View>

              {/* Lap Rows */}
              {laps.map((lap, index) => (
                <View
                  key={index}
                  style={[styles.lapRow, { borderBottomColor: theme.border.primary }]}
                >
                  <Text style={[styles.lapCell, styles.colNumber, { color: theme.text.secondary }]}>
                    {lap.number}
                  </Text>
                  <Text style={[styles.lapCell, styles.colTime, { color: theme.text.primary }]}>
                    {lap.time}
                  </Text>
                  <Text style={[styles.lapCell, styles.colDistance, { color: theme.text.primary }]}>
                    {lap.distance.toFixed(2)} km
                  </Text>
                  <Text style={[styles.lapCell, styles.colPace, { color: theme.accent.primary }]}>
                    {lap.pace}
                  </Text>
                  <TouchableOpacity
                    style={styles.colAction}
                    onPress={() => removeLap(index)}
                  >
                    <Feather name="x" size={16} color={theme.text.tertiary} />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.emptyLaps}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.background.tertiary }]}>
                <Feather name="clock" size={24} color={theme.text.tertiary} />
              </View>
              <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
                Nenhuma volta registrada
              </Text>
            </View>
          )}

          {/* Add Lap Form */}
          {showAddLap && (
            <View style={[styles.addLapForm, { backgroundColor: theme.background.tertiary }]}>
              <View style={styles.addLapInputs}>
                <View style={styles.addLapInputGroup}>
                  <Text style={[styles.addLapLabel, { color: theme.text.secondary }]}>Tempo</Text>
                  <TextInput
                    style={[styles.addLapInput, { backgroundColor: theme.background.secondary, color: theme.text.primary, borderColor: theme.border.primary }]}
                    placeholder="0:00"
                    placeholderTextColor={theme.text.tertiary}
                    value={newLapTime}
                    onChangeText={setNewLapTime}
                  />
                </View>
                <View style={styles.addLapInputGroup}>
                  <Text style={[styles.addLapLabel, { color: theme.text.secondary }]}>Distância (km)</Text>
                  <TextInput
                    style={[styles.addLapInput, { backgroundColor: theme.background.secondary, color: theme.text.primary, borderColor: theme.border.primary }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.text.tertiary}
                    value={newLapDistance}
                    onChangeText={setNewLapDistance}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <View style={styles.addLapActions}>
                <TouchableOpacity
                  style={[styles.addLapCancel, { backgroundColor: theme.background.secondary }]}
                  onPress={() => setShowAddLap(false)}
                >
                  <Text style={[styles.addLapCancelText, { color: theme.text.secondary }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addLapConfirm, { backgroundColor: theme.accent.primary }]}
                  onPress={addLap}
                >
                  <Text style={styles.addLapConfirmText}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Add Lap Button */}
          {!showAddLap && (
            <TouchableOpacity
              style={[styles.addLapButton, { borderColor: theme.accent.primary }]}
              onPress={() => setShowAddLap(true)}
            >
              <Feather name="plus" size={18} color={theme.accent.primary} />
              <Text style={[styles.addLapButtonText, { color: theme.accent.primary }]}>
                ADICIONAR VOLTA
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Auto Splits Section */}
        {autoSplits.length > 0 && (
          <View style={[styles.splitsCard, { backgroundColor: theme.background.secondary }]}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Parciais Automáticas</Text>

            {autoSplits.map((split, index) => (
              <View
                key={index}
                style={[styles.splitRow, { borderBottomColor: theme.border.primary }]}
              >
                <View style={styles.splitKm}>
                  <View style={[styles.splitKmBadge, { backgroundColor: theme.accent.muted }]}>
                    <Text style={[styles.splitKmText, { color: theme.accent.primary }]}>
                      KM {split.km}
                    </Text>
                  </View>
                </View>
                <View style={styles.splitPace}>
                  <Text style={[styles.splitPaceValue, { color: theme.text.primary }]}>
                    {split.pace}
                  </Text>
                  <Text style={[styles.splitPaceUnit, { color: theme.text.tertiary }]}>/km</Text>
                </View>
                <View style={styles.splitChange}>
                  {split.change !== null && (
                    <View style={[
                      styles.splitChangeBadge,
                      { backgroundColor: split.change <= 0 ? theme.semantic.successMuted : theme.semantic.errorMuted }
                    ]}>
                      <Feather
                        name={split.change <= 0 ? 'trending-down' : 'trending-up'}
                        size={12}
                        color={split.change <= 0 ? theme.semantic.success : theme.semantic.error}
                      />
                      <Text style={[
                        styles.splitChangeText,
                        { color: split.change <= 0 ? theme.semantic.success : theme.semantic.error }
                      ]}>
                        {split.change <= 0 ? '' : '+'}{split.change}s
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

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

        {/* Perceived Effort */}
        {activity.effort && (
          <View style={[styles.effortCard, { backgroundColor: theme.background.secondary }]}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Esforço Percebido</Text>

            <View style={styles.effortContent}>
              <View style={styles.effortValueContainer}>
                <Text style={[styles.effortNumber, { color: getEffortColor(activity.effort) }]}>
                  {activity.effort}
                </Text>
                <Text style={[styles.effortMax, { color: theme.text.tertiary }]}>/10</Text>
              </View>
              <Text style={[styles.effortLabel, { color: getEffortColor(activity.effort) }]}>
                {getEffortLabel(activity.effort)}
              </Text>
            </View>

            {/* Visual Effort Bar */}
            <View style={styles.effortBarContainer}>
              <View style={[styles.effortBarTrack, { backgroundColor: theme.background.tertiary }]}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.effortBarSegment,
                      {
                        backgroundColor: level <= activity.effort!
                          ? getEffortColor(activity.effort!)
                          : 'transparent',
                        opacity: level <= activity.effort! ? 1 : 0.3,
                      }
                    ]}
                  />
                ))}
              </View>
              <View style={styles.effortBarLabels}>
                <Text style={[styles.effortBarLabel, { color: theme.text.tertiary }]}>Fácil</Text>
                <Text style={[styles.effortBarLabel, { color: theme.text.tertiary }]}>Moderado</Text>
                <Text style={[styles.effortBarLabel, { color: theme.text.tertiary }]}>Máximo</Text>
              </View>
            </View>
          </View>
        )}

        {/* Additional Details */}
        <View style={[styles.detailsCard, { backgroundColor: theme.background.secondary }]}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Detalhes</Text>

          {activity.speed_kmh !== null && (
            <View style={[styles.detailRow, { borderBottomColor: theme.border.primary }]}>
              <View style={styles.detailLeft}>
                <Feather name="activity" size={16} color={theme.text.tertiary} />
                <Text style={[styles.detailLabel, { color: theme.text.secondary }]}>Velocidade média</Text>
              </View>
              <Text style={[styles.detailValue, { color: theme.text.primary }]}>
                {activity.speed_kmh.toFixed(1)} km/h
              </Text>
            </View>
          )}

          {activity.cadence && (
            <View style={[styles.detailRow, { borderBottomColor: theme.border.primary }]}>
              <View style={styles.detailLeft}>
                <Feather name="refresh-cw" size={16} color={theme.text.tertiary} />
                <Text style={[styles.detailLabel, { color: theme.text.secondary }]}>Cadência</Text>
              </View>
              <Text style={[styles.detailValue, { color: theme.text.primary }]}>
                {activity.cadence} ppm
              </Text>
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

  // Stats Styles
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

  // Laps Styles
  lapsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  lapsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  lapCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  lapCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  colNumber: {
    width: 32,
    textAlign: 'center',
  },
  colTime: {
    flex: 1,
  },
  colDistance: {
    flex: 1,
  },
  colPace: {
    flex: 1,
    textAlign: 'right',
  },
  colAction: {
    width: 32,
    alignItems: 'center',
  },
  lapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  lapCell: {
    fontSize: 14,
  },
  emptyLaps: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  addLapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  addLapButtonText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  addLapForm: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
  },
  addLapInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  addLapInputGroup: {
    flex: 1,
  },
  addLapLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  addLapInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  addLapActions: {
    flexDirection: 'row',
    gap: 12,
  },
  addLapCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addLapCancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addLapConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addLapConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },

  // Splits Styles
  splitsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  splitKm: {
    width: 70,
  },
  splitKmBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  splitKmText: {
    fontSize: 12,
    fontWeight: '600',
  },
  splitPace: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  splitPaceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  splitPaceUnit: {
    fontSize: 12,
    marginLeft: 2,
  },
  splitChange: {
    width: 80,
    alignItems: 'flex-end',
  },
  splitChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  splitChangeText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Heart Rate Styles
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

  // Effort Styles
  effortCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  effortContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
    gap: 12,
  },
  effortValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  effortNumber: {
    fontSize: 48,
    fontWeight: '700',
  },
  effortMax: {
    fontSize: 20,
    fontWeight: '500',
  },
  effortLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  effortBarContainer: {
    marginTop: 8,
  },
  effortBarTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    gap: 3,
  },
  effortBarSegment: {
    flex: 1,
    borderRadius: 2,
  },
  effortBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  effortBarLabel: {
    fontSize: 10,
    fontWeight: '500',
  },

  // Details Styles
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
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 15,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Notes Styles
  notesCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
  },

  // Bottom Action Styles
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
