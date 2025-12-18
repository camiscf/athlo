import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { RunningActivityCreate } from '../../types';
import DatePicker from '../../components/DatePicker';
import TimePicker from '../../components/TimePicker';

type ActivityType = 'running' | 'cycling' | 'swimming' | 'gym';
type GoalType = 'free' | 'distance' | 'time';

interface ActivityTypeOption {
  type: ActivityType;
  label: string;
  icon: string;
  color: string;
}

const activityTypes: ActivityTypeOption[] = [
  { type: 'running', label: 'Corrida', icon: 'activity', color: '#22C55E' },
  { type: 'cycling', label: 'Ciclismo', icon: 'disc', color: '#EC4899' },
  { type: 'swimming', label: 'Natacao', icon: 'droplet', color: '#06B6D4' },
  { type: 'gym', label: 'Academia', icon: 'target', color: '#3B82F6' },
];

interface AddActivityScreenProps {
  route?: {
    params?: {
      activityId?: string;
      activityType?: ActivityType;
    };
  };
  navigation?: any;
}

export default function AddActivityScreen({ route, navigation: navProp }: AddActivityScreenProps) {
  const theme = useColors();
  const navigation = navProp || useNavigation();
  const activityId = route?.params?.activityId;
  const initialType = route?.params?.activityType || 'running';
  const isEditMode = !!activityId;

  const [selectedType, setSelectedType] = useState<ActivityType>(initialType);
  const [goalType, setGoalType] = useState<GoalType>('free');
  const [goalValue, setGoalValue] = useState(5);
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Manual entry states
  const [title, setTitle] = useState('');
  const [activityDate, setActivityDate] = useState('');
  const [activityTime, setActivityTime] = useState('');
  const [distance, setDistance] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [effort, setEffort] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode && activityId) {
      setShowManualEntry(true);
      loadActivity();
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setActivityDate(`${year}-${month}-${day}`);
      setActivityTime(`${hrs}:${mins}`);
    }
  }, [activityId]);

  async function loadActivity() {
    try {
      const activity = await api.getRunningActivity(activityId!);
      setTitle(activity.title || '');

      if (activity.start_time) {
        const date = new Date(activity.start_time);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        setActivityDate(`${year}-${month}-${day}`);

        const hours = String(date.getHours()).padStart(2, '0');
        const mins = String(date.getMinutes()).padStart(2, '0');
        setActivityTime(`${hours}:${mins}`);
      }

      setDistance(activity.distance?.toString() || '');
      if (activity.duration) {
        const h = Math.floor(activity.duration / 3600);
        const m = Math.floor((activity.duration % 3600) / 60);
        const s = activity.duration % 60;
        setHours(h > 0 ? h.toString() : '');
        setMinutes(m > 0 ? m.toString() : '');
        setSeconds(s > 0 ? s.toString() : '');
      }
      setEffort(activity.effort || null);
      setNotes(activity.notes || '');
    } catch (error) {
      showAlert('Erro', 'Nao foi possivel carregar a atividade.');
      navigation?.goBack();
    } finally {
      setIsLoadingData(false);
    }
  }

  const effortLevels = [
    { value: 1, label: '1' },
    { value: 3, label: '3' },
    { value: 5, label: '5' },
    { value: 7, label: '7' },
    { value: 9, label: '9' },
  ];

  function getActivityPeriod(hour: number): string {
    if (hour >= 5 && hour < 12) return 'da manha';
    if (hour >= 12 && hour < 14) return 'na hora do almoco';
    if (hour >= 14 && hour < 18) return 'de tarde';
    return 'de noite';
  }

  function generateAutoTitle(): string {
    const hour = activityTime ? parseInt(activityTime.split(':')[0]) : new Date().getHours();
    const typeLabels: Record<ActivityType, string> = {
      running: 'Corrida',
      cycling: 'Pedalada',
      swimming: 'Natacao',
      gym: 'Treino',
    };
    return `${typeLabels[selectedType]} ${getActivityPeriod(hour)}`;
  }

  function showAlert(title: string, message: string) {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    }
  }

  function handleStartWorkout() {
    if (selectedType === 'gym') {
      (navigation as any).navigate('Divisions');
    } else {
      // For now, show manual entry for other types
      setShowManualEntry(true);
    }
  }

  async function handleSubmit() {
    const distanceNum = parseFloat(distance.replace(',', '.'));
    const hoursNum = parseInt(hours) || 0;
    const minutesNum = parseInt(minutes) || 0;
    const secondsNum = parseInt(seconds) || 0;
    const totalSeconds = hoursNum * 3600 + minutesNum * 60 + secondsNum;

    if (!distanceNum && !totalSeconds) {
      showAlert('Erro', 'Informe pelo menos a distancia ou o tempo.');
      return;
    }

    setIsLoading(true);

    try {
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

      const activityData: RunningActivityCreate = {
        start_time: startTime.toISOString(),
      };

      activityData.title = title.trim() || generateAutoTitle();

      if (distanceNum > 0) {
        activityData.distance = distanceNum;
      }

      if (totalSeconds > 0) {
        activityData.duration = totalSeconds;
      }

      if (effort) {
        activityData.effort = effort;
      }

      if (notes.trim()) {
        activityData.notes = notes.trim();
      }

      if (isEditMode && activityId) {
        await api.updateRunningActivity(activityId, activityData);
        showAlert('Sucesso', 'Atividade atualizada com sucesso!');
        navigation?.goBack();
      } else {
        await api.createRunningActivity(activityData);
        showAlert('Sucesso', 'Atividade registrada com sucesso!');
        setShowManualEntry(false);
        resetForm();
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erro ao salvar atividade.';
      showAlert('Erro', message);
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setTitle('');
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    setActivityDate(`${year}-${month}-${day}`);
    setActivityTime(`${hrs}:${mins}`);
    setDistance('');
    setHours('');
    setMinutes('');
    setSeconds('');
    setEffort(null);
    setNotes('');
  }

  if (isLoadingData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background.primary }]}>
        <ActivityIndicator size="large" color={theme.accent.primary} />
      </View>
    );
  }

  // Manual Entry Modal/View
  if (showManualEntry) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background.primary }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.manualContent}>
          {/* Header */}
          <View style={styles.manualHeader}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.background.secondary }]}
              onPress={() => isEditMode ? navigation?.goBack() : setShowManualEntry(false)}
            >
              <Feather name="arrow-left" size={20} color={theme.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.manualTitle, { color: theme.text.primary }]}>
              {isEditMode ? 'Editar Atividade' : 'Adicionar Manualmente'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text.secondary }]}>TITULO</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
              placeholder={generateAutoTitle()}
              placeholderTextColor={theme.text.tertiary}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Date and Time */}
          <View style={styles.row}>
            <View style={styles.halfSection}>
              <Text style={[styles.label, { color: theme.text.secondary }]}>DATA</Text>
              <DatePicker value={activityDate} onChange={setActivityDate} />
            </View>
            <View style={styles.halfSection}>
              <Text style={[styles.label, { color: theme.text.secondary }]}>HORA</Text>
              <TimePicker value={activityTime} onChange={setActivityTime} />
            </View>
          </View>

          {/* Distance and Duration */}
          <View style={styles.row}>
            <View style={styles.halfSection}>
              <Text style={[styles.label, { color: theme.text.secondary }]}>DISTANCIA (KM)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
                placeholder="0.00"
                placeholderTextColor={theme.text.tertiary}
                value={distance}
                onChangeText={setDistance}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.halfSection}>
              <Text style={[styles.label, { color: theme.text.secondary }]}>DURACAO</Text>
              <View style={styles.timeInputs}>
                <View style={[styles.timeInputWrapper, { backgroundColor: theme.background.secondary }]}>
                  <TextInput
                    style={[styles.timeInput, { color: theme.text.primary }]}
                    placeholder="0"
                    placeholderTextColor={theme.text.tertiary}
                    value={hours}
                    onChangeText={setHours}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={[styles.timeLabel, { color: theme.text.tertiary }]}>h</Text>
                </View>
                <View style={[styles.timeInputWrapper, { backgroundColor: theme.background.secondary }]}>
                  <TextInput
                    style={[styles.timeInput, { color: theme.text.primary }]}
                    placeholder="00"
                    placeholderTextColor={theme.text.tertiary}
                    value={minutes}
                    onChangeText={setMinutes}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={[styles.timeLabel, { color: theme.text.tertiary }]}>m</Text>
                </View>
                <View style={[styles.timeInputWrapper, { backgroundColor: theme.background.secondary }]}>
                  <TextInput
                    style={[styles.timeInput, { color: theme.text.primary }]}
                    placeholder="00"
                    placeholderTextColor={theme.text.tertiary}
                    value={seconds}
                    onChangeText={setSeconds}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={[styles.timeLabel, { color: theme.text.tertiary }]}>s</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Effort */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text.secondary }]}>ESFORCO PERCEBIDO</Text>
            <View style={styles.effortContainer}>
              {effortLevels.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.effortButton,
                    { backgroundColor: theme.background.secondary },
                    effort === level.value && { backgroundColor: theme.accent.primary },
                  ]}
                  onPress={() => setEffort(effort === level.value ? null : level.value)}
                >
                  <Text
                    style={[
                      styles.effortText,
                      { color: theme.text.primary },
                      effort === level.value && { color: '#000000' },
                    ]}
                  >
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.effortLabels}>
              <Text style={[styles.effortLabelText, { color: theme.text.tertiary }]}>Facil</Text>
              <Text style={[styles.effortLabelText, { color: theme.text.tertiary }]}>Maximo</Text>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text.secondary }]}>NOTAS</Text>
            <TextInput
              style={[styles.input, styles.notesInput, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
              placeholder="Como foi o treino?"
              placeholderTextColor={theme.text.tertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.accent.primary }, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>
                  {isEditMode ? 'Atualizar' : 'Salvar Atividade'}
                </Text>
                <Feather name="check" size={20} color="#000000" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Main Activity Selection Screen
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Novo Treino</Text>
          <TouchableOpacity style={[styles.settingsButton, { backgroundColor: theme.background.secondary }]}>
            <Feather name="settings" size={20} color={theme.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.mainTitle, { color: theme.text.primary }]}>
            O que vamos{'\n'}
            <Text style={{ color: theme.accent.primary }}>treinar hoje?</Text>
          </Text>
        </View>

        {/* Activity Type Grid */}
        <View style={styles.activityGrid}>
          {activityTypes.map((activity) => (
            <TouchableOpacity
              key={activity.type}
              style={[
                styles.activityCard,
                { backgroundColor: theme.background.secondary },
                selectedType === activity.type && {
                  borderWidth: 2,
                  borderColor: theme.accent.primary,
                },
              ]}
              onPress={() => setSelectedType(activity.type)}
            >
              <View style={[styles.activityIconContainer, { backgroundColor: activity.color + '20' }]}>
                <Feather name={activity.icon as any} size={28} color={activity.color} />
              </View>
              <Text style={[styles.activityLabel, { color: theme.text.primary }]}>{activity.label}</Text>
              {selectedType === activity.type && (
                <View style={[styles.selectedIndicator, { backgroundColor: theme.accent.primary }]}>
                  <Feather name="check" size={14} color="#000000" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Goal Section */}
        <View style={styles.goalSection}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Definir Meta</Text>

          {/* Goal Type Toggle */}
          <View style={[styles.goalToggle, { backgroundColor: theme.background.secondary }]}>
            {(['free', 'distance', 'time'] as GoalType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.goalToggleItem,
                  goalType === type && { backgroundColor: theme.accent.primary },
                ]}
                onPress={() => setGoalType(type)}
              >
                <Text
                  style={[
                    styles.goalToggleText,
                    { color: theme.text.secondary },
                    goalType === type && { color: '#000000', fontWeight: '600' },
                  ]}
                >
                  {type === 'free' ? 'Livre' : type === 'distance' ? 'Distancia' : 'Tempo'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Goal Value */}
          {goalType !== 'free' && (
            <View style={[styles.goalValueContainer, { backgroundColor: theme.background.secondary }]}>
              <TouchableOpacity
                style={[styles.goalAdjustButton, { backgroundColor: theme.background.tertiary }]}
                onPress={() => setGoalValue(Math.max(1, goalValue - 1))}
              >
                <Feather name="minus" size={20} color={theme.text.primary} />
              </TouchableOpacity>
              <View style={styles.goalValueDisplay}>
                <Text style={[styles.goalValueText, { color: theme.accent.primary }]}>{goalValue}</Text>
                <Text style={[styles.goalValueUnit, { color: theme.text.secondary }]}>
                  {goalType === 'distance' ? 'km' : 'min'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.goalAdjustButton, { backgroundColor: theme.background.tertiary }]}
                onPress={() => setGoalValue(goalValue + 1)}
              >
                <Feather name="plus" size={20} color={theme.text.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Manual Entry Link */}
        <TouchableOpacity
          style={styles.manualEntryLink}
          onPress={() => setShowManualEntry(true)}
        >
          <Feather name="edit-3" size={18} color={theme.accent.primary} />
          <Text style={[styles.manualEntryText, { color: theme.accent.primary }]}>
            Adicionar Treino Manualmente
          </Text>
        </TouchableOpacity>

        {/* Start Button */}
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: theme.accent.primary }]}
          onPress={handleStartWorkout}
        >
          <Text style={styles.startButtonText}>INICIAR TREINO</Text>
          <Feather name="arrow-right" size={22} color="#000000" />
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    marginBottom: 28,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 42,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  activityCard: {
    width: '47%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  activityIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  goalToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  goalToggleItem: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  goalToggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  goalValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
  },
  goalAdjustButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalValueDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  goalValueText: {
    fontSize: 48,
    fontWeight: '700',
  },
  goalValueUnit: {
    fontSize: 14,
    marginTop: -4,
  },
  manualEntryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    marginBottom: 16,
  },
  manualEntryText: {
    fontSize: 15,
    fontWeight: '500',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 18,
    gap: 10,
    marginBottom: 32,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },
  // Manual Entry Styles
  manualContent: {
    padding: 20,
  },
  manualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  halfSection: {
    flex: 1,
  },
  timeInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  timeInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  timeInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    textAlign: 'center',
  },
  timeLabel: {
    fontSize: 14,
    marginLeft: 2,
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
  effortText: {
    fontSize: 16,
    fontWeight: '600',
  },
  effortLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  effortLabelText: {
    fontSize: 12,
  },
  notesInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
