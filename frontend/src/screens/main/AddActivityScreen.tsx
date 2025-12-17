import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { api } from '../../services/api';
import { RunningActivityCreate } from '../../types';

export default function AddActivityScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const isExtraLarge = width >= 1024;

  const [title, setTitle] = useState('');
  const [distance, setDistance] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [effort, setEffort] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const effortLevels = [
    { value: 1, label: '1', description: 'Muito fácil' },
    { value: 3, label: '3', description: 'Fácil' },
    { value: 5, label: '5', description: 'Moderado' },
    { value: 7, label: '7', description: 'Difícil' },
    { value: 9, label: '9', description: 'Máximo' },
  ];

  function showAlert(title: string, message: string) {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    }
  }

  function resetForm() {
    setTitle('');
    setDistance('');
    setHours('');
    setMinutes('');
    setSeconds('');
    setEffort(null);
    setNotes('');
  }

  async function handleSubmit() {
    const distanceNum = parseFloat(distance.replace(',', '.'));
    const hoursNum = parseInt(hours) || 0;
    const minutesNum = parseInt(minutes) || 0;
    const secondsNum = parseInt(seconds) || 0;
    const totalSeconds = hoursNum * 3600 + minutesNum * 60 + secondsNum;

    if (!distanceNum && !totalSeconds) {
      showAlert('Erro', 'Informe pelo menos a distância ou o tempo.');
      return;
    }

    if (distanceNum && distanceNum <= 0) {
      showAlert('Erro', 'A distância deve ser maior que zero.');
      return;
    }

    if (totalSeconds && totalSeconds <= 0) {
      showAlert('Erro', 'O tempo deve ser maior que zero.');
      return;
    }

    setIsLoading(true);

    try {
      const activityData: RunningActivityCreate = {
        start_time: new Date().toISOString(),
      };

      if (title.trim()) {
        activityData.title = title.trim();
      }

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

      await api.createRunningActivity(activityData);

      showAlert('Sucesso', 'Atividade registrada com sucesso!');
      resetForm();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erro ao salvar atividade.';
      showAlert('Erro', message);
    } finally {
      setIsLoading(false);
    }
  }

  const containerMaxWidth = isExtraLarge ? 600 : isLargeScreen ? 500 : '100%';

  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.scrollContent,
        isLargeScreen && styles.scrollContentCentered,
      ]}
    >
      <View style={[
        styles.content,
        { maxWidth: containerMaxWidth },
        isLargeScreen && styles.contentLarge,
      ]}>
        {/* Título */}
        <View style={styles.section}>
          <Text style={styles.label}>Título (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Corrida matinal no parque"
            placeholderTextColor="#8E8E93"
            value={title}
            onChangeText={setTitle}
            editable={!isLoading}
          />
        </View>

        {/* Distância e Tempo em row no desktop */}
        <View style={[
          styles.rowContainer,
          isLargeScreen && styles.rowContainerLarge,
        ]}>
          {/* Distância */}
          <View style={[
            styles.section,
            isLargeScreen && styles.sectionHalf,
          ]}>
            <Text style={styles.label}>Distância (km)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#8E8E93"
              value={distance}
              onChangeText={setDistance}
              keyboardType="decimal-pad"
              editable={!isLoading}
            />
          </View>

          {/* Tempo */}
          <View style={[
            styles.section,
            isLargeScreen && styles.sectionHalf,
          ]}>
            <Text style={styles.label}>Tempo</Text>
            <View style={styles.timeInputs}>
              <View style={styles.timeInputWrapper}>
                <TextInput
                  style={styles.timeInput}
                  placeholder="0"
                  placeholderTextColor="#8E8E93"
                  value={hours}
                  onChangeText={setHours}
                  keyboardType="number-pad"
                  maxLength={2}
                  editable={!isLoading}
                />
                <Text style={styles.timeLabel}>h</Text>
              </View>
              <View style={styles.timeInputWrapper}>
                <TextInput
                  style={styles.timeInput}
                  placeholder="00"
                  placeholderTextColor="#8E8E93"
                  value={minutes}
                  onChangeText={setMinutes}
                  keyboardType="number-pad"
                  maxLength={2}
                  editable={!isLoading}
                />
                <Text style={styles.timeLabel}>min</Text>
              </View>
              <View style={styles.timeInputWrapper}>
                <TextInput
                  style={styles.timeInput}
                  placeholder="00"
                  placeholderTextColor="#8E8E93"
                  value={seconds}
                  onChangeText={setSeconds}
                  keyboardType="number-pad"
                  maxLength={2}
                  editable={!isLoading}
                />
                <Text style={styles.timeLabel}>seg</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Esforço */}
        <View style={styles.section}>
          <Text style={styles.label}>Nível de Esforço (opcional)</Text>
          <View style={[
            styles.effortContainer,
            isLargeScreen && styles.effortContainerLarge,
          ]}>
            {effortLevels.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.effortButton,
                  isLargeScreen && styles.effortButtonLarge,
                  effort === level.value && styles.effortButtonSelected,
                ]}
                onPress={() => setEffort(effort === level.value ? null : level.value)}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.effortButtonText,
                    effort === level.value && styles.effortButtonTextSelected,
                  ]}
                >
                  {level.label}
                </Text>
                <Text
                  style={[
                    styles.effortDescription,
                    effort === level.value && styles.effortDescriptionSelected,
                  ]}
                >
                  {level.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notas */}
        <View style={styles.section}>
          <Text style={styles.label}>Notas (opcional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Como foi o treino?"
            placeholderTextColor="#8E8E93"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!isLoading}
          />
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            isLoading && styles.submitButtonDisabled,
            isLargeScreen && styles.submitButtonLarge,
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Salvar Atividade</Text>
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
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentCentered: {
    alignItems: 'center',
  },
  content: {
    padding: 16,
    width: '100%',
  },
  contentLarge: {
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  rowContainer: {
    width: '100%',
  },
  rowContainerLarge: {
    flexDirection: 'row',
    gap: 16,
  },
  section: {
    marginBottom: 20,
    width: '100%',
  },
  sectionHalf: {
    flex: 1,
  },
  label: {
    fontSize: 15,
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
    width: '100%',
  },
  timeInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  timeInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    minWidth: 60,
  },
  timeInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    minWidth: 30,
  },
  timeLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 2,
  },
  effortContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  effortContainerLarge: {
    flexWrap: 'nowrap',
  },
  effortButton: {
    flex: 1,
    minWidth: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  effortButtonLarge: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  effortButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  effortButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  effortButtonTextSelected: {
    color: '#FFFFFF',
  },
  effortDescription: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 2,
    textAlign: 'center',
  },
  effortDescriptionSelected: {
    color: '#FFFFFF',
  },
  notesInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  submitButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
    width: '100%',
  },
  submitButtonLarge: {
    maxWidth: 300,
    alignSelf: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#A8E6B3',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
