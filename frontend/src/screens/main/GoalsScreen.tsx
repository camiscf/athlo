import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useColors } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { Goal, GoalCreate, ActivityType, GoalPeriod } from '../../types';

export default function GoalsScreen() {
  const theme = useColors();
  const navigation = useNavigation();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [selectedType, setSelectedType] = useState<ActivityType>('running');
  const [targetFrequency, setTargetFrequency] = useState('3');
  const [selectedPeriod, setSelectedPeriod] = useState<GoalPeriod>('weekly');

  const loadGoals = async () => {
    try {
      const data = await api.getGoals(false); // Get all goals, not just active
      setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadGoals();
  };

  const openAddModal = () => {
    setEditingGoal(null);
    setSelectedType('running');
    setTargetFrequency('3');
    setSelectedPeriod('weekly');
    setShowModal(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setSelectedType(goal.activity_type);
    setTargetFrequency(goal.target_frequency.toString());
    setSelectedPeriod(goal.period);
    setShowModal(true);
  };

  const handleSave = async () => {
    const freq = parseInt(targetFrequency);
    if (isNaN(freq) || freq < 1 || freq > 14) {
      showAlert('Erro', 'Frequência deve ser entre 1 e 14');
      return;
    }

    setIsSaving(true);
    try {
      if (editingGoal) {
        await api.updateGoal(editingGoal.id, {
          target_frequency: freq,
          period: selectedPeriod,
        });
      } else {
        const data: GoalCreate = {
          activity_type: selectedType,
          target_frequency: freq,
          period: selectedPeriod,
        };
        await api.createGoal(data);
      }
      setShowModal(false);
      loadGoals();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erro ao salvar meta';
      showAlert('Erro', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (goal: Goal) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Deseja excluir a meta "${goal.display_text}"?`);
      if (!confirmed) return;
    }

    try {
      await api.deleteGoal(goal.id);
      loadGoals();
    } catch (error) {
      showAlert('Erro', 'Não foi possível excluir a meta');
    }
  };

  const handleToggleActive = async (goal: Goal) => {
    try {
      await api.updateGoal(goal.id, { is_active: !goal.is_active });
      loadGoals();
    } catch (error) {
      showAlert('Erro', 'Não foi possível atualizar a meta');
    }
  };

  function showAlert(title: string, message: string) {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    }
  }

  const getActivityIcon = (type: ActivityType) => {
    return type === 'running' ? 'zap' : 'target';
  };

  const getActivityLabel = (type: ActivityType) => {
    return type === 'running' ? 'Corrida' : 'Academia';
  };

  const getPeriodLabel = (period: GoalPeriod) => {
    return period === 'weekly' ? 'Semanal' : 'Mensal';
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background.primary }]}>
        <ActivityIndicator size="large" color={theme.accent.primary} />
      </View>
    );
  }

  const activeGoals = goals.filter(g => g.is_active);
  const inactiveGoals = goals.filter(g => !g.is_active);

  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
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
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Minhas Metas</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.accent.primary }]}
            onPress={openAddModal}
          >
            <Feather name="plus" size={20} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>METAS ATIVAS</Text>
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                theme={theme}
                onEdit={() => openEditModal(goal)}
                onDelete={() => handleDelete(goal)}
                onToggleActive={() => handleToggleActive(goal)}
              />
            ))}
          </View>
        )}

        {/* Empty State */}
        {activeGoals.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: theme.background.secondary }]}>
            <Feather name="target" size={48} color={theme.text.tertiary} />
            <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>
              Nenhuma meta ativa
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
              Defina metas para acompanhar seu progresso semanal
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: theme.accent.primary }]}
              onPress={openAddModal}
            >
              <Text style={styles.emptyButtonText}>Criar Meta</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Inactive Goals */}
        {inactiveGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>METAS INATIVAS</Text>
            {inactiveGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                theme={theme}
                onEdit={() => openEditModal(goal)}
                onDelete={() => handleDelete(goal)}
                onToggleActive={() => handleToggleActive(goal)}
                isInactive
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background.secondary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
                {editingGoal ? 'Editar Meta' : 'Nova Meta'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Feather name="x" size={24} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Activity Type Selection */}
            {!editingGoal && (
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: theme.text.secondary }]}>TIPO DE ATIVIDADE</Text>
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      { backgroundColor: theme.background.tertiary },
                      selectedType === 'running' && { backgroundColor: theme.accent.primary },
                    ]}
                    onPress={() => setSelectedType('running')}
                  >
                    <Feather
                      name="zap"
                      size={20}
                      color={selectedType === 'running' ? '#000000' : theme.text.primary}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        { color: selectedType === 'running' ? '#000000' : theme.text.primary },
                      ]}
                    >
                      Corrida
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      { backgroundColor: theme.background.tertiary },
                      selectedType === 'strength' && { backgroundColor: theme.accent.primary },
                    ]}
                    onPress={() => setSelectedType('strength')}
                  >
                    <Feather
                      name="target"
                      size={20}
                      color={selectedType === 'strength' ? '#000000' : theme.text.primary}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        { color: selectedType === 'strength' ? '#000000' : theme.text.primary },
                      ]}
                    >
                      Academia
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Frequency Input */}
            <View style={styles.formSection}>
              <Text style={[styles.formLabel, { color: theme.text.secondary }]}>FREQUÊNCIA</Text>
              <View style={styles.frequencyRow}>
                <TouchableOpacity
                  style={[styles.frequencyButton, { backgroundColor: theme.background.tertiary }]}
                  onPress={() => {
                    const val = Math.max(1, parseInt(targetFrequency) - 1);
                    setTargetFrequency(val.toString());
                  }}
                >
                  <Feather name="minus" size={20} color={theme.text.primary} />
                </TouchableOpacity>
                <View style={[styles.frequencyInputWrapper, { backgroundColor: theme.background.tertiary }]}>
                  <TextInput
                    style={[styles.frequencyInput, { color: theme.text.primary }]}
                    value={targetFrequency}
                    onChangeText={setTargetFrequency}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={[styles.frequencyLabel, { color: theme.text.secondary }]}>
                    vezes
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.frequencyButton, { backgroundColor: theme.background.tertiary }]}
                  onPress={() => {
                    const val = Math.min(14, parseInt(targetFrequency) + 1);
                    setTargetFrequency(val.toString());
                  }}
                >
                  <Feather name="plus" size={20} color={theme.text.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Period Selection */}
            <View style={styles.formSection}>
              <Text style={[styles.formLabel, { color: theme.text.secondary }]}>PERÍODO</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { backgroundColor: theme.background.tertiary },
                    selectedPeriod === 'weekly' && { backgroundColor: theme.accent.primary },
                  ]}
                  onPress={() => setSelectedPeriod('weekly')}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: selectedPeriod === 'weekly' ? '#000000' : theme.text.primary },
                    ]}
                  >
                    Por Semana
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { backgroundColor: theme.background.tertiary },
                    selectedPeriod === 'monthly' && { backgroundColor: theme.accent.primary },
                  ]}
                  onPress={() => setSelectedPeriod('monthly')}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: selectedPeriod === 'monthly' ? '#000000' : theme.text.primary },
                    ]}
                  >
                    Por Mês
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Preview */}
            <View style={[styles.previewCard, { backgroundColor: theme.background.tertiary }]}>
              <Feather
                name={getActivityIcon(selectedType)}
                size={24}
                color={theme.accent.primary}
              />
              <Text style={[styles.previewText, { color: theme.text.primary }]}>
                {targetFrequency}x {getActivityLabel(selectedType).toLowerCase()} por{' '}
                {selectedPeriod === 'weekly' ? 'semana' : 'mês'}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.background.tertiary }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text.secondary }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.accent.primary }]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingGoal ? 'Atualizar' : 'Criar Meta'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Goal Card Component
function GoalCard({
  goal,
  theme,
  onEdit,
  onDelete,
  onToggleActive,
  isInactive = false,
}: {
  goal: Goal;
  theme: any;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  isInactive?: boolean;
}) {
  const progressWidth = `${Math.min(100, goal.progress.percentage)}%`;
  const isComplete = goal.progress.current >= goal.progress.target;

  return (
    <View
      style={[
        styles.goalCard,
        { backgroundColor: theme.background.secondary },
        isInactive && { opacity: 0.6 },
      ]}
    >
      <View style={styles.goalHeader}>
        <View style={styles.goalIconRow}>
          <View style={[styles.goalIcon, { backgroundColor: theme.accent.muted }]}>
            <Feather
              name={goal.activity_type === 'running' ? 'zap' : 'target'}
              size={18}
              color={theme.accent.primary}
            />
          </View>
          <View style={styles.goalInfo}>
            <Text style={[styles.goalTitle, { color: theme.text.primary }]}>
              {goal.display_text}
            </Text>
            <Text style={[styles.goalPeriod, { color: theme.text.tertiary }]}>
              {goal.period === 'weekly' ? 'Esta semana' : 'Este mês'}
            </Text>
          </View>
        </View>
        <View style={styles.goalActions}>
          <TouchableOpacity onPress={onEdit} style={styles.goalActionButton}>
            <Feather name="edit-2" size={16} color={theme.text.tertiary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onToggleActive} style={styles.goalActionButton}>
            <Feather name={isInactive ? 'eye' : 'eye-off'} size={16} color={theme.text.tertiary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.goalActionButton}>
            <Feather name="trash-2" size={16} color={theme.semantic?.error || '#EF4444'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBarBg, { backgroundColor: theme.background.tertiary }]}>
        <View
          style={[
            styles.progressBarFill,
            { width: progressWidth, backgroundColor: isComplete ? theme.accent.primary : theme.accent.primary },
          ]}
        />
      </View>

      {/* Progress Text */}
      <View style={styles.progressTextRow}>
        <Text style={[styles.progressCount, { color: theme.text.primary }]}>
          {goal.progress.current} / {goal.progress.target}
        </Text>
        <Text style={[styles.progressPercent, { color: isComplete ? theme.accent.primary : theme.text.secondary }]}>
          {goal.progress.percentage.toFixed(0)}%
        </Text>
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
  content: {
    padding: 20,
    paddingBottom: 40,
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    marginTop: 40,
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
    marginBottom: 20,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  goalCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  goalPeriod: {
    fontSize: 12,
  },
  goalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  goalActionButton: {
    padding: 4,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  frequencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  frequencyButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frequencyInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  frequencyInput: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    width: 50,
  },
  frequencyLabel: {
    fontSize: 16,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});
