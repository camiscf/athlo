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
  const { divisionId } = route.params;
  const isEditMode = !!divisionId;

  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<PlannedExerciseCreate[]>([]);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal de adicionar exercício
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('');
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedMuscleGroup) {
      setFilteredExercises(availableExercises.filter(e => e.muscle_group === selectedMuscleGroup));
    } else {
      setFilteredExercises(availableExercises);
    }
  }, [selectedMuscleGroup, availableExercises]);

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {/* Nome da divisão */}
        <View style={styles.section}>
          <Text style={styles.label}>Nome da Divisão</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Treino A - Peito e Tríceps"
            placeholderTextColor="#8E8E93"
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        </View>

        {/* Lista de exercícios */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Exercícios ({exercises.length})</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowExerciseModal(true)}
            >
              <Text style={styles.addButtonText}>+ Adicionar</Text>
            </TouchableOpacity>
          </View>

          {exercises.length === 0 ? (
            <View style={styles.emptyExercises}>
              <Text style={styles.emptyText}>Nenhum exercício adicionado</Text>
            </View>
          ) : (
            exercises.map((exercise, index) => (
              <View key={index} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
                    <Text style={styles.exerciseMuscle}>{exercise.muscle_group}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveExercise(index)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.exerciseInputs}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Séries</Text>
                    <TextInput
                      style={styles.smallInput}
                      value={String(exercise.sets)}
                      onChangeText={(v) => handleUpdateExercise(index, 'sets', parseInt(v) || 0)}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Reps</Text>
                    <TextInput
                      style={styles.smallInput}
                      value={exercise.reps}
                      onChangeText={(v) => handleUpdateExercise(index, 'reps', v)}
                      placeholder="10"
                      maxLength={10}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Carga (kg)</Text>
                    <TextInput
                      style={styles.smallInput}
                      value={exercise.suggested_weight ? String(exercise.suggested_weight) : ''}
                      onChangeText={(v) => handleUpdateExercise(index, 'suggested_weight', parseFloat(v) || undefined)}
                      keyboardType="decimal-pad"
                      placeholder="-"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Descanso</Text>
                    <TextInput
                      style={styles.smallInput}
                      value={exercise.rest_seconds ? String(exercise.rest_seconds) : ''}
                      onChangeText={(v) => handleUpdateExercise(index, 'rest_seconds', parseInt(v) || undefined)}
                      keyboardType="number-pad"
                      placeholder="60s"
                    />
                  </View>
                </View>

                <TextInput
                  style={styles.notesInput}
                  placeholder="Observações do exercício..."
                  placeholderTextColor="#8E8E93"
                  value={exercise.notes || ''}
                  onChangeText={(v) => handleUpdateExercise(index, 'notes', v || undefined)}
                />
              </View>
            ))
          )}
        </View>

        {/* Botões */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isSaving || isDeleting}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditMode ? 'Salvar Alterações' : 'Criar Divisão'}
            </Text>
          )}
        </TouchableOpacity>

        {isEditMode && (
          <TouchableOpacity
            style={[styles.deleteButton, isDeleting && styles.buttonDisabled]}
            onPress={handleDelete}
            disabled={isSaving || isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.deleteButtonText}>Excluir Divisão</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Modal de seleção de exercício */}
      <Modal
        visible={showExerciseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Exercício</Text>
              <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Filtro por grupo muscular */}
            <View style={styles.filterWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScrollContent}
              >
                <TouchableOpacity
                  style={[styles.filterButton, !selectedMuscleGroup && styles.filterButtonActive]}
                  onPress={() => setSelectedMuscleGroup('')}
                >
                  <Text style={[styles.filterButtonText, !selectedMuscleGroup && styles.filterButtonTextActive]}>
                    Todos
                  </Text>
                </TouchableOpacity>
                {muscleGroups.map((group) => (
                  <TouchableOpacity
                    key={group}
                    style={[styles.filterButton, selectedMuscleGroup === group && styles.filterButtonActive]}
                    onPress={() => setSelectedMuscleGroup(group)}
                  >
                    <Text style={[styles.filterButtonText, selectedMuscleGroup === group && styles.filterButtonTextActive]}>
                      {group}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Lista de exercícios */}
            <ScrollView style={styles.exerciseList}>
              {filteredExercises.map((exercise) => (
                <TouchableOpacity
                  key={`${exercise.muscle_group}-${exercise.name}`}
                  style={styles.exerciseOption}
                  onPress={() => handleAddExercise(exercise)}
                >
                  <Text style={styles.exerciseOptionName}>{exercise.name}</Text>
                  <Text style={styles.exerciseOptionMuscle}>{exercise.muscle_group}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyExercises: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  exerciseMuscle: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  removeButtonText: {
    fontSize: 18,
    color: '#FF3B30',
  },
  exerciseInputs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 4,
  },
  smallInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
  },
  notesInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#000000',
  },
  saveButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    flexDirection: 'column',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  modalClose: {
    fontSize: 24,
    color: '#8E8E93',
    padding: 4,
  },
  filterWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#000000',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  exerciseList: {
    flex: 1,
    padding: 16,
  },
  exerciseOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  exerciseOptionName: {
    fontSize: 16,
    color: '#000000',
  },
  exerciseOptionMuscle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
});
