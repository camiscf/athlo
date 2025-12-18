import React, { useState, useEffect, useRef } from 'react';
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
import { Feather } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { WorkoutDivision, ExerciseLogCreate, ExerciseHistory } from '../../types';

interface RecordStrengthWorkoutScreenProps {
  route: {
    params: {
      divisionId: string;
    };
  };
  navigation: any;
}

interface SetData {
  weight: string;
  reps: string;
  completed: boolean;
  previousWeight?: string;
  previousReps?: string;
}

interface ExerciseWithSets {
  exercise_name: string;
  muscle_group: string;
  planned_sets: number;
  planned_reps: string;
  sets: SetData[];
  rpe?: number;
  notes?: string;
}

export default function RecordStrengthWorkoutScreen({ route, navigation }: RecordStrengthWorkoutScreenProps) {
  const theme = useColors();
  const { divisionId } = route.params;

  const [division, setDivision] = useState<WorkoutDivision | null>(null);
  const [exercises, setExercises] = useState<ExerciseWithSets[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Timer
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date>(new Date());

  // General fields
  const [effort, setEffort] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
    startTimer();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  function startTimer() {
    startTimeRef.current = new Date();
    timerRef.current = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTimeRef.current.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
  }

  function formatTimer(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  async function loadData() {
    try {
      const divisionData = await api.getWorkoutDivision(divisionId);
      setDivision(divisionData);

      const exercisesWithSets: ExerciseWithSets[] = await Promise.all(
        divisionData.exercises.map(async (ex) => {
          let history: ExerciseHistory | null = null;
          try {
            history = await api.getExerciseHistory(ex.exercise_name, 1);
          } catch (e) {
            // No history
          }

          const lastRecord = history?.records?.[0];
          const plannedSets = ex.sets || 3;

          // Create sets based on planned number
          const sets: SetData[] = Array.from({ length: plannedSets }, (_, i) => ({
            weight: ex.suggested_weight?.toString() || lastRecord?.weight?.toString() || '',
            reps: ex.reps || '10',
            completed: false,
            previousWeight: lastRecord?.weight?.toString() || '',
            previousReps: lastRecord?.reps || '',
          }));

          return {
            exercise_name: ex.exercise_name,
            muscle_group: ex.muscle_group,
            planned_sets: plannedSets,
            planned_reps: ex.reps || '10',
            sets,
            rpe: undefined,
            notes: undefined,
          };
        })
      );

      setExercises(exercisesWithSets);
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

  function handleUpdateSet(exerciseIndex: number, setIndex: number, field: keyof SetData, value: any) {
    const updated = [...exercises];
    (updated[exerciseIndex].sets[setIndex] as any)[field] = value;
    setExercises(updated);
  }

  function handleToggleSetComplete(exerciseIndex: number, setIndex: number) {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex].completed = !updated[exerciseIndex].sets[setIndex].completed;
    setExercises(updated);
  }

  function handleAddSet(exerciseIndex: number) {
    const updated = [...exercises];
    const exercise = updated[exerciseIndex];
    const lastSet = exercise.sets[exercise.sets.length - 1];
    exercise.sets.push({
      weight: lastSet?.weight || '',
      reps: lastSet?.reps || exercise.planned_reps,
      completed: false,
      previousWeight: lastSet?.previousWeight,
      previousReps: lastSet?.previousReps,
    });
    setExercises(updated);
  }

  function handleRemoveSet(exerciseIndex: number, setIndex: number) {
    const updated = [...exercises];
    if (updated[exerciseIndex].sets.length > 1) {
      updated[exerciseIndex].sets.splice(setIndex, 1);
      setExercises(updated);
    }
  }

  function handleNextExercise() {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  }

  function handlePrevExercise() {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  }

  async function handleFinishWorkout() {
    if (exercises.length === 0) {
      showAlert('Erro', 'Nenhum exercício para registrar.');
      return;
    }

    const confirmFinish = Platform.OS === 'web'
      ? window.confirm('Deseja finalizar o treino?')
      : true;

    if (!confirmFinish) return;

    setIsSaving(true);
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      const data = {
        title: division?.name,
        division_id: divisionId,
        division_name: division?.name,
        start_time: startTimeRef.current.toISOString(),
        exercises: exercises.map(ex => {
          const completedSets = ex.sets.filter(s => s.completed);
          const totalReps = completedSets.reduce((sum, s) => sum + (parseInt(s.reps) || 0), 0);
          const avgWeight = completedSets.length > 0
            ? completedSets.reduce((sum, s) => sum + (parseFloat(s.weight) || 0), 0) / completedSets.length
            : undefined;

          return {
            exercise_name: ex.exercise_name,
            muscle_group: ex.muscle_group,
            planned_sets: ex.planned_sets,
            planned_reps: ex.planned_reps,
            sets_completed: completedSets.length,
            reps_completed: totalReps.toString(),
            weight: avgWeight,
            rpe: ex.rpe,
            notes: ex.notes,
          };
        }),
        duration: elapsedTime,
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
      <View style={[styles.loadingContainer, { backgroundColor: theme.background.primary }]}>
        <ActivityIndicator size="large" color={theme.accent.primary} />
      </View>
    );
  }

  const currentExercise = exercises[currentExerciseIndex];
  const completedExercises = exercises.filter(ex => ex.sets.every(s => s.completed)).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border.primary }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.background.secondary }]}
            onPress={() => navigation.goBack()}
          >
            <Feather name="x" size={20} color={theme.text.primary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
              {division?.name}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.text.secondary }]}>
              {completedExercises}/{exercises.length} exercícios
            </Text>
          </View>
        </View>
        <View style={[styles.timerContainer, { backgroundColor: theme.accent.muted }]}>
          <Feather name="clock" size={16} color={theme.accent.primary} />
          <Text style={[styles.timerText, { color: theme.accent.primary }]}>
            {formatTimer(elapsedTime)}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Exercise */}
        {currentExercise && (
          <View style={[styles.currentExerciseCard, { backgroundColor: theme.background.secondary }]}>
            <View style={styles.exerciseHeader}>
              <View>
                <Text style={[styles.exerciseName, { color: theme.text.primary }]}>
                  {currentExercise.exercise_name}
                </Text>
                <View style={[styles.muscleBadge, { backgroundColor: theme.accent.muted }]}>
                  <Text style={[styles.muscleBadgeText, { color: theme.accent.primary }]}>
                    {currentExercise.muscle_group}
                  </Text>
                </View>
              </View>
              <TouchableOpacity>
                <Text style={[styles.historyLink, { color: theme.accent.primary }]}>Histórico</Text>
              </TouchableOpacity>
            </View>

            {/* Sets Table Header */}
            <View style={[styles.setsTableHeader, { backgroundColor: theme.background.tertiary }]}>
              <Text style={[styles.tableHeaderText, styles.setColumn, { color: theme.text.tertiary }]}>SET</Text>
              <Text style={[styles.tableHeaderText, styles.previousColumn, { color: theme.text.tertiary }]}>ANTERIOR</Text>
              <Text style={[styles.tableHeaderText, styles.weightColumn, { color: theme.text.tertiary }]}>KG</Text>
              <Text style={[styles.tableHeaderText, styles.repsColumn, { color: theme.text.tertiary }]}>REPS</Text>
              <Text style={[styles.tableHeaderText, styles.checkColumn, { color: theme.text.tertiary }]}></Text>
            </View>

            {/* Sets Rows */}
            {currentExercise.sets.map((set, setIndex) => (
              <View
                key={setIndex}
                style={[
                  styles.setRow,
                  { borderBottomColor: theme.border.primary },
                  set.completed && { backgroundColor: theme.accent.muted },
                ]}
              >
                <Text style={[styles.setNumber, styles.setColumn, { color: theme.text.primary }]}>
                  {setIndex + 1}
                </Text>
                <Text style={[styles.previousValue, styles.previousColumn, { color: theme.text.tertiary }]}>
                  {set.previousWeight && set.previousReps
                    ? `${set.previousWeight}kg x ${set.previousReps}`
                    : '-'}
                </Text>
                <TextInput
                  style={[
                    styles.setInput,
                    styles.weightColumn,
                    { backgroundColor: theme.background.tertiary, color: theme.text.primary },
                  ]}
                  value={set.weight}
                  onChangeText={(v) => handleUpdateSet(currentExerciseIndex, setIndex, 'weight', v)}
                  keyboardType="decimal-pad"
                  placeholder="-"
                  placeholderTextColor={theme.text.tertiary}
                />
                <TextInput
                  style={[
                    styles.setInput,
                    styles.repsColumn,
                    { backgroundColor: theme.background.tertiary, color: theme.text.primary },
                  ]}
                  value={set.reps}
                  onChangeText={(v) => handleUpdateSet(currentExerciseIndex, setIndex, 'reps', v)}
                  keyboardType="number-pad"
                  placeholder="-"
                  placeholderTextColor={theme.text.tertiary}
                />
                <TouchableOpacity
                  style={[
                    styles.checkButton,
                    styles.checkColumn,
                    { backgroundColor: set.completed ? theme.accent.primary : theme.background.tertiary },
                  ]}
                  onPress={() => handleToggleSetComplete(currentExerciseIndex, setIndex)}
                >
                  <Feather
                    name="check"
                    size={16}
                    color={set.completed ? '#000000' : theme.text.tertiary}
                  />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add Set Button */}
            <TouchableOpacity
              style={[styles.addSetButton, { borderColor: theme.border.secondary }]}
              onPress={() => handleAddSet(currentExerciseIndex)}
            >
              <Feather name="plus" size={18} color={theme.accent.primary} />
              <Text style={[styles.addSetText, { color: theme.accent.primary }]}>Adicionar Série</Text>
            </TouchableOpacity>

            {/* Rest Suggestion */}
            <View style={[styles.restBadge, { backgroundColor: theme.background.tertiary }]}>
              <Feather name="clock" size={14} color={theme.text.secondary} />
              <Text style={[styles.restText, { color: theme.text.secondary }]}>
                Descanso sugerido: 90s
              </Text>
            </View>
          </View>
        )}

        {/* Exercise Navigation */}
        <View style={styles.exerciseNavigation}>
          <TouchableOpacity
            style={[
              styles.navButton,
              { backgroundColor: theme.background.secondary },
              currentExerciseIndex === 0 && styles.navButtonDisabled,
            ]}
            onPress={handlePrevExercise}
            disabled={currentExerciseIndex === 0}
          >
            <Feather name="chevron-left" size={20} color={currentExerciseIndex === 0 ? theme.text.tertiary : theme.text.primary} />
            <Text style={[styles.navButtonText, { color: currentExerciseIndex === 0 ? theme.text.tertiary : theme.text.primary }]}>
              Anterior
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navButton,
              { backgroundColor: theme.background.secondary },
              currentExerciseIndex === exercises.length - 1 && styles.navButtonDisabled,
            ]}
            onPress={handleNextExercise}
            disabled={currentExerciseIndex === exercises.length - 1}
          >
            <Text style={[styles.navButtonText, { color: currentExerciseIndex === exercises.length - 1 ? theme.text.tertiary : theme.text.primary }]}>
              Próximo
            </Text>
            <Feather name="chevron-right" size={20} color={currentExerciseIndex === exercises.length - 1 ? theme.text.tertiary : theme.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Next Exercises */}
        {currentExerciseIndex < exercises.length - 1 && (
          <View style={styles.nextExercisesSection}>
            <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>PROXIMOS</Text>
            {exercises.slice(currentExerciseIndex + 1, currentExerciseIndex + 4).map((ex, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.nextExerciseItem, { backgroundColor: theme.background.secondary }]}
                onPress={() => setCurrentExerciseIndex(currentExerciseIndex + index + 1)}
              >
                <View style={[styles.nextExerciseIcon, { backgroundColor: theme.accent.muted }]}>
                  <Feather name="target" size={16} color={theme.accent.primary} />
                </View>
                <View style={styles.nextExerciseInfo}>
                  <Text style={[styles.nextExerciseName, { color: theme.text.primary }]}>
                    {ex.exercise_name}
                  </Text>
                  <Text style={[styles.nextExerciseSets, { color: theme.text.tertiary }]}>
                    {ex.planned_sets} series x {ex.planned_reps} reps
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={theme.text.tertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Notes */}
        <View style={styles.notesSection}>
          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>NOTAS DO TREINO</Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
            placeholder="Como foi o treino?"
            placeholderTextColor={theme.text.tertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Effort */}
        <View style={styles.effortSection}>
          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>ESFORCO PERCEBIDO</Text>
          <View style={styles.effortContainer}>
            {[1, 3, 5, 7, 9, 10].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.effortButton,
                  { backgroundColor: theme.background.secondary },
                  effort === level && { backgroundColor: theme.accent.primary },
                ]}
                onPress={() => setEffort(effort === level ? null : level)}
              >
                <Text
                  style={[
                    styles.effortButtonText,
                    { color: theme.text.primary },
                    effort === level && { color: '#000000' },
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: theme.background.primary, borderTopColor: theme.border.primary }]}>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: theme.background.secondary }]}
        >
          <Feather name="settings" size={20} color={theme.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.finishButton, { backgroundColor: theme.accent.primary }, isSaving && styles.buttonDisabled]}
          onPress={handleFinishWorkout}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <>
              <Text style={styles.finishButtonText}>Finalizar Treino</Text>
              <Feather name="check" size={20} color="#000000" />
            </>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  content: {
    flex: 1,
    padding: 16,
  },
  currentExerciseCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
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
  historyLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  setsTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  setColumn: {
    width: 36,
    textAlign: 'center',
  },
  previousColumn: {
    flex: 1,
    textAlign: 'center',
  },
  weightColumn: {
    width: 60,
    textAlign: 'center',
  },
  repsColumn: {
    width: 50,
    textAlign: 'center',
  },
  checkColumn: {
    width: 40,
    alignItems: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 4,
  },
  setNumber: {
    fontSize: 15,
    fontWeight: '600',
  },
  previousValue: {
    fontSize: 12,
  },
  setInput: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    marginTop: 12,
    gap: 6,
  },
  addSetText: {
    fontSize: 14,
    fontWeight: '500',
  },
  restBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
    gap: 6,
  },
  restText: {
    fontSize: 13,
  },
  exerciseNavigation: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  nextExercisesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  nextExerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  nextExerciseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nextExerciseInfo: {
    flex: 1,
  },
  nextExerciseName: {
    fontSize: 15,
    fontWeight: '500',
  },
  nextExerciseSets: {
    fontSize: 13,
    marginTop: 2,
  },
  notesSection: {
    marginBottom: 20,
  },
  notesInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  effortSection: {
    marginBottom: 20,
  },
  effortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  effortButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  effortButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  settingsButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  finishButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
