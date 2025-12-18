import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { Exercise, PlannedExerciseCreate, WorkoutDivision } from '../../types';

interface EditDivisionScreenProps {
  route: {
    params: {
      divisionId: string | null;
    };
  };
  navigation: any;
}

export default function EditDivisionScreen({ route, navigation }: EditDivisionScreenProps) {
  const theme = useColors();
  const { divisionId } = route.params;
  const isEditMode = !!divisionId;

  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<PlannedExerciseCreate[]>([]);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal state
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('');
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = availableExercises;

    if (selectedMuscleGroup) {
      filtered = filtered.filter(e => e.muscle_group === selectedMuscleGroup);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.muscle_group.toLowerCase().includes(query)
      );
    }

    setFilteredExercises(filtered);
  }, [selectedMuscleGroup, availableExercises, searchQuery]);

  async function loadData() {
    try {
      const [exercisesData, groupsData] = await Promise.all([
        api.getExercises(),
        api.getMuscleGroups(),
      ]);
      setAvailableExercises(exercisesData);
      setMuscleGroups(groupsData);

      if (isEditMode && divisionId) {
        const division = await api.getWorkoutDivision(divisionId);
        setName(division.name);
        setExercises(division.exercises.map(e => ({
          exercise_name: e.exercise_name,
          muscle_group: e.muscle_group,
          sets: e.sets,
          reps: e.reps,
          rest_seconds: e.rest_seconds || undefined,
          suggested_weight: e.suggested_weight || undefined,
          notes: e.notes || undefined,
          order: e.order,
        })));
      }
    } catch (error) {
      showAlert('Erro', 'Não foi possível carregar os dados.');
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

  function handleAddExercise(exercise: Exercise) {
    const newExercise: PlannedExerciseCreate = {
      exercise_name: exercise.name,
      muscle_group: exercise.muscle_group,
      sets: 3,
      reps: '10',
      order: exercises.length,
    };
    setExercises([...exercises, newExercise]);
    setShowExerciseModal(false);
    setSearchQuery('');
    setSelectedMuscleGroup('');
  }

  function handleRemoveExercise(index: number) {
    setExercises(exercises.filter((_, i) => i !== index));
  }

  function handleUpdateExercise(index: number, field: string, value: any) {
    const updated = [...exercises];
    (updated[index] as any)[field] = value;
    setExercises(updated);
  }

  async function handleSave() {
    if (!name.trim()) {
      showAlert('Erro', 'Digite um nome para a divisão.');
      return;
    }

    if (exercises.length === 0) {
      showAlert('Erro', 'Adicione pelo menos um exercício.');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        name: name.trim(),
        exercises: exercises.map((e, i) => ({ ...e, order: i })),
      };

      if (isEditMode && divisionId) {
        await api.updateWorkoutDivision(divisionId, data);
        showAlert('Sucesso', 'Divisão atualizada com sucesso!');
      } else {
        await api.createWorkoutDivision(data);
        showAlert('Sucesso', 'Divisão criada com sucesso!');
      }
      navigation.goBack();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erro ao salvar divisão.';
      showAlert('Erro', message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!divisionId) return;

    const confirmed = Platform.OS === 'web'
      ? window.confirm('Tem certeza que deseja excluir esta divisão?')
      : true;

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await api.deleteWorkoutDivision(divisionId);
      showAlert('Sucesso', 'Divisão excluída com sucesso!');
      navigation.goBack();
    } catch (error) {
      showAlert('Erro', 'Não foi possível excluir a divisão.');
    } finally {
      setIsDeleting(false);
    }
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
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border.primary }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.background.secondary }]}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
          {isEditMode ? 'Editar Divisão' : 'Nova Divisão'}
        </Text>
        <TouchableOpacity
          style={[styles.saveHeaderButton, { backgroundColor: theme.accent.primary }, isSaving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isSaving || isDeleting}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <Text style={styles.saveHeaderButtonText}>Salvar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Division Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text.secondary }]}>NOME DA DIVISAO</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
            placeholder="Ex: Treino A - Peito e Triceps"
            placeholderTextColor={theme.text.tertiary}
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        </View>

        {/* Exercises Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.label, { color: theme.text.secondary }]}>
              EXERCICIOS SELECIONADOS ({exercises.length})
            </Text>
          </View>

          {exercises.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.background.secondary }]}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.accent.muted }]}>
                <Feather name="target" size={32} color={theme.accent.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>
                Nenhum exercício adicionado
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.text.tertiary }]}>
                Adicione exercícios para montar sua divisão
              </Text>
            </View>
          ) : (
            exercises.map((exercise, index) => (
              <View key={index} style={[styles.exerciseCard, { backgroundColor: theme.background.secondary }]}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, { color: theme.text.primary }]}>
                      {exercise.exercise_name}
                    </Text>
                    <View style={[styles.muscleBadge, { backgroundColor: theme.accent.muted }]}>
                      <Text style={[styles.muscleBadgeText, { color: theme.accent.primary }]}>
                        {exercise.muscle_group}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: theme.semantic.errorMuted }]}
                    onPress={() => handleRemoveExercise(index)}
                  >
                    <Feather name="x" size={16} color={theme.semantic.error} />
                  </TouchableOpacity>
                </View>

                <View style={styles.exerciseInputsGrid}>
                  <View style={styles.exerciseInputsRow}>
                    <View style={styles.inputGroupWide}>
                      <Text style={[styles.inputLabel, { color: theme.text.tertiary }]}>Séries</Text>
                      <TextInput
                        style={[styles.wideInput, { backgroundColor: theme.background.tertiary, color: theme.text.primary }]}
                        value={String(exercise.sets)}
                        onChangeText={(v) => handleUpdateExercise(index, 'sets', parseInt(v) || 0)}
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                    </View>
                    <View style={styles.inputGroupWide}>
                      <Text style={[styles.inputLabel, { color: theme.text.tertiary }]}>Repetições</Text>
                      <TextInput
                        style={[styles.wideInput, { backgroundColor: theme.background.tertiary, color: theme.text.primary }]}
                        value={exercise.reps}
                        onChangeText={(v) => handleUpdateExercise(index, 'reps', v)}
                        placeholder="10"
                        placeholderTextColor={theme.text.tertiary}
                        maxLength={10}
                      />
                    </View>
                  </View>
                  <View style={styles.exerciseInputsRow}>
                    <View style={styles.inputGroupWide}>
                      <Text style={[styles.inputLabel, { color: theme.text.tertiary }]}>Carga (kg)</Text>
                      <TextInput
                        style={[styles.wideInput, { backgroundColor: theme.background.tertiary, color: theme.text.primary }]}
                        value={exercise.suggested_weight ? String(exercise.suggested_weight) : ''}
                        onChangeText={(v) => handleUpdateExercise(index, 'suggested_weight', parseFloat(v) || undefined)}
                        keyboardType="decimal-pad"
                        placeholder="-"
                        placeholderTextColor={theme.text.tertiary}
                      />
                    </View>
                    <View style={styles.inputGroupWide}>
                      <Text style={[styles.inputLabel, { color: theme.text.tertiary }]}>Descanso (s)</Text>
                      <TextInput
                        style={[styles.wideInput, { backgroundColor: theme.background.tertiary, color: theme.text.primary }]}
                        value={exercise.rest_seconds ? String(exercise.rest_seconds) : ''}
                        onChangeText={(v) => handleUpdateExercise(index, 'rest_seconds', parseInt(v) || undefined)}
                        keyboardType="number-pad"
                        placeholder="60"
                        placeholderTextColor={theme.text.tertiary}
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}

          {/* Add Exercise Button */}
          <TouchableOpacity
            style={[styles.addExerciseButton, { borderColor: theme.border.secondary }]}
            onPress={() => setShowExerciseModal(true)}
          >
            <Feather name="plus" size={20} color={theme.accent.primary} />
            <Text style={[styles.addExerciseText, { color: theme.accent.primary }]}>
              Adicionar Exercício
            </Text>
          </TouchableOpacity>
        </View>

        {/* Delete Button */}
        {isEditMode && (
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: theme.semantic.error }, isDeleting && styles.buttonDisabled]}
            onPress={handleDelete}
            disabled={isSaving || isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Feather name="trash-2" size={18} color="#FFFFFF" />
                <Text style={styles.deleteButtonText}>Excluir Divisão</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Exercise Selection Modal */}
      <Modal
        visible={showExerciseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background.primary }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.border.primary }]}>
              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: theme.background.secondary }]}
                onPress={() => {
                  setShowExerciseModal(false);
                  setSearchQuery('');
                  setSelectedMuscleGroup('');
                }}
              >
                <Feather name="x" size={20} color={theme.text.primary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
                Adicionar Exercício
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: theme.background.secondary }]}>
              <Feather name="search" size={18} color={theme.text.tertiary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text.primary }]}
                placeholder="Buscar exercício..."
                placeholderTextColor={theme.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Feather name="x" size={18} color={theme.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Muscle Group Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContent}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  { backgroundColor: theme.background.secondary },
                  !selectedMuscleGroup && { backgroundColor: theme.accent.primary },
                ]}
                onPress={() => setSelectedMuscleGroup('')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: theme.text.secondary },
                    !selectedMuscleGroup && { color: '#000000', fontWeight: '600' },
                  ]}
                >
                  Todos
                </Text>
              </TouchableOpacity>
              {muscleGroups.map((group) => (
                <TouchableOpacity
                  key={group}
                  style={[
                    styles.filterChip,
                    { backgroundColor: theme.background.secondary },
                    selectedMuscleGroup === group && { backgroundColor: theme.accent.primary },
                  ]}
                  onPress={() => setSelectedMuscleGroup(group)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: theme.text.secondary },
                      selectedMuscleGroup === group && { color: '#000000', fontWeight: '600' },
                    ]}
                  >
                    {group}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Exercise List */}
            <ScrollView style={styles.exerciseList}>
              {filteredExercises.length === 0 ? (
                <View style={styles.noResults}>
                  <Feather name="search" size={40} color={theme.text.tertiary} />
                  <Text style={[styles.noResultsText, { color: theme.text.tertiary }]}>
                    Nenhum exercício encontrado
                  </Text>
                </View>
              ) : (
                filteredExercises.map((exercise, index) => (
                  <TouchableOpacity
                    key={`${exercise.muscle_group}-${exercise.name}-${index}`}
                    style={[
                      styles.exerciseOption,
                      { backgroundColor: theme.background.secondary },
                    ]}
                    onPress={() => handleAddExercise(exercise)}
                  >
                    <View style={[styles.exerciseOptionIcon, { backgroundColor: theme.accent.muted }]}>
                      <Feather name="target" size={18} color={theme.accent.primary} />
                    </View>
                    <View style={styles.exerciseOptionInfo}>
                      <Text style={[styles.exerciseOptionName, { color: theme.text.primary }]}>
                        {exercise.name}
                      </Text>
                      <Text style={[styles.exerciseOptionMuscle, { color: theme.text.tertiary }]}>
                        {exercise.muscle_group}
                      </Text>
                    </View>
                    <Feather name="plus" size={20} color={theme.accent.primary} />
                  </TouchableOpacity>
                ))
              )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveHeaderButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveHeaderButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
  },
  emptyState: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  exerciseCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  muscleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  muscleBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInputsGrid: {
    gap: 10,
  },
  exerciseInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroupWide: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  wideInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    gap: 8,
  },
  addExerciseText: {
    fontSize: 15,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterScroll: {
    marginTop: 16,
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  filterChipText: {
    fontSize: 14,
  },
  exerciseList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  exerciseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  exerciseOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseOptionInfo: {
    flex: 1,
  },
  exerciseOptionName: {
    fontSize: 15,
    fontWeight: '500',
  },
  exerciseOptionMuscle: {
    fontSize: 13,
    marginTop: 2,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noResultsText: {
    fontSize: 15,
    marginTop: 12,
  },
});
