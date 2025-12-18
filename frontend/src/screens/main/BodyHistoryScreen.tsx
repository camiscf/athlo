import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useColors } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { BodyMeasurement } from '../../types';

export default function BodyHistoryScreen() {
  const theme = useColors();
  const navigation = useNavigation();
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await api.getBodyMeasurements(100);
      setMeasurements(data);
    } catch (error) {
      console.error('Error loading measurements:', error);
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

  const handleDelete = async (id: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Deseja excluir esta medição?');
      if (!confirmed) return;
    }

    try {
      await api.deleteBodyMeasurement(id);
      loadData();
    } catch (error) {
      console.error('Error deleting measurement:', error);
      if (Platform.OS === 'web') {
        window.alert('Erro ao excluir medição');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getMainStats = (m: BodyMeasurement) => {
    const stats = [];
    if (m.weight) stats.push(`${m.weight.toFixed(1)} kg`);
    if (m.body_fat_percentage) stats.push(`${m.body_fat_percentage.toFixed(1)}% gordura`);
    return stats.join(' • ') || 'Medidas corporais';
  };

  const getMeasurementItems = (m: BodyMeasurement) => {
    const items: { label: string; value: string }[] = [];

    if (m.weight) items.push({ label: 'Peso', value: `${m.weight.toFixed(1)} kg` });
    if (m.body_fat_percentage) items.push({ label: 'Gordura', value: `${m.body_fat_percentage.toFixed(1)}%` });
    if (m.chest) items.push({ label: 'Peitoral', value: `${m.chest.toFixed(1)} cm` });
    if (m.shoulders) items.push({ label: 'Ombros', value: `${m.shoulders.toFixed(1)} cm` });
    if (m.waist) items.push({ label: 'Cintura', value: `${m.waist.toFixed(1)} cm` });
    if (m.hips) items.push({ label: 'Quadril', value: `${m.hips.toFixed(1)} cm` });
    if (m.glutes) items.push({ label: 'Glúteo', value: `${m.glutes.toFixed(1)} cm` });
    if (m.left_arm) items.push({ label: 'Bíceps Esq.', value: `${m.left_arm.toFixed(1)} cm` });
    if (m.right_arm) items.push({ label: 'Bíceps Dir.', value: `${m.right_arm.toFixed(1)} cm` });
    if (m.left_thigh) items.push({ label: 'Coxa Esq.', value: `${m.left_thigh.toFixed(1)} cm` });
    if (m.right_thigh) items.push({ label: 'Coxa Dir.', value: `${m.right_thigh.toFixed(1)} cm` });
    if (m.left_calf) items.push({ label: 'Panturr. Esq.', value: `${m.left_calf.toFixed(1)} cm` });
    if (m.right_calf) items.push({ label: 'Panturr. Dir.', value: `${m.right_calf.toFixed(1)} cm` });
    if (m.neck) items.push({ label: 'Pescoço', value: `${m.neck.toFixed(1)} cm` });

    return items;
  };

  // Group measurements by month
  const groupedMeasurements = measurements.reduce((acc, m) => {
    const date = new Date(m.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    if (!acc[key]) {
      acc[key] = { label: monthName, items: [] };
    }
    acc[key].items.push(m);
    return acc;
  }, {} as Record<string, { label: string; items: BodyMeasurement[] }>);

  const sortedGroups = Object.entries(groupedMeasurements).sort((a, b) => b[0].localeCompare(a[0]));

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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.background.secondary }]}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={20} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
            Histórico de Medições
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Stats Summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.background.secondary }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.accent.primary }]}>
              {measurements.length}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.text.secondary }]}>
              medições
            </Text>
          </View>
          {measurements.length >= 2 && measurements[0].weight && measurements[measurements.length - 1].weight && (
            <>
              <View style={[styles.summaryDivider, { backgroundColor: theme.border.primary }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: theme.text.primary }]}>
                  {(measurements[0].weight - measurements[measurements.length - 1].weight).toFixed(1)} kg
                </Text>
                <Text style={[styles.summaryLabel, { color: theme.text.secondary }]}>
                  variação total
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Grouped List */}
        {sortedGroups.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.background.secondary }]}>
            <Feather name="clipboard" size={48} color={theme.text.tertiary} />
            <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>
              Nenhuma medição registrada
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
              Adicione sua primeira medição corporal
            </Text>
          </View>
        ) : (
          sortedGroups.map(([key, group]) => (
            <View key={key} style={styles.monthGroup}>
              <Text style={[styles.monthTitle, { color: theme.text.secondary }]}>
                {group.label.toUpperCase()}
              </Text>

              {group.items.map((measurement) => {
                const isExpanded = expandedId === measurement.id;
                const measurementItems = getMeasurementItems(measurement);

                return (
                  <View
                    key={measurement.id}
                    style={[styles.measurementCard, { backgroundColor: theme.background.secondary }]}
                  >
                    <TouchableOpacity
                      style={styles.measurementHeader}
                      onPress={() => setExpandedId(isExpanded ? null : measurement.id)}
                    >
                      <View style={styles.measurementDateBadge}>
                        <Text style={[styles.measurementDay, { color: theme.accent.primary }]}>
                          {new Date(measurement.date).getDate()}
                        </Text>
                        <Text style={[styles.measurementMonth, { color: theme.text.tertiary }]}>
                          {new Date(measurement.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                        </Text>
                      </View>
                      <View style={styles.measurementInfo}>
                        <Text style={[styles.measurementMainStat, { color: theme.text.primary }]}>
                          {getMainStats(measurement)}
                        </Text>
                        <Text style={[styles.measurementCount, { color: theme.text.tertiary }]}>
                          {measurementItems.length} medidas registradas
                        </Text>
                      </View>
                      <Feather
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={theme.text.tertiary}
                      />
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={[styles.measurementDetails, { borderTopColor: theme.border.primary }]}>
                        <View style={styles.detailsGrid}>
                          {measurementItems.map((item, index) => (
                            <View key={index} style={styles.detailItem}>
                              <Text style={[styles.detailLabel, { color: theme.text.tertiary }]}>
                                {item.label}
                              </Text>
                              <Text style={[styles.detailValue, { color: theme.text.primary }]}>
                                {item.value}
                              </Text>
                            </View>
                          ))}
                        </View>

                        {measurement.notes && (
                          <View style={[styles.notesContainer, { backgroundColor: theme.background.tertiary }]}>
                            <Feather name="file-text" size={14} color={theme.text.tertiary} />
                            <Text style={[styles.notesText, { color: theme.text.secondary }]}>
                              {measurement.notes}
                            </Text>
                          </View>
                        )}

                        <TouchableOpacity
                          style={[styles.deleteButton, { borderColor: theme.semantic?.error || '#EF4444' }]}
                          onPress={() => handleDelete(measurement.id)}
                        >
                          <Feather name="trash-2" size={16} color={theme.semantic?.error || '#EF4444'} />
                          <Text style={[styles.deleteButtonText, { color: theme.semantic?.error || '#EF4444' }]}>
                            Excluir
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  monthGroup: {
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  measurementCard: {
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  measurementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  measurementDateBadge: {
    width: 48,
    alignItems: 'center',
    marginRight: 14,
  },
  measurementDay: {
    fontSize: 24,
    fontWeight: '700',
  },
  measurementMonth: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  measurementInfo: {
    flex: 1,
  },
  measurementMainStat: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  measurementCount: {
    fontSize: 13,
  },
  measurementDetails: {
    borderTopWidth: 1,
    padding: 14,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    paddingVertical: 8,
    paddingRight: 12,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
