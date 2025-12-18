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
} from 'react-native';
import { api } from '../../services/api';
import { WorkoutDivision, ExerciseLogCreate, ExerciseHistory } from '../../types';
import DatePicker from '../../components/DatePicker';
import TimePicker from '../../components/TimePicker';

interface RecordStrengthWorkoutScreenProps {
  route: {
    params: {
      divisionId: string;
    };
  };
  navigation: any;
}

interface ExerciseLogWithHistory extends ExerciseLogCreate {
  previous_weight?: number | null;
  previous_reps?: string | null;
}

export default function RecordStrengthWorkoutScreen({ route, navigation }: RecordStrengthWorkoutScreenProps) {
  const { divisionId } = route.params;

  const [division, setDivision] = useState<WorkoutDivision | null>(null);
  const [exercises, setExercises] = useState<ExerciseLogWithHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Campos do treino
  const [activityDate, setActivityDate] = useState('');
  const [activityTime, setActivityTime] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [effort, setEffort] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const effortLevels = [
    { value: 1, label: '1' },
    { value: 3, label: '3' },
    { value: 5, label: '5' },
    { value: 7, label: '7' },
    { value: 9, label: '9' },
    { value: 10, label: '10' },
  ];

  useEffect(() => {
    loadData();
    initDateTime();
  }, []);

  function initDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    setActivityDate(`${year}-${month}-${day}`);
    setActivityTime(`${hours}:${mins}`);
  }

  async function loadData() {
    try {
      const divisionData = await api.getWorkoutDivision(divisionId);
      setDivision(divisionData);

      // Carregar histórico de cada exercício
      const exercisesWithHistory: ExerciseLogWithHistory[] = await Promise.all(
        divisionData.exercises.map(async (ex) => {
          let history: ExerciseHistory | null = null;
          try {
            history = await api.getExerciseHistory(ex.exercise_name, 1);
          } catch (e) {
            // Sem histórico
          }

          const lastRecord = history?.records?.[0];

          return {
            exercise_name: ex.exercise_name,
            muscle_group: ex.muscle_group,
            planned_sets: ex.sets,
            planned_reps: ex.reps,
            sets_completed: ex.sets,
            reps_completed: ex.reps,
            weight: ex.suggested_weight || lastRecord?.weight || undefined,
            rpe: undefined,
            notes: undefined,
            previous_weight: lastRecord?.weight || null,
            previous_reps: lastRecord?.reps || null,
          };
        })
      );

      setExercises(exercisesWithHistory);
    } catch (error) {
      showAlert('Erro', 'Não foi possível carregar a divisão.');
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

  function handleUpdateExercise(index: number, field: string, value: any) {
    const updated = [...exercises];
    (updated[index] as any)[field] = value;
    setExercises(updated);
  }

  async function handleSave() {
    if (exercises.length === 0) {
      showAlert('Erro', 'Nenhum exercício para registrar.');
      return;
    }

    setIsSaving(true);
    try {
      // Montar data/hora
      let startTime: Date;
      if (activityDate) {
        const [year, month, day] = activityDate.split('-').map(Number);
        if (activityTime) {
          const [hour, minute] = activityTime.split(':').map(Number);
          startTime = new Date(year, month - 1, day, hour, minute);
        } else {
          startTime = new Date(year, month - 1, day, 12, 0);
        }
      } else {
        startTime = new Date();
      }

      // Calcular duração em segundos
      const hoursNum = parseInt(durationHours) || 0;
      const minutesNum = parseInt(durationMinutes) || 0;
      const totalSeconds = hoursNum * 3600 + minutesNum * 60;

      const data = {
        title: division?.name,
        division_id: divisionId,
        division_name: division?.name,
        start_time: startTime.toISOString(),
        exercises: exercises.map(ex => ({
          exercise_name: ex.exercise_name,
          muscle_group: ex.muscle_group,
          planned_sets: ex.planned_sets,
          planned_reps: ex.planned_reps,
          sets_completed: ex.sets_completed,
          reps_completed: ex.reps_completed,
          weight: ex.weight,
          rpe: ex.rpe,
          notes: ex.notes,
        })),
        duration: totalSeconds > 0 ? totalSeconds : undefined,
        effort,
        notes: notes.trim() || undefined,
      };

      await api.createStrengthActivity(data);
      showAlert('Sucesso', 'Treino registrado com sucesso!');
      navigation.goBack();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erro ao salvar treino.';
      showAlert('Erro', message);
    } finally {
      setIsSaving(false);
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{division?.name}</Text>
          <Text style={styles.subtitle}>
            {exercises.length} exercício{exercises.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Data e Hora */}
        <View style={styles.row}>
          <View style={styles.halfSection}>
            <Text style={styles.label}>Data</Text>
            <DatePicker
              value={activityDate}
              onChange={setActivityDate}
              disabled={isSaving}
            />
          </View>
          <View style={styles.halfSection}>
            <Text style={styles.label}>Hora</Text>
            <TimePicker
              value={activityTime}
              onChange={setActivityTime}
              disabled={isSaving}
            />
          </View>
        </View>

        {/* Exercícios */}
        <Text style={styles.sectionTitle}>Exercícios</Text>
        {exercises.map((exercise, index) => (
          <View key={index} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
              <Text style={styles.exerciseMuscle}>{exercise.muscle_group}</Text>
            </View>

            {/* Planejado */}
            <Text style={styles.plannedText}>
              Planejado: {exercise.planned_sets}x{exercise.planned_reps}
              {exercise.previous_weight && ` • Última vez: ${exercise.previous_weight}kg`}
            </Text>

            {/* Inputs */}
            <View style={styles.exerciseInputs}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Séries</Text>
                <TextInput
                  style={styles.smallInput}
                  value={String(exercise.sets_completed)}
                  onChangeText={(v) => handleUpdateExercise(index, 'sets_completed', parseInt(v) || 0)}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reps</Text>
                <TextInput
                  style={styles.smallInput}
                  value={exercise.reps_completed}
                  onChangeText={(v) => handleUpdateExercise(index, 'reps_completed', v)}
                  placeholder="10"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Carga (kg)</Text>
                <TextInput
                  style={styles.smallInput}
                  value={exercise.weight ? String(exercise.weight) : ''}
                  onChangeText={(v) => handleUpdateExercise(index, 'weight', parseFloat(v.replace(',', '.')) || undefined)}
                  keyboardType="decimal-pad"
                  placeholder="-"
                />
              </View>
            </View>

            {/* RPE do exercício */}
            <View style={styles.exerciseRpeContainer}>
              <Text style={styles.inputLabel}>RPE</Text>
              <View style={styles.exerciseRpeButtons}>
                {[6, 7, 8, 9, 10].map((rpe) => (
                  <TouchableOpacity
                    key={rpe}
                    style={[
                      styles.exerciseRpeButton,
                      exercise.rpe === rpe && styles.exerciseRpeButtonSelected,
                    ]}
                    onPress={() => handleUpdateExercise(index, 'rpe', exercise.rpe === rpe ? undefined : rpe)}
                  >
                    <Text
                      style={[
                        styles.exerciseRpeButtonText,
                        exercise.rpe === rpe && styles.exerciseRpeButtonTextSelected,
                      ]}
                    >
                      {rpe}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notas do exercício */}
            <TextInput
              style={styles.exerciseNotes}
              placeholder="Notas do exercício..."
              placeholderTextColor="#8E8E93"
              value={exercise.notes || ''}
              onChangeText={(v) => handleUpdateExercise(index, 'notes', v || undefined)}
            />
          </View>
        ))}

        {/* Duração */}
        <View style={styles.section}>
          <Text style={styles.label}>Duração do Treino</Text>
          <View style={styles.durationInputs}>
            <View style={styles.durationGroup}>
              <TextInput
                style={styles.durationInput}
                value={durationHours}
                onChangeText={setDurationHours}
                keyboardType="number-pad"
                placeholder="0"
                maxLength={2}
              />
              <Text style={styles.durationLabel}>h</Text>
            </View>
            <View style={styles.durationGroup}>
              <TextInput
                style={styles.durationInput}
                value={durationMinutes}
                onChangeText={setDurationMinutes}
                keyboardType="number-pad"
                placeholder="00"
                maxLength={2}
              />
              <Text style={styles.durationLabel}>min</Text>
            </View>
          </View>
        </View>

        {/* Esforço geral */}
        <View style={styles.section}>
          <Text style={styles.label}>Esforço Geral (RPE)</Text>
          <View style={styles.effortContainer}>
            {effortLevels.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.effortButton,
                  effort === level.value && styles.effortButtonSelected,
                ]}
                onPress={() => setEffort(effort === level.value ? null : level.value)}
              >
                <Text
                  style={[
                    styles.effortButtonText,
                    effort === level.value && styles.effortButtonTextSelected,
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notas gerais */}
        <View style={styles.section}>
          <Text style={styles.label}>Notas do Treino</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Como foi o treino?"
            placeholderTextColor="#8E8E93"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Finalizar Treino</Text>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  halfSection: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  exerciseHeader: {
    marginBottom: 8,
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
  plannedText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 12,
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
    paddingVertical: 10,
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
  },
  exerciseNotes: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#000000',
  },
  durationInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  durationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  durationInput: {
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    width: 40,
    textAlign: 'center',
  },
  durationLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  effortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  effortButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  effortButtonSelected: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  effortButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  effortButtonTextSelected: {
    color: '#FFFFFF',
  },
  exerciseRpeContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  exerciseRpeButtons: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  exerciseRpeButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  exerciseRpeButtonSelected: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  exerciseRpeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  exerciseRpeButtonTextSelected: {
    color: '#FFFFFF',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
