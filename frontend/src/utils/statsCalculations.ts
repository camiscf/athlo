import {
  RunningActivity,
  StrengthActivity,
  BodyMeasurement,
  WeightRecord,
  RunningStats,
  StrengthStats,
  BodyStats,
  ChartDataPoint,
  PeriodType,
} from '../types';

// ==================== DATE HELPERS ====================

export function getDateRange(period: PeriodType): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  switch (period) {
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      break;
    case 'all':
      start.setFullYear(2000); // Far in the past
      break;
  }

  return { start, end };
}

export function filterByPeriod<T extends { start_time?: string; date?: string }>(
  items: T[],
  period: PeriodType
): T[] {
  const { start, end } = getDateRange(period);

  return items.filter(item => {
    const dateStr = item.start_time || item.date;
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date >= start && date <= end;
  });
}

export function formatDate(dateStr: string, format: 'short' | 'medium' | 'long' = 'short'): string {
  const date = new Date(dateStr);

  switch (format) {
    case 'short':
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    case 'medium':
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    case 'long':
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  }
}

// ==================== RUNNING STATS ====================

export function calculateRunningStats(activities: RunningActivity[]): RunningStats {
  if (activities.length === 0) {
    return {
      totalDistance: 0,
      totalDuration: 0,
      totalActivities: 0,
      averagePace: 0,
      averageDistance: 0,
      longestRun: 0,
      fastestPace: 0,
    };
  }

  const totalDistance = activities.reduce((sum, a) => sum + (a.distance || 0), 0);
  const totalDuration = activities.reduce((sum, a) => sum + (a.duration || 0), 0);
  const totalActivities = activities.length;

  const activitiesWithDistance = activities.filter(a => a.distance && a.distance > 0);
  const averageDistance = activitiesWithDistance.length > 0
    ? totalDistance / activitiesWithDistance.length
    : 0;

  const longestRun = Math.max(...activities.map(a => a.distance || 0));

  const activitiesWithPace = activities.filter(a => a.pace && a.pace > 0);
  const averagePace = activitiesWithPace.length > 0
    ? activitiesWithPace.reduce((sum, a) => sum + (a.pace || 0), 0) / activitiesWithPace.length
    : 0;

  const fastestPace = activitiesWithPace.length > 0
    ? Math.min(...activitiesWithPace.map(a => a.pace || Infinity))
    : 0;

  return {
    totalDistance,
    totalDuration,
    totalActivities,
    averagePace,
    averageDistance,
    longestRun,
    fastestPace,
  };
}

export function getRunningDistanceChartData(activities: RunningActivity[]): ChartDataPoint[] {
  const sorted = [...activities].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  return sorted.map(activity => ({
    value: activity.distance || 0,
    label: formatDate(activity.start_time),
    date: activity.start_time,
  }));
}

export function getRunningPaceChartData(activities: RunningActivity[]): ChartDataPoint[] {
  const sorted = [...activities]
    .filter(a => a.pace && a.pace > 0)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return sorted.map(activity => ({
    value: (activity.pace || 0) / 60, // Convert to minutes
    label: formatDate(activity.start_time),
    date: activity.start_time,
  }));
}

export function getWeeklyDistanceData(activities: RunningActivity[]): ChartDataPoint[] {
  const weeklyData: Record<string, number> = {};

  activities.forEach(activity => {
    const date = new Date(activity.start_time);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    weeklyData[weekKey] = (weeklyData[weekKey] || 0) + (activity.distance || 0);
  });

  return Object.entries(weeklyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8) // Last 8 weeks
    .map(([date, value]) => ({
      value,
      label: formatDate(date),
      date,
    }));
}

// ==================== STRENGTH STATS ====================

export function calculateStrengthStats(activities: StrengthActivity[]): StrengthStats {
  if (activities.length === 0) {
    return {
      totalWorkouts: 0,
      totalSets: 0,
      totalExercises: 0,
      mostWorkedMuscleGroup: null,
      averageWorkoutDuration: 0,
    };
  }

  const totalWorkouts = activities.length;
  const totalSets = activities.reduce((sum, a) => sum + (a.total_sets || 0), 0);
  const totalExercises = activities.reduce((sum, a) => sum + (a.total_exercises || 0), 0);

  const activitiesWithDuration = activities.filter(a => a.duration && a.duration > 0);
  const averageWorkoutDuration = activitiesWithDuration.length > 0
    ? activitiesWithDuration.reduce((sum, a) => sum + (a.duration || 0), 0) / activitiesWithDuration.length
    : 0;

  // Count muscle groups
  const muscleGroupCounts: Record<string, number> = {};
  activities.forEach(activity => {
    (activity.muscle_groups_worked || []).forEach(group => {
      muscleGroupCounts[group] = (muscleGroupCounts[group] || 0) + 1;
    });
  });

  const mostWorkedMuscleGroup = Object.entries(muscleGroupCounts).length > 0
    ? Object.entries(muscleGroupCounts).sort(([, a], [, b]) => b - a)[0][0]
    : null;

  return {
    totalWorkouts,
    totalSets,
    totalExercises,
    mostWorkedMuscleGroup,
    averageWorkoutDuration,
  };
}

export function getMuscleGroupDistribution(activities: StrengthActivity[]): ChartDataPoint[] {
  const muscleGroupCounts: Record<string, number> = {};

  activities.forEach(activity => {
    (activity.muscle_groups_worked || []).forEach(group => {
      muscleGroupCounts[group] = (muscleGroupCounts[group] || 0) + 1;
    });
  });

  return Object.entries(muscleGroupCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6) // Top 6 muscle groups
    .map(([group, count]) => ({
      value: count,
      label: group,
    }));
}

export function getWorkoutVolumeChartData(activities: StrengthActivity[]): ChartDataPoint[] {
  const sorted = [...activities].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  return sorted.map(activity => ({
    value: activity.total_sets || 0,
    label: formatDate(activity.start_time),
    date: activity.start_time,
  }));
}

// ==================== BODY STATS ====================

export function calculateBodyStats(
  measurements: BodyMeasurement[],
  weightHistory: WeightRecord[]
): BodyStats {
  if (measurements.length === 0) {
    return {
      currentWeight: null,
      weightChange30Days: null,
      currentBodyFat: null,
      bodyFatChange30Days: null,
    };
  }

  // Sort by date descending
  const sorted = [...measurements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const latest = sorted[0];
  const currentWeight = latest.weight;
  const currentBodyFat = latest.body_fat_percentage;

  // Find measurement from ~30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const oldMeasurement = sorted.find(m => new Date(m.date) <= thirtyDaysAgo);

  const weightChange30Days = currentWeight && oldMeasurement?.weight
    ? currentWeight - oldMeasurement.weight
    : null;

  const bodyFatChange30Days = currentBodyFat && oldMeasurement?.body_fat_percentage
    ? currentBodyFat - oldMeasurement.body_fat_percentage
    : null;

  return {
    currentWeight,
    weightChange30Days,
    currentBodyFat,
    bodyFatChange30Days,
  };
}

export function getWeightChartData(weightHistory: WeightRecord[]): ChartDataPoint[] {
  return weightHistory.map(record => ({
    value: record.weight,
    label: formatDate(record.date),
    date: record.date,
  }));
}

// ==================== FORMATTERS ====================

export function formatPace(paceSeconds: number): string {
  if (!paceSeconds || paceSeconds <= 0) return '--:--';
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.floor(paceSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatDistance(km: number): string {
  if (!km || km <= 0) return '0';
  return km.toFixed(1);
}
