import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { WorkoutDivision } from '../../types';

interface DivisionsScreenProps {
  navigation: any;
}

export default function DivisionsScreen({ navigation }: DivisionsScreenProps) {
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
        style={styles.divisionCard}
        onPress={() => handleEditDivision(item)}
      >
        <View style={styles.divisionHeader}>
          <Text style={styles.divisionName}>{item.name}</Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => handleStartWorkout(item)}
          >
            <Text style={styles.startButtonText}>Iniciar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divisionInfo}>
          <Text style={styles.exerciseCount}>
            {item.exercises.length} exercício{item.exercises.length !== 1 ? 's' : ''}
          </Text>
          {muscleGroups.length > 0 && (
            <Text style={styles.muscleGroups}>
              {muscleGroups.join(' • ')}
            </Text>
          )}
        </View>

        {item.exercises.length > 0 && (
          <View style={styles.exercisePreview}>
            {item.exercises.slice(0, 3).map((ex, index) => (
              <Text key={index} style={styles.exercisePreviewText}>
                • {ex.exercise_name} - {ex.sets}x{ex.reps}
              </Text>
            ))}
            {item.exercises.length > 3 && (
              <Text style={styles.moreText}>
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={divisions}
        renderItem={renderDivision}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Nenhuma divisão criada</Text>
            <Text style={styles.emptyText}>
              Crie divisões de treino para organizar seus exercícios
            </Text>
          </View>
        }
        ListHeaderComponent={
          divisions.length > 0 ? (
            <Text style={styles.headerText}>
              {divisions.length}/5 divisões
            </Text>
          ) : null
        }
      />

      {divisions.length < 5 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreateDivision}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  headerText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  divisionCard: {
    backgroundColor: '#FFFFFF',
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
    color: '#000000',
    flex: 1,
  },
  startButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
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
    color: '#8E8E93',
    marginRight: 12,
  },
  muscleGroups: {
    fontSize: 12,
    color: '#007AFF',
  },
  exercisePreview: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
  },
  exercisePreviewText: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },
  moreText: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
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
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 32,
    marginTop: -2,
  },
});
