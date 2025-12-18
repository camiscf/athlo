import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { WorkoutDivision } from '../../types';

interface DivisionsScreenProps {
  navigation: any;
}

export default function DivisionsScreen({ navigation }: DivisionsScreenProps) {
  const theme = useColors();
  const [divisions, setDivisions] = useState<WorkoutDivision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadDivisions();
    }, [])
  );

  async function loadDivisions() {
    try {
      const data = await api.getWorkoutDivisions();
      setDivisions(data);
    } catch (error) {
      console.error('Erro ao carregar divisões:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  function handleRefresh() {
    setIsRefreshing(true);
    loadDivisions();
  }

  function handleCreateDivision() {
    navigation.navigate('EditDivision', { divisionId: null });
  }

  function handleEditDivision(division: WorkoutDivision) {
    navigation.navigate('EditDivision', { divisionId: division.id });
  }

  function handleStartWorkout(division: WorkoutDivision) {
    navigation.navigate('RecordStrengthWorkout', { divisionId: division.id });
  }

  function renderDivision({ item }: { item: WorkoutDivision }) {
    const muscleGroups = [...new Set(item.exercises.map(e => e.muscle_group))];

    return (
      <TouchableOpacity
        style={[styles.divisionCard, { backgroundColor: theme.background.secondary }]}
        onPress={() => handleEditDivision(item)}
      >
        <View style={styles.divisionHeader}>
          <Text style={[styles.divisionName, { color: theme.text.primary }]}>{item.name}</Text>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: theme.semantic.success }]}
            onPress={() => handleStartWorkout(item)}
          >
            <Text style={[styles.startButtonText, { color: theme.text.primary }]}>Iniciar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divisionInfo}>
          <Text style={[styles.exerciseCount, { color: theme.text.secondary }]}>
            {item.exercises.length} exercício{item.exercises.length !== 1 ? 's' : ''}
          </Text>
          {muscleGroups.length > 0 && (
            <Text style={[styles.muscleGroups, { color: theme.accent.primary }]}>
              {muscleGroups.join(' • ')}
            </Text>
          )}
        </View>

        {item.exercises.length > 0 && (
          <View style={[styles.exercisePreview, { backgroundColor: theme.background.tertiary }]}>
            {item.exercises.slice(0, 3).map((ex, index) => (
              <Text key={index} style={[styles.exercisePreviewText, { color: theme.text.primary }]}>
                • {ex.exercise_name} - {ex.sets}x{ex.reps}
              </Text>
            ))}
            {item.exercises.length > 3 && (
              <Text style={[styles.moreText, { color: theme.text.secondary }]}>
                +{item.exercises.length - 3} mais...
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
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
      <FlatList
        data={divisions}
        renderItem={renderDivision}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.accent.primary]}
            tintColor={theme.accent.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="layers" size={48} color={theme.text.tertiary} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>
              Nenhuma divisão criada
            </Text>
            <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
              Crie divisões de treino para organizar seus exercícios
            </Text>
          </View>
        }
        ListHeaderComponent={
          divisions.length > 0 ? (
            <Text style={[styles.headerText, { color: theme.text.secondary }]}>
              {divisions.length}/5 divisões
            </Text>
          ) : null
        }
      />

      {divisions.length < 5 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.accent.primary }]}
          onPress={handleCreateDivision}
        >
          <Feather name="plus" size={24} color="#000000" />
        </TouchableOpacity>
      )}
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  headerText: {
    fontSize: 14,
    marginBottom: 12,
  },
  divisionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  divisionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  divisionName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  startButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divisionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseCount: {
    fontSize: 14,
    marginRight: 12,
  },
  muscleGroups: {
    fontSize: 12,
  },
  exercisePreview: {
    borderRadius: 8,
    padding: 12,
  },
  exercisePreviewText: {
    fontSize: 14,
    marginBottom: 4,
  },
  moreText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
