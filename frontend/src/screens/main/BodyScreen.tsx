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
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useColors } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { BodyMeasurement, BodyMeasurementCreate, WeightRecord } from '../../types';

type PeriodType = '30D' | '3M' | '1A';

interface MeasurementCardProps {
  icon: string;
  label: string;
  value: string | number;
  unit: string;
  theme: any;
}

function MeasurementCard({ icon, label, value, unit, theme }: MeasurementCardProps) {
  return (
    <View style={[styles.measurementCard, { backgroundColor: theme.background.secondary }]}>
      <View style={[styles.measurementIcon, { backgroundColor: theme.accent.muted }]}>
        <Feather name={icon as any} size={18} color={theme.accent.primary} />
      </View>
      <Text style={[styles.measurementLabel, { color: theme.text.secondary }]}>{label}</Text>
      <View style={styles.measurementValueRow}>
        <Text style={[styles.measurementValue, { color: theme.text.primary }]}>{value}</Text>
        <Text style={[styles.measurementUnit, { color: theme.text.tertiary }]}>{unit}</Text>
      </View>
    </View>
  );
}

export default function BodyScreen() {
  const theme = useColors();
  const navigation = useNavigation();
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([]);
  const [latestMeasurement, setLatestMeasurement] = useState<BodyMeasurement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('30D');

  // Form state
  const [formData, setFormData] = useState<BodyMeasurementCreate>({});

  const loadData = useCallback(async () => {
    try {
      const [measurementsData, weightData, latest] = await Promise.all([
        api.getBodyMeasurements(10),
        api.getWeightHistory(90),
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

  const updateFormField = (field: keyof BodyMeasurementCreate, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  // Calculate statistics
  const getWeightChange = () => {
    if (weightHistory.length < 2) return { change: 0, percent: 0 };
    const latest = weightHistory[weightHistory.length - 1];
    const first = weightHistory[0];
    const change = latest.weight - first.weight;
    const percent = ((latest.weight - first.weight) / first.weight) * 100;
    return { change, percent };
  };

  const calculateIMC = () => {
    if (!latestMeasurement?.weight) return null;
    const height = 1.75; // Default height since we don't track it
    return latestMeasurement.weight / (height * height);
  };

  const { change: weightChange, percent: weightPercent } = getWeightChange();
  const imc = calculateIMC();

  // Filter weight history by period
  const getFilteredHistory = () => {
    const now = new Date();
    const days = selectedPeriod === '30D' ? 30 : selectedPeriod === '3M' ? 90 : 365;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return weightHistory.filter(r => new Date(r.date) >= cutoff);
  };

  const filteredHistory = getFilteredHistory();

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
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Medições Corporais</Text>
          <TouchableOpacity onPress={() => (navigation as any).navigate('BodyHistory')}>
            <Text style={[styles.historyLink, { color: theme.accent.primary }]}>Histórico</Text>
          </TouchableOpacity>
        </View>

        {/* Main Stats Cards */}
        <View style={styles.mainStatsRow}>
          <View style={[styles.mainStatCard, { backgroundColor: theme.background.secondary }]}>
            <Text style={[styles.mainStatLabel, { color: theme.text.secondary }]}>Peso Atual</Text>
            <Text style={[styles.mainStatValue, { color: theme.text.primary }]}>
              {latestMeasurement?.weight?.toFixed(1) || '--'}
            </Text>
            <Text style={[styles.mainStatUnit, { color: theme.text.tertiary }]}>kg</Text>
          </View>
          <View style={[styles.mainStatCard, { backgroundColor: theme.background.secondary }]}>
            <Text style={[styles.mainStatLabel, { color: theme.text.secondary }]}>Gordura</Text>
            <Text style={[styles.mainStatValue, { color: theme.text.primary }]}>
              {latestMeasurement?.body_fat_percentage?.toFixed(1) || '--'}
            </Text>
            <Text style={[styles.mainStatUnit, { color: theme.text.tertiary }]}>%</Text>
          </View>
          <View style={[styles.mainStatCard, { backgroundColor: theme.background.secondary }]}>
            <Text style={[styles.mainStatLabel, { color: theme.text.secondary }]}>IMC</Text>
            <Text style={[styles.mainStatValue, { color: theme.text.primary }]}>
              {imc?.toFixed(1) || '--'}
            </Text>
            <Text style={[styles.mainStatUnit, { color: theme.text.tertiary }]}></Text>
          </View>
        </View>

        {/* Progress Card */}
        <View style={[styles.progressCard, { backgroundColor: theme.background.secondary }]}>
          {/* Period Selector */}
          <View style={[styles.periodSelector, { backgroundColor: theme.background.tertiary }]}>
            {(['30D', '3M', '1A'] as PeriodType[]).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && { backgroundColor: theme.accent.primary },
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    { color: theme.text.secondary },
                    selectedPeriod === period && { color: '#000000', fontWeight: '600' },
                  ]}
                >
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Change Stats */}
          <View style={styles.changeStats}>
            <View style={styles.changeStat}>
              <Feather
                name={weightChange <= 0 ? 'trending-down' : 'trending-up'}
                size={20}
                color={weightChange <= 0 ? theme.semantic.success : theme.semantic.warning}
              />
              <Text
                style={[
                  styles.changeValue,
                  { color: weightChange <= 0 ? theme.semantic.success : theme.semantic.warning },
                ]}
              >
                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
              </Text>
            </View>
            <View style={styles.changeStat}>
              <Text
                style={[
                  styles.changePercent,
                  { color: weightPercent <= 0 ? theme.semantic.success : theme.semantic.warning },
                ]}
              >
                {weightPercent > 0 ? '+' : ''}{weightPercent.toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* Simple Chart */}
          {filteredHistory.length > 0 && (
            <View style={styles.chartContainer}>
              <View style={styles.chartArea}>
                {filteredHistory.slice(-7).map((record, index, arr) => {
                  const maxWeight = Math.max(...arr.map(r => r.weight));
                  const minWeight = Math.min(...arr.map(r => r.weight));
                  const range = maxWeight - minWeight || 1;
                  const height = ((record.weight - minWeight) / range) * 60 + 20;

                  return (
                    <View key={index} style={styles.chartBarWrapper}>
                      <View
                        style={[
                          styles.chartBar,
                          { height, backgroundColor: theme.accent.primary },
                        ]}
                      />
                    </View>
                  );
                })}
              </View>
              <View style={[styles.chartLine, { backgroundColor: theme.accent.primary + '40' }]} />
            </View>
          )}
        </View>

        {/* Measurements Section */}
        <View style={styles.measurementsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Medidas (cm)</Text>
          </View>

          <View style={styles.measurementsGrid}>
            <MeasurementCard
              icon="maximize-2"
              label="Peitoral"
              value={latestMeasurement?.chest?.toFixed(1) || '--'}
              unit="cm"
              theme={theme}
            />
            <MeasurementCard
              icon="minus"
              label="Cintura"
              value={latestMeasurement?.waist?.toFixed(1) || '--'}
              unit="cm"
              theme={theme}
            />
            <MeasurementCard
              icon="maximize"
              label="Quadril"
              value={latestMeasurement?.hips?.toFixed(1) || '--'}
              unit="cm"
              theme={theme}
            />
            <MeasurementCard
              icon="heart"
              label="Glúteo"
              value={latestMeasurement?.glutes?.toFixed(1) || '--'}
              unit="cm"
              theme={theme}
            />
            <MeasurementCard
              icon="circle"
              label="Bíceps Dir."
              value={latestMeasurement?.right_arm?.toFixed(1) || '--'}
              unit="cm"
              theme={theme}
            />
            <MeasurementCard
              icon="circle"
              label="Bíceps Esq."
              value={latestMeasurement?.left_arm?.toFixed(1) || '--'}
              unit="cm"
              theme={theme}
            />
            <MeasurementCard
              icon="move"
              label="Coxa Dir."
              value={latestMeasurement?.right_thigh?.toFixed(1) || '--'}
              unit="cm"
              theme={theme}
            />
            <MeasurementCard
              icon="move"
              label="Coxa Esq."
              value={latestMeasurement?.left_thigh?.toFixed(1) || '--'}
              unit="cm"
              theme={theme}
            />
          </View>

          {latestMeasurement && (
            <Text style={[styles.lastUpdateText, { color: theme.text.tertiary }]}>
              Atualizado em {new Date(latestMeasurement.date).toLocaleDateString('pt-BR')}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.accent.primary }]}
        onPress={() => {
          resetForm();
          setShowAddModal(true);
        }}
      >
        <Feather name="plus" size={26} color="#000000" />
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background.primary }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.border.primary }]}>
              <TouchableOpacity
                style={[styles.modalHeaderButton, { backgroundColor: theme.background.secondary }]}
                onPress={() => setShowAddModal(false)}
              >
                <Feather name="x" size={20} color={theme.text.primary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text.primary }]}>Nova Medida</Text>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.accent.primary }]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.saveButtonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              {/* Weight & BF */}
              <Text style={[styles.formSectionTitle, { color: theme.text.secondary }]}>
                PESO E COMPOSICAO
              </Text>
              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: theme.text.tertiary }]}>Peso (kg)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor={theme.text.tertiary}
                    value={formData.weight?.toString() || ''}
                    onChangeText={(v) => updateFormField('weight', v)}
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: theme.text.tertiary }]}>Gordura (%)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor={theme.text.tertiary}
                    value={formData.body_fat_percentage?.toString() || ''}
                    onChangeText={(v) => updateFormField('body_fat_percentage', v)}
                  />
                </View>
              </View>

              {/* Upper Body */}
              <Text style={[styles.formSectionTitle, { color: theme.text.secondary }]}>
                PARTE SUPERIOR
              </Text>
              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: theme.text.tertiary }]}>Peito (cm)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor={theme.text.tertiary}
                    value={formData.chest?.toString() || ''}
                    onChangeText={(v) => updateFormField('chest', v)}
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: theme.text.tertiary }]}>Ombros (cm)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor={theme.text.tertiary}
                    value={formData.shoulders?.toString() || ''}
                    onChangeText={(v) => updateFormField('shoulders', v)}
                  />
                </View>
              </View>
              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: theme.text.tertiary }]}>Bíceps Esq.</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor={theme.text.tertiary}
                    value={formData.left_arm?.toString() || ''}
                    onChangeText={(v) => updateFormField('left_arm', v)}
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: theme.text.tertiary }]}>Bíceps Dir.</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor={theme.text.tertiary}
                    value={formData.right_arm?.toString() || ''}
                    onChangeText={(v) => updateFormField('right_arm', v)}
                  />
                </View>
              </View>

              {/* Core */}
              <Text style={[styles.formSectionTitle, { color: theme.text.secondary }]}>CORE</Text>
              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: theme.text.tertiary }]}>Cintura (cm)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor={theme.text.tertiary}
                    value={formData.waist?.toString() || ''}
                    onChangeText={(v) => updateFormField('waist', v)}
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: theme.text.tertiary }]}>Quadril (cm)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor={theme.text.tertiary}
                    value={formData.hips?.toString() || ''}
                    onChangeText={(v) => updateFormField('hips', v)}
                  />
                </View>
              </View>
              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: theme.text.tertiary }]}>Glúteo (cm)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor={theme.text.tertiary}
                    value={formData.glutes?.toString() || ''}
                    onChangeText={(v) => updateFormField('glutes', v)}
                  />
                </View>
                <View style={styles.formField} />
              </View>

              {/* Lower Body */}
              <Text style={[styles.formSectionTitle, { color: theme.text.secondary }]}>
                PARTE INFERIOR
              </Text>
              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: theme.text.tertiary }]}>Coxa Esq.</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor={theme.text.tertiary}
                    value={formData.left_thigh?.toString() || ''}
                    onChangeText={(v) => updateFormField('left_thigh', v)}
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: theme.text.tertiary }]}>Coxa Dir.</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor={theme.text.tertiary}
                    value={formData.right_thigh?.toString() || ''}
                    onChangeText={(v) => updateFormField('right_thigh', v)}
                  />
                </View>
              </View>
              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: theme.text.tertiary }]}>Panturrilha Esq.</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor={theme.text.tertiary}
                    value={formData.left_calf?.toString() || ''}
                    onChangeText={(v) => updateFormField('left_calf', v)}
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: theme.text.tertiary }]}>Panturrilha Dir.</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor={theme.text.tertiary}
                    value={formData.right_calf?.toString() || ''}
                    onChangeText={(v) => updateFormField('right_calf', v)}
                  />
                </View>
              </View>

              {/* Notes */}
              <Text style={[styles.formSectionTitle, { color: theme.text.secondary }]}>
                OBSERVACOES
              </Text>
              <TextInput
                style={[styles.formInput, styles.notesInput, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
                placeholder="Adicione observacoes..."
                placeholderTextColor={theme.text.tertiary}
                multiline
                numberOfLines={3}
                value={formData.notes || ''}
                onChangeText={(v) => setFormData(prev => ({ ...prev, notes: v || undefined }))}
              />

              <View style={{ height: 40 }} />
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
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  historyLink: {
    fontSize: 15,
    fontWeight: '500',
  },
  mainStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  mainStatCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  mainStatLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  mainStatValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  mainStatUnit: {
    fontSize: 12,
    marginTop: 2,
  },
  progressCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  periodSelector: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  changeStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  changeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  changePercent: {
    fontSize: 16,
    fontWeight: '500',
  },
  chartContainer: {
    height: 100,
    position: 'relative',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
    paddingHorizontal: 8,
  },
  chartBarWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  chartBar: {
    width: 8,
    borderRadius: 4,
    minHeight: 20,
  },
  chartLine: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    height: 1,
  },
  measurementsSection: {
    marginBottom: 24,
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
  },
  editLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  measurementCard: {
    width: '48%',
    borderRadius: 14,
    padding: 14,
  },
  measurementIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  measurementLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  measurementValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  measurementValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  measurementUnit: {
    fontSize: 13,
  },
  lastUpdateText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  modalForm: {
    padding: 20,
  },
  formSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  formField: {
    flex: 1,
  },
  formLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  formInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
});
