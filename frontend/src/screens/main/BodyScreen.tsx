import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { BodyMeasurement, BodyMeasurementCreate, WeightRecord } from '../../types';

export default function BodyScreen() {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([]);
  const [latestMeasurement, setLatestMeasurement] = useState<BodyMeasurement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<BodyMeasurementCreate>({});

  const loadData = useCallback(async () => {
    try {
      const [measurementsData, weightData, latest] = await Promise.all([
        api.getBodyMeasurements(10),
        api.getWeightHistory(30),
        api.getLatestBodyMeasurement(),
      ]);
      setMeasurements(measurementsData);
      setWeightHistory(weightData);
      setLatestMeasurement(latest);
    } catch (error) {
      console.error('Error loading body data:', error);
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

  const resetForm = () => {
    setFormData({});
  };

  const handleSave = async () => {
    // Check if at least one field is filled
    const hasValue = Object.values(formData).some(v => v !== undefined && v !== null && v !== '');
    if (!hasValue) {
      if (Platform.OS === 'web') {
        window.alert('Preencha pelo menos um campo');
      }
      return;
    }

    setIsSaving(true);
    try {
      await api.createBodyMeasurement(formData);
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving measurement:', error);
      if (Platform.OS === 'web') {
        window.alert('Erro ao salvar medida');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = Platform.OS === 'web'
      ? window.confirm('Tem certeza que deseja excluir esta medida?')
      : true;

    if (!confirmDelete) return;

    try {
      await api.deleteBodyMeasurement(id);
      loadData();
    } catch (error) {
      console.error('Error deleting measurement:', error);
    }
  };

  const updateFormField = (field: keyof BodyMeasurementCreate, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  // Calculate weight change
  const getWeightChange = () => {
    if (weightHistory.length < 2) return null;
    const latest = weightHistory[weightHistory.length - 1];
    const previous = weightHistory[weightHistory.length - 2];
    return latest.weight - previous.weight;
  };

  const weightChange = getWeightChange();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Current Stats Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Medidas Atuais</Text>
          {latestMeasurement ? (
            <View style={styles.statsGrid}>
              {latestMeasurement.weight && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{latestMeasurement.weight.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Peso (kg)</Text>
                  {weightChange !== null && (
                    <Text style={[
                      styles.statChange,
                      weightChange > 0 ? styles.statChangeUp : styles.statChangeDown
                    ]}>
                      {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                    </Text>
                  )}
                </View>
              )}
              {latestMeasurement.body_fat_percentage && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{latestMeasurement.body_fat_percentage.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>BF%</Text>
                </View>
              )}
              {latestMeasurement.chest && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{latestMeasurement.chest.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Peito (cm)</Text>
                </View>
              )}
              {latestMeasurement.waist && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{latestMeasurement.waist.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Cintura (cm)</Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.emptyText}>Nenhuma medida registrada</Text>
          )}
          {latestMeasurement && (
            <Text style={styles.lastUpdate}>
              Atualizado em {formatDate(latestMeasurement.date)}
            </Text>
          )}
        </View>

        {/* Weight History */}
        {weightHistory.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Histórico de Peso</Text>
            <View style={styles.weightChart}>
              {weightHistory.slice(-7).map((record, index) => {
                const maxWeight = Math.max(...weightHistory.map(r => r.weight));
                const minWeight = Math.min(...weightHistory.map(r => r.weight));
                const range = maxWeight - minWeight || 1;
                const height = ((record.weight - minWeight) / range) * 80 + 20;

                return (
                  <View key={index} style={styles.chartBar}>
                    <Text style={styles.chartValue}>{record.weight.toFixed(0)}</Text>
                    <View style={[styles.bar, { height }]} />
                    <Text style={styles.chartDate}>
                      {new Date(record.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Measurements History */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Histórico de Medidas</Text>
          {measurements.length > 0 ? (
            measurements.map((measurement) => (
              <TouchableOpacity
                key={measurement.id}
                style={styles.measurementItem}
                onLongPress={() => handleDelete(measurement.id)}
              >
                <View style={styles.measurementHeader}>
                  <Text style={styles.measurementDate}>{formatDate(measurement.date)}</Text>
                  {measurement.weight && (
                    <Text style={styles.measurementWeight}>{measurement.weight.toFixed(1)} kg</Text>
                  )}
                </View>
                <View style={styles.measurementDetails}>
                  {measurement.body_fat_percentage && (
                    <Text style={styles.measurementDetail}>BF: {measurement.body_fat_percentage}%</Text>
                  )}
                  {measurement.chest && (
                    <Text style={styles.measurementDetail}>Peito: {measurement.chest}cm</Text>
                  )}
                  {measurement.waist && (
                    <Text style={styles.measurementDetail}>Cintura: {measurement.waist}cm</Text>
                  )}
                  {measurement.hips && (
                    <Text style={styles.measurementDetail}>Quadril: {measurement.hips}cm</Text>
                  )}
                  {(measurement.left_arm || measurement.right_arm) && (
                    <Text style={styles.measurementDetail}>
                      Braços: {measurement.left_arm || '-'}/{measurement.right_arm || '-'}cm
                    </Text>
                  )}
                </View>
                {measurement.notes && (
                  <Text style={styles.measurementNotes}>{measurement.notes}</Text>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhuma medida registrada ainda</Text>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          resetForm();
          setShowAddModal(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCancel}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Nova Medida</Text>
              <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                <Text style={[styles.modalSave, isSaving && styles.modalSaveDisabled]}>
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Weight & BF */}
              <Text style={styles.sectionTitle}>Peso e Composição</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Peso (kg)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    value={formData.weight?.toString() || ''}
                    onChangeText={(v) => updateFormField('weight', v)}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>BF%</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    value={formData.body_fat_percentage?.toString() || ''}
                    onChangeText={(v) => updateFormField('body_fat_percentage', v)}
                  />
                </View>
              </View>

              {/* Upper Body */}
              <Text style={styles.sectionTitle}>Parte Superior</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Peito (cm)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    value={formData.chest?.toString() || ''}
                    onChangeText={(v) => updateFormField('chest', v)}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Ombros (cm)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    value={formData.shoulders?.toString() || ''}
                    onChangeText={(v) => updateFormField('shoulders', v)}
                  />
                </View>
              </View>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Braço E (cm)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    value={formData.left_arm?.toString() || ''}
                    onChangeText={(v) => updateFormField('left_arm', v)}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Braço D (cm)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    value={formData.right_arm?.toString() || ''}
                    onChangeText={(v) => updateFormField('right_arm', v)}
                  />
                </View>
              </View>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Pescoço (cm)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    value={formData.neck?.toString() || ''}
                    onChangeText={(v) => updateFormField('neck', v)}
                  />
                </View>
                <View style={styles.inputGroup} />
              </View>

              {/* Core */}
              <Text style={styles.sectionTitle}>Core</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Cintura (cm)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    value={formData.waist?.toString() || ''}
                    onChangeText={(v) => updateFormField('waist', v)}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quadril (cm)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    value={formData.hips?.toString() || ''}
                    onChangeText={(v) => updateFormField('hips', v)}
                  />
                </View>
              </View>

              {/* Lower Body */}
              <Text style={styles.sectionTitle}>Parte Inferior</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Coxa E (cm)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    value={formData.left_thigh?.toString() || ''}
                    onChangeText={(v) => updateFormField('left_thigh', v)}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Coxa D (cm)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    value={formData.right_thigh?.toString() || ''}
                    onChangeText={(v) => updateFormField('right_thigh', v)}
                  />
                </View>
              </View>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Panturrilha E (cm)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    value={formData.left_calf?.toString() || ''}
                    onChangeText={(v) => updateFormField('left_calf', v)}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Panturrilha D (cm)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    value={formData.right_calf?.toString() || ''}
                    onChangeText={(v) => updateFormField('right_calf', v)}
                  />
                </View>
              </View>

              {/* Notes */}
              <Text style={styles.sectionTitle}>Observações</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Adicione observações..."
                multiline
                numberOfLines={3}
                value={formData.notes || ''}
                onChangeText={(v) => setFormData(prev => ({ ...prev, notes: v || undefined }))}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  statChange: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  statChangeUp: {
    color: '#FF9500',
  },
  statChangeDown: {
    color: '#34C759',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 20,
  },
  weightChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 20,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  chartValue: {
    fontSize: 10,
    color: '#8E8E93',
    marginBottom: 4,
  },
  bar: {
    width: '80%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
    minHeight: 20,
  },
  chartDate: {
    fontSize: 9,
    color: '#8E8E93',
    marginTop: 4,
  },
  measurementItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    paddingVertical: 12,
  },
  measurementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  measurementDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  measurementWeight: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  measurementDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  measurementDetail: {
    fontSize: 12,
    color: '#8E8E93',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  measurementNotes: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '400',
    lineHeight: 32,
    marginTop: -2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  modalCancel: {
    fontSize: 17,
    color: '#007AFF',
  },
  modalSave: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalSaveDisabled: {
    color: '#C7C7CC',
  },
  modalForm: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 40,
  },
});
