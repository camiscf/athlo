import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { RunningActivityCreate, LapCreate } from '../../types';
import DatePicker from '../../components/DatePicker';
import TimePicker from '../../components/TimePicker';

type ScreenMode = 'selection' | 'stopwatch' | 'manual';
type StopwatchState = 'idle' | 'running' | 'paused';
type LapInputMode = 'time' | 'pace';

interface LiveLap {
  number: number;
  distance: number; // km
  durationSeconds: number;
  splitSeconds: number; // time since last lap
  paceSeconds: number;
}

interface ManualLapEntry {
  distance: string;
  time: string;
  pace: string;
  inputMode: LapInputMode;
}

interface AddActivityScreenProps {
  route?: {
    params?: {
      activityId?: string;
    };
  };
  navigation?: any;
}

export default function AddActivityScreen({ route, navigation: navProp }: AddActivityScreenProps) {
  const theme = useColors();
  const navigation = navProp || useNavigation();
  const activityId = route?.params?.activityId;
  const isEditMode = !!activityId;

  // Screen mode
  const [screenMode, setScreenMode] = useState<ScreenMode>(isEditMode ? 'manual' : 'selection');

  // Stopwatch states
  const [stopwatchState, setStopwatchState] = useState<StopwatchState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [liveLaps, setLiveLaps] = useState<LiveLap[]>([]);
  const [lapDistance, setLapDistance] = useState('1'); // default 1km per lap
  const [startTime, setStartTime] = useState<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastLapTimeRef = useRef(0);

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

  // Manual laps state
  const [manualLaps, setManualLaps] = useState<ManualLapEntry[]>([]);
  const [showAddLap, setShowAddLap] = useState(false);
  const [newLap, setNewLap] = useState<ManualLapEntry>({
    distance: '1',
    time: '',
    pace: '',
    inputMode: 'time',
  });

  // Initialize date/time for manual mode
  useEffect(() => {
    if (isEditMode && activityId) {
      loadActivity();
    } else {
      setCurrentDateTime();
    }
  }, [activityId]);

  // Stopwatch timer
  useEffect(() => {
    if (stopwatchState === 'running') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stopwatchState]);

  function setCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    setActivityDate(`${year}-${month}-${day}`);
    setActivityTime(`${hrs}:${mins}`);
  }

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

      // Load laps if available
      if (activity.laps && activity.laps.length > 0) {
        const loadedLaps: ManualLapEntry[] = activity.laps.map(lap => ({
          distance: lap.distance.toString(),
          time: lap.time,
          pace: lap.pace,
          inputMode: 'time' as LapInputMode,
        }));
        setManualLaps(loadedLaps);
      }
    } catch (error) {
      showAlert('Erro', 'Não foi possível carregar a atividade.');
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
    if (hour >= 5 && hour < 12) return 'da manhã';
    if (hour >= 12 && hour < 14) return 'na hora do almoço';
    if (hour >= 14 && hour < 18) return 'de tarde';
    return 'de noite';
  }

  function generateAutoTitle(): string {
    const hour = activityTime ? parseInt(activityTime.split(':')[0]) : new Date().getHours();
    return `Corrida ${getActivityPeriod(hour)}`;
  }

  function showAlert(title: string, message: string) {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    }
  }

  // Time formatting helpers
  function formatSecondsToTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function formatSecondsToFullTime(totalSeconds: number): string {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  function calculatePaceFromTime(distanceKm: number, timeSeconds: number): string {
    if (distanceKm <= 0 || timeSeconds <= 0) return '--:--';
    const paceSeconds = timeSeconds / distanceKm;
    return formatSecondsToTime(paceSeconds);
  }

  function calculateTimeFromPace(distanceKm: number, paceSeconds: number): string {
    if (distanceKm <= 0 || paceSeconds <= 0) return '--:--';
    const totalSeconds = paceSeconds * distanceKm;
    return formatSecondsToTime(totalSeconds);
  }

  // ==================== STOPWATCH FUNCTIONS ====================

  function startStopwatch() {
    setStartTime(new Date());
    setStopwatchState('running');
    lastLapTimeRef.current = 0;
  }

  function pauseStopwatch() {
    setStopwatchState('paused');
  }

  function resumeStopwatch() {
    setStopwatchState('running');
  }

  function markLap() {
    const dist = parseFloat(lapDistance.replace(',', '.')) || 1;
    const splitSeconds = elapsedSeconds - lastLapTimeRef.current;
    const paceSeconds = splitSeconds / dist;

    const newLiveLap: LiveLap = {
      number: liveLaps.length + 1,
      distance: dist,
      durationSeconds: elapsedSeconds,
      splitSeconds,
      paceSeconds,
    };

    setLiveLaps([...liveLaps, newLiveLap]);
    lastLapTimeRef.current = elapsedSeconds;
  }

  function finishStopwatch() {
    setStopwatchState('idle');

    // Calculate total distance and prepare data
    const totalDistance = liveLaps.reduce((sum, lap) => sum + lap.distance, 0);

    // Convert live laps to API format
    const apiLaps: LapCreate[] = liveLaps.map(lap => ({
      number: lap.number,
      distance: lap.distance,
      duration_seconds: lap.splitSeconds,
      pace_seconds: lap.paceSeconds,
    }));

    saveStopwatchActivity(totalDistance, elapsedSeconds, apiLaps);
  }

  function discardStopwatch() {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Deseja descartar esta corrida?');
      if (!confirmed) return;
    }
    resetStopwatch();
    setScreenMode('selection');
  }

  function resetStopwatch() {
    setStopwatchState('idle');
    setElapsedSeconds(0);
    setLiveLaps([]);
    setStartTime(null);
    lastLapTimeRef.current = 0;
  }

  async function saveStopwatchActivity(totalDistance: number, totalSeconds: number, laps: LapCreate[]) {
    setIsLoading(true);

    try {
      const activityData: RunningActivityCreate = {
        title: generateAutoTitle(),
        start_time: startTime?.toISOString() || new Date().toISOString(),
        distance: totalDistance,
        duration: totalSeconds,
        laps: laps.length > 0 ? laps : undefined,
        effort,
        notes: notes.trim() || undefined,
      };

      await api.createRunningActivity(activityData);
      showAlert('Sucesso', 'Corrida salva com sucesso!');
      resetStopwatch();
      setScreenMode('selection');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erro ao salvar corrida.';
      showAlert('Erro', message);
    } finally {
      setIsLoading(false);
    }
  }

  // ==================== MANUAL ENTRY FUNCTIONS ====================

  function addManualLap() {
    const distanceNum = parseFloat(newLap.distance.replace(',', '.'));
    if (isNaN(distanceNum) || distanceNum <= 0) {
      showAlert('Erro', 'Informe uma distância válida.');
      return;
    }

    let time = newLap.time;
    let pace = newLap.pace;

    if (newLap.inputMode === 'time') {
      if (!newLap.time) {
        showAlert('Erro', 'Informe o tempo da volta.');
        return;
      }
      const timeSeconds = parseTimeToSeconds(newLap.time);
      pace = calculatePaceFromTime(distanceNum, timeSeconds);
    } else {
      if (!newLap.pace) {
        showAlert('Erro', 'Informe o pace da volta.');
        return;
      }
      const paceSeconds = parseTimeToSeconds(newLap.pace);
      time = calculateTimeFromPace(distanceNum, paceSeconds);
    }

    setManualLaps([...manualLaps, { ...newLap, time, pace }]);
    setNewLap({ distance: '1', time: '', pace: '', inputMode: 'time' });
    setShowAddLap(false);
  }

  function removeManualLap(index: number) {
    setManualLaps(manualLaps.filter((_, i) => i !== index));
  }

  function calculateTotalsFromManualLaps() {
    let totalDistance = 0;
    let totalSeconds = 0;

    manualLaps.forEach(lap => {
      totalDistance += parseFloat(lap.distance.replace(',', '.')) || 0;
      totalSeconds += parseTimeToSeconds(lap.time);
    });

    return { totalDistance, totalSeconds };
  }

  async function handleManualSubmit() {
    let distanceNum = parseFloat(distance.replace(',', '.'));
    let totalSeconds = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);

    // If laps exist and no manual distance/time, calculate from laps
    if (manualLaps.length > 0 && !distanceNum && !totalSeconds) {
      const totals = calculateTotalsFromManualLaps();
      distanceNum = totals.totalDistance;
      totalSeconds = totals.totalSeconds;
    }

    if (!distanceNum && !totalSeconds) {
      showAlert('Erro', 'Informe pelo menos a distância ou o tempo.');
      return;
    }

    setIsLoading(true);

    try {
      let activityStartTime: Date;
      if (activityDate) {
        const [year, month, day] = activityDate.split('-').map(Number);
        if (activityTime) {
          const [hour, minute] = activityTime.split(':').map(Number);
          activityStartTime = new Date(year, month - 1, day, hour, minute);
        } else {
          activityStartTime = new Date(year, month - 1, day, 12, 0);
        }
      } else {
        activityStartTime = new Date();
      }

      // Convert manual laps to API format
      const apiLaps: LapCreate[] = manualLaps.map((lap, index) => {
        const lapDistance = parseFloat(lap.distance.replace(',', '.')) || 0;
        const lapTimeSeconds = parseTimeToSeconds(lap.time);
        const lapPaceSeconds = parseTimeToSeconds(lap.pace);

        return {
          number: index + 1,
          distance: lapDistance,
          duration_seconds: lapTimeSeconds,
          pace_seconds: lapPaceSeconds,
        };
      });

      const activityData: RunningActivityCreate = {
        start_time: activityStartTime.toISOString(),
        title: title.trim() || generateAutoTitle(),
        distance: distanceNum > 0 ? distanceNum : undefined,
        duration: totalSeconds > 0 ? totalSeconds : undefined,
        laps: apiLaps.length > 0 ? apiLaps : undefined,
        effort: effort || undefined,
        notes: notes.trim() || undefined,
      };

      if (isEditMode && activityId) {
        await api.updateRunningActivity(activityId, activityData);
        showAlert('Sucesso', 'Atividade atualizada com sucesso!');
        navigation?.goBack();
      } else {
        await api.createRunningActivity(activityData);
        showAlert('Sucesso', 'Atividade registrada com sucesso!');
        resetManualForm();
        setScreenMode('selection');
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erro ao salvar atividade.';
      showAlert('Erro', message);
    } finally {
      setIsLoading(false);
    }
  }

  function resetManualForm() {
    setTitle('');
    setCurrentDateTime();
    setDistance('');
    setHours('');
    setMinutes('');
    setSeconds('');
    setEffort(null);
    setNotes('');
    setManualLaps([]);
  }

  // ==================== RENDER ====================

  if (isLoadingData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background.primary }]}>
        <ActivityIndicator size="large" color={theme.accent.primary} />
      </View>
    );
  }

  // Selection Screen
  if (screenMode === 'selection') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.runningIcon, { backgroundColor: theme.accent.muted }]}>
              <Feather name="activity" size={24} color={theme.accent.primary} />
            </View>
            <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Corrida</Text>
            <View style={{ width: 48 }} />
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={[styles.mainTitle, { color: theme.text.primary }]}>
              Pronto para{'\n'}
              <Text style={{ color: theme.accent.primary }}>correr?</Text>
            </Text>
            <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
              Escolha como deseja registrar sua corrida
            </Text>
          </View>

          {/* Options */}
          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: theme.background.secondary }]}
            onPress={() => {
              setCurrentDateTime();
              setScreenMode('stopwatch');
            }}
          >
            <View style={[styles.optionIcon, { backgroundColor: theme.accent.muted }]}>
              <Feather name="play-circle" size={28} color={theme.accent.primary} />
            </View>
            <View style={styles.optionInfo}>
              <Text style={[styles.optionTitle, { color: theme.text.primary }]}>Iniciar Corrida</Text>
              <Text style={[styles.optionDescription, { color: theme.text.secondary }]}>
                Cronômetro com marcação de voltas em tempo real
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: theme.background.secondary }]}
            onPress={() => {
              setCurrentDateTime();
              setScreenMode('manual');
            }}
          >
            <View style={[styles.optionIcon, { backgroundColor: theme.accent.muted }]}>
              <Feather name="edit-3" size={28} color={theme.accent.primary} />
            </View>
            <View style={styles.optionInfo}>
              <Text style={[styles.optionTitle, { color: theme.text.primary }]}>Adicionar Manualmente</Text>
              <Text style={[styles.optionDescription, { color: theme.text.secondary }]}>
                Registre uma corrida passada com todos os detalhes
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.text.tertiary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Stopwatch Screen
  if (screenMode === 'stopwatch') {
    const totalLapDistance = liveLaps.reduce((sum, lap) => sum + lap.distance, 0);
    const avgPace = totalLapDistance > 0 ? elapsedSeconds / totalLapDistance : 0;

    return (
      <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <ScrollView style={styles.stopwatchScroll} contentContainerStyle={styles.stopwatchContent}>
          {/* Header */}
          <View style={styles.stopwatchHeader}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.background.secondary }]}
              onPress={() => {
                if (stopwatchState === 'idle' && liveLaps.length === 0) {
                  setScreenMode('selection');
                } else {
                  discardStopwatch();
                }
              }}
            >
              <Feather name="x" size={20} color={theme.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.stopwatchTitle, { color: theme.text.primary }]}>
              {stopwatchState === 'idle' ? 'Pronto' : 'Correndo'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Main Timer */}
          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, { color: theme.accent.primary }]}>
              {formatSecondsToFullTime(elapsedSeconds)}
            </Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: theme.background.secondary }]}>
              <Feather name="map-pin" size={18} color={theme.accent.primary} />
              <Text style={[styles.statValue, { color: theme.text.primary }]}>
                {totalLapDistance.toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.tertiary }]}>km</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.background.secondary }]}>
              <Feather name="trending-up" size={18} color={theme.accent.primary} />
              <Text style={[styles.statValue, { color: theme.text.primary }]}>
                {avgPace > 0 ? formatSecondsToTime(avgPace) : '--:--'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.tertiary }]}>/km</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.background.secondary }]}>
              <Feather name="flag" size={18} color={theme.accent.primary} />
              <Text style={[styles.statValue, { color: theme.text.primary }]}>
                {liveLaps.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.tertiary }]}>voltas</Text>
            </View>
          </View>

          {/* Lap Distance Setting */}
          {stopwatchState === 'idle' && liveLaps.length === 0 && (
            <View style={[styles.lapDistanceSetting, { backgroundColor: theme.background.secondary }]}>
              <Text style={[styles.lapDistanceLabel, { color: theme.text.secondary }]}>
                Distância por volta:
              </Text>
              <View style={styles.lapDistanceInputRow}>
                <TextInput
                  style={[styles.lapDistanceInput, { backgroundColor: theme.background.tertiary, color: theme.text.primary }]}
                  value={lapDistance}
                  onChangeText={setLapDistance}
                  keyboardType="decimal-pad"
                  maxLength={4}
                />
                <Text style={[styles.lapDistanceUnit, { color: theme.text.secondary }]}>km</Text>
              </View>
            </View>
          )}

          {/* Live Laps */}
          {liveLaps.length > 0 && (
            <View style={[styles.liveLapsCard, { backgroundColor: theme.background.secondary }]}>
              <Text style={[styles.liveLapsTitle, { color: theme.text.primary }]}>Voltas</Text>

              <View style={[styles.liveLapsHeader, { borderBottomColor: theme.border.primary }]}>
                <Text style={[styles.liveLapsHeaderText, styles.lapNumCol, { color: theme.text.tertiary }]}>#</Text>
                <Text style={[styles.liveLapsHeaderText, styles.lapDistCol, { color: theme.text.tertiary }]}>DIST.</Text>
                <Text style={[styles.liveLapsHeaderText, styles.lapTimeCol, { color: theme.text.tertiary }]}>PARCIAL</Text>
                <Text style={[styles.liveLapsHeaderText, styles.lapPaceCol, { color: theme.text.tertiary }]}>PACE</Text>
              </View>

              {liveLaps.slice().reverse().map((lap) => (
                <View key={lap.number} style={[styles.liveLapRow, { borderBottomColor: theme.border.primary }]}>
                  <Text style={[styles.liveLapCell, styles.lapNumCol, { color: theme.text.secondary }]}>
                    {lap.number}
                  </Text>
                  <Text style={[styles.liveLapCell, styles.lapDistCol, { color: theme.text.primary }]}>
                    {lap.distance} km
                  </Text>
                  <Text style={[styles.liveLapCell, styles.lapTimeCol, { color: theme.text.primary }]}>
                    {formatSecondsToTime(lap.splitSeconds)}
                  </Text>
                  <Text style={[styles.liveLapCell, styles.lapPaceCol, { color: theme.accent.primary }]}>
                    {formatSecondsToTime(lap.paceSeconds)}/km
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Bottom Controls */}
        <View style={[styles.stopwatchControls, { backgroundColor: theme.background.primary, borderTopColor: theme.border.primary }]}>
          {stopwatchState === 'idle' ? (
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: theme.accent.primary }]}
              onPress={startStopwatch}
            >
              <Feather name="play" size={28} color="#000000" />
              <Text style={styles.startButtonText}>INICIAR</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.runningControls}>
              {/* Lap Button */}
              <TouchableOpacity
                style={[styles.lapButton, { backgroundColor: theme.accent.primary }]}
                onPress={markLap}
              >
                <Feather name="flag" size={24} color="#000000" />
                <Text style={styles.lapButtonText}>VOLTA</Text>
              </TouchableOpacity>

              {/* Pause/Resume */}
              <TouchableOpacity
                style={[styles.pauseButton, { backgroundColor: theme.background.secondary }]}
                onPress={stopwatchState === 'running' ? pauseStopwatch : resumeStopwatch}
              >
                <Feather
                  name={stopwatchState === 'running' ? 'pause' : 'play'}
                  size={24}
                  color={theme.text.primary}
                />
              </TouchableOpacity>

              {/* Finish */}
              <TouchableOpacity
                style={[styles.finishButton, { backgroundColor: theme.semantic.error }]}
                onPress={finishStopwatch}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="stop-circle" size={24} color="#FFFFFF" />
                    <Text style={styles.finishButtonText}>PARAR</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  // Manual Entry Screen
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.primary }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.background.secondary }]}
            onPress={() => isEditMode ? navigation?.goBack() : setScreenMode('selection')}
          >
            <Feather name="arrow-left" size={20} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
            {isEditMode ? 'Editar Corrida' : 'Registro Manual'}
          </Text>
          <View style={{ width: 48 }} />
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text.secondary }]}>TÍTULO</Text>
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

        {/* Laps Section */}
        <View style={styles.section}>
          <View style={styles.lapsHeader}>
            <Text style={[styles.label, { color: theme.text.secondary }]}>VOLTAS</Text>
            <View style={[styles.lapCountBadge, { backgroundColor: theme.accent.muted }]}>
              <Text style={[styles.lapCountText, { color: theme.accent.primary }]}>{manualLaps.length}</Text>
            </View>
          </View>

          {manualLaps.length > 0 && (
            <View style={[styles.lapsTable, { backgroundColor: theme.background.secondary }]}>
              <View style={[styles.lapTableHeader, { borderBottomColor: theme.border.primary }]}>
                <Text style={[styles.lapTableHeaderText, styles.lapColNum, { color: theme.text.tertiary }]}>#</Text>
                <Text style={[styles.lapTableHeaderText, styles.lapColDist, { color: theme.text.tertiary }]}>DIST.</Text>
                <Text style={[styles.lapTableHeaderText, styles.lapColTime, { color: theme.text.tertiary }]}>TEMPO</Text>
                <Text style={[styles.lapTableHeaderText, styles.lapColPace, { color: theme.text.tertiary }]}>PACE</Text>
                <View style={styles.lapColAction} />
              </View>

              {manualLaps.map((lap, index) => (
                <View key={index} style={[styles.lapRow, { borderBottomColor: theme.border.primary }]}>
                  <Text style={[styles.lapCell, styles.lapColNum, { color: theme.text.secondary }]}>{index + 1}</Text>
                  <Text style={[styles.lapCell, styles.lapColDist, { color: theme.text.primary }]}>{lap.distance} km</Text>
                  <Text style={[styles.lapCell, styles.lapColTime, { color: theme.text.primary }]}>{lap.time}</Text>
                  <Text style={[styles.lapCell, styles.lapColPace, { color: theme.accent.primary }]}>{lap.pace}/km</Text>
                  <TouchableOpacity style={styles.lapColAction} onPress={() => removeManualLap(index)}>
                    <Feather name="x" size={16} color={theme.text.tertiary} />
                  </TouchableOpacity>
                </View>
              ))}

              {manualLaps.length > 1 && (
                <View style={[styles.lapTotalRow, { backgroundColor: theme.background.tertiary }]}>
                  <Text style={[styles.lapTotalLabel, { color: theme.text.secondary }]}>Total</Text>
                  <Text style={[styles.lapTotalValue, { color: theme.accent.primary }]}>
                    {calculateTotalsFromManualLaps().totalDistance.toFixed(2)} km
                  </Text>
                  <Text style={[styles.lapTotalValue, { color: theme.text.primary }]}>
                    {formatSecondsToTime(calculateTotalsFromManualLaps().totalSeconds)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Add Lap Form */}
          {showAddLap && (
            <View style={[styles.addLapForm, { backgroundColor: theme.background.secondary }]}>
              <Text style={[styles.addLapTitle, { color: theme.text.primary }]}>Nova Volta</Text>

              <View style={styles.addLapRow}>
                <Text style={[styles.addLapLabel, { color: theme.text.secondary }]}>Distância</Text>
                <View style={styles.addLapInputRow}>
                  <TextInput
                    style={[styles.addLapInput, { backgroundColor: theme.background.tertiary, color: theme.text.primary }]}
                    placeholder="1"
                    placeholderTextColor={theme.text.tertiary}
                    value={newLap.distance}
                    onChangeText={(val) => setNewLap({ ...newLap, distance: val })}
                    keyboardType="decimal-pad"
                  />
                  <Text style={[styles.addLapUnit, { color: theme.text.secondary }]}>km</Text>
                </View>
              </View>

              <View style={[styles.inputModeToggle, { backgroundColor: theme.background.tertiary }]}>
                <TouchableOpacity
                  style={[styles.inputModeOption, newLap.inputMode === 'time' && { backgroundColor: theme.accent.primary }]}
                  onPress={() => setNewLap({ ...newLap, inputMode: 'time' })}
                >
                  <Text style={[styles.inputModeText, { color: newLap.inputMode === 'time' ? '#000000' : theme.text.secondary }]}>
                    Por Tempo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inputModeOption, newLap.inputMode === 'pace' && { backgroundColor: theme.accent.primary }]}
                  onPress={() => setNewLap({ ...newLap, inputMode: 'pace' })}
                >
                  <Text style={[styles.inputModeText, { color: newLap.inputMode === 'pace' ? '#000000' : theme.text.secondary }]}>
                    Por Pace
                  </Text>
                </TouchableOpacity>
              </View>

              {newLap.inputMode === 'time' ? (
                <View style={styles.addLapRow}>
                  <Text style={[styles.addLapLabel, { color: theme.text.secondary }]}>Tempo (m:ss)</Text>
                  <TextInput
                    style={[styles.addLapInputFull, { backgroundColor: theme.background.tertiary, color: theme.text.primary }]}
                    placeholder="5:30"
                    placeholderTextColor={theme.text.tertiary}
                    value={newLap.time}
                    onChangeText={(val) => setNewLap({ ...newLap, time: val })}
                  />
                </View>
              ) : (
                <View style={styles.addLapRow}>
                  <Text style={[styles.addLapLabel, { color: theme.text.secondary }]}>Pace (m:ss/km)</Text>
                  <TextInput
                    style={[styles.addLapInputFull, { backgroundColor: theme.background.tertiary, color: theme.text.primary }]}
                    placeholder="5:30"
                    placeholderTextColor={theme.text.tertiary}
                    value={newLap.pace}
                    onChangeText={(val) => setNewLap({ ...newLap, pace: val })}
                  />
                </View>
              )}

              <View style={styles.addLapActions}>
                <TouchableOpacity
                  style={[styles.addLapCancel, { backgroundColor: theme.background.tertiary }]}
                  onPress={() => setShowAddLap(false)}
                >
                  <Text style={[styles.addLapCancelText, { color: theme.text.secondary }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addLapConfirm, { backgroundColor: theme.accent.primary }]}
                  onPress={addManualLap}
                >
                  <Text style={styles.addLapConfirmText}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!showAddLap && (
            <TouchableOpacity
              style={[styles.addLapButton, { borderColor: theme.accent.primary }]}
              onPress={() => setShowAddLap(true)}
            >
              <Feather name="plus" size={18} color={theme.accent.primary} />
              <Text style={[styles.addLapButtonText, { color: theme.accent.primary }]}>ADICIONAR VOLTA</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Divider */}
        <View style={[styles.dividerContainer, { marginVertical: 16 }]}>
          <View style={[styles.divider, { backgroundColor: theme.border.primary }]} />
          <Text style={[styles.dividerText, { color: theme.text.tertiary }]}>OU TOTAL DIRETO</Text>
          <View style={[styles.divider, { backgroundColor: theme.border.primary }]} />
        </View>

        {/* Distance */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text.secondary }]}>DISTÂNCIA (KM)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background.secondary, color: theme.text.primary }]}
            placeholder="0.00"
            placeholderTextColor={theme.text.tertiary}
            value={distance}
            onChangeText={setDistance}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text.secondary }]}>DURAÇÃO</Text>
          <View style={styles.durationInputs}>
            <View style={[styles.durationInputWrapper, { backgroundColor: theme.background.secondary }]}>
              <TextInput
                style={[styles.durationInput, { color: theme.text.primary }]}
                placeholder="0"
                placeholderTextColor={theme.text.tertiary}
                value={hours}
                onChangeText={setHours}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={[styles.durationLabel, { color: theme.text.tertiary }]}>horas</Text>
            </View>
            <View style={[styles.durationInputWrapper, { backgroundColor: theme.background.secondary }]}>
              <TextInput
                style={[styles.durationInput, { color: theme.text.primary }]}
                placeholder="00"
                placeholderTextColor={theme.text.tertiary}
                value={minutes}
                onChangeText={setMinutes}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={[styles.durationLabel, { color: theme.text.tertiary }]}>min</Text>
            </View>
            <View style={[styles.durationInputWrapper, { backgroundColor: theme.background.secondary }]}>
              <TextInput
                style={[styles.durationInput, { color: theme.text.primary }]}
                placeholder="00"
                placeholderTextColor={theme.text.tertiary}
                value={seconds}
                onChangeText={setSeconds}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={[styles.durationLabel, { color: theme.text.tertiary }]}>seg</Text>
            </View>
          </View>
        </View>

        {/* Effort */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text.secondary }]}>ESFORÇO PERCEBIDO</Text>
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
            <Text style={[styles.effortLabelText, { color: theme.text.tertiary }]}>Fácil</Text>
            <Text style={[styles.effortLabelText, { color: theme.text.tertiary }]}>Máximo</Text>
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
          onPress={handleManualSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>
                {isEditMode ? 'Atualizar' : 'Salvar Corrida'}
              </Text>
              <Feather name="check" size={20} color="#000000" />
            </>
          )}
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
  runningIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  titleSection: {
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 42,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Selection Screen
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Stopwatch Screen
  stopwatchScroll: {
    flex: 1,
  },
  stopwatchContent: {
    padding: 20,
    paddingBottom: 120,
  },
  stopwatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  stopwatchTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 64,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  lapDistanceSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
  },
  lapDistanceLabel: {
    fontSize: 15,
  },
  lapDistanceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lapDistanceInput: {
    width: 60,
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  lapDistanceUnit: {
    fontSize: 14,
  },
  liveLapsCard: {
    borderRadius: 14,
    padding: 16,
  },
  liveLapsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  liveLapsHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  liveLapsHeaderText: {
    fontSize: 11,
    fontWeight: '600',
  },
  lapNumCol: {
    width: 30,
    textAlign: 'center',
  },
  lapDistCol: {
    flex: 1,
  },
  lapTimeCol: {
    flex: 1,
  },
  lapPaceCol: {
    flex: 1.2,
    textAlign: 'right',
  },
  liveLapRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  liveLapCell: {
    fontSize: 14,
  },
  stopwatchControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  runningControls: {
    flexDirection: 'row',
    gap: 12,
  },
  lapButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  lapButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  pauseButton: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Manual Entry Styles
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
  durationInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  durationInputWrapper: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  durationInput: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
    paddingVertical: 4,
  },
  durationLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  lapsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  lapCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  lapCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lapsTable: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  lapTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  lapTableHeaderText: {
    fontSize: 11,
    fontWeight: '600',
  },
  lapColNum: {
    width: 28,
    textAlign: 'center',
  },
  lapColDist: {
    flex: 1,
  },
  lapColTime: {
    flex: 1,
  },
  lapColPace: {
    flex: 1,
    textAlign: 'right',
  },
  lapColAction: {
    width: 28,
    alignItems: 'center',
  },
  lapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  lapCell: {
    fontSize: 14,
  },
  lapTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  lapTotalLabel: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  lapTotalValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  addLapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  addLapButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addLapForm: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  addLapTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  addLapRow: {
    marginBottom: 12,
  },
  addLapLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  addLapInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addLapInput: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addLapInputFull: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addLapUnit: {
    fontSize: 14,
  },
  inputModeToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  inputModeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  inputModeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  addLapActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  addLapCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addLapCancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addLapConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addLapConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 11,
    fontWeight: '500',
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
