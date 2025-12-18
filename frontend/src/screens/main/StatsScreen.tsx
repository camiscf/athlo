import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { api } from '../../services/api';
import {
  RunningActivity,
  StrengthActivity,
  WeightRecord,
} from '../../types';
import {
  filterByPeriod,
  calculateRunningStats,
  calculateStrengthStats,
  formatPace,
  formatDistance,
} from '../../utils/statsCalculations';

type PeriodType = '1W' | '1M' | '3M' | '1Y';
type ActivityFilter = 'all' | 'running' | 'strength';

interface StatGridCardProps {
  icon: string;
  label: string;
  value: string | number;
  unit?: string;
  theme: any;
}

function StatGridCard({ icon, label, value, unit, theme }: StatGridCardProps) {
  return (
    <View style={[styles.statGridCard, { backgroundColor: theme.background.secondary }]}>
      <View style={[styles.statGridIcon, { backgroundColor: theme.accent.muted }]}>
        <Feather name={icon as any} size={18} color={theme.accent.primary} />
      </View>
      <Text style={[styles.statGridLabel, { color: theme.text.secondary }]}>{label}</Text>
      <View style={styles.statGridValueRow}>
        <Text style={[styles.statGridValue, { color: theme.text.primary }]}>{value}</Text>
        {unit && <Text style={[styles.statGridUnit, { color: theme.text.tertiary }]}>{unit}</Text>}
      </View>
    </View>
  );
}

export default function StatsScreen() {
  const navigation = useNavigation<any>();
  const theme = useColors();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [period, setPeriod] = useState<PeriodType>('1M');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');

  // Raw data
  const [runningActivities, setRunningActivities] = useState<RunningActivity[]>([]);
  const [strengthActivities, setStrengthActivities] = useState<StrengthActivity[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [running, strength, weight] = await Promise.all([
        api.getRunningActivities(),
        api.getStrengthActivities(),
        api.getWeightHistory(60),
      ]);
      setRunningActivities(running);
      setStrengthActivities(strength);
      setWeightHistory(weight);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // Convert period to filter type
  const getPeriodFilter = (): 'week' | 'month' | 'year' | 'all' => {
    switch (period) {
      case '1W': return 'week';
      case '1M': return 'month';
      case '3M': return 'month';
      case '1Y': return 'year';
    }
  };

  // Filter data by period
  const filteredRunning = filterByPeriod(runningActivities, getPeriodFilter());
  const filteredStrength = filterByPeriod(strengthActivities, getPeriodFilter());

  // Calculate stats
  const runningStats = calculateRunningStats(filteredRunning);
  const strengthStats = calculateStrengthStats(filteredStrength);

  // Get pace trend
  const getPaceTrend = () => {
    if (filteredRunning.length < 2) return { current: '--', change: 0 };
    const recentPaces = filteredRunning
      .filter(a => a.pace)
      .slice(0, 5)
      .map(a => a.pace!);
    const olderPaces = filteredRunning
      .filter(a => a.pace)
      .slice(-5)
      .map(a => a.pace!);

    if (recentPaces.length === 0) return { current: '--', change: 0 };

    const avgRecent = recentPaces.reduce((a, b) => a + b, 0) / recentPaces.length;
    const avgOlder = olderPaces.length > 0 ? olderPaces.reduce((a, b) => a + b, 0) / olderPaces.length : avgRecent;
    const change = ((avgOlder - avgRecent) / avgOlder) * 100;

    return {
      current: formatPace(avgRecent),
      change: Math.round(change),
    };
  };

  const paceTrend = getPaceTrend();

  // Generate consistency calendar data
  const getConsistencyData = () => {
    const today = new Date();
    const days = 28; // 4 weeks
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const hasRunning = filteredRunning.some(a =>
        a.start_time.split('T')[0] === dateStr
      );
      const hasStrength = filteredStrength.some(a =>
        a.start_time.split('T')[0] === dateStr
      );

      data.push({
        date: dateStr,
        hasActivity: hasRunning || hasStrength,
        day: date.getDay(),
      });
    }
    return data;
  };

  const consistencyData = getConsistencyData();

  // Recent records/achievements
  const getRecentRecords = () => {
    const records = [];
    if (runningStats.longestRun > 0) {
      records.push({
        icon: 'award',
        title: 'Maior Distância',
        value: `${formatDistance(runningStats.longestRun)} km`,
        color: theme.accent.primary,
      });
    }
    if (runningStats.fastestPace && runningStats.fastestPace < 999) {
      records.push({
        icon: 'zap',
        title: 'Pace Mais Rapido',
        value: formatPace(runningStats.fastestPace),
        color: theme.semantic.warning,
      });
    }
    if (strengthStats.totalWorkouts > 0) {
      records.push({
        icon: 'target',
        title: 'Treinos de Forca',
        value: `${strengthStats.totalWorkouts} treinos`,
        color: theme.semantic.info,
      });
    }
    return records.slice(0, 3);
  };

  const recentRecords = getRecentRecords();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background.primary }]}>
        <ActivityIndicator size="large" color={theme.accent.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.accent.primary]}
            tintColor={theme.accent.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Performance</Text>
          <TouchableOpacity
            style={[styles.avatarButton, { backgroundColor: theme.background.secondary }]}
            onPress={() => navigation.navigate('Profile')}
          >
            <Feather name="user" size={20} color={theme.accent.primary} />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={[styles.periodSelector, { backgroundColor: theme.background.secondary }]}>
          {(['1W', '1M', '3M', '1Y'] as PeriodType[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodButton,
                period === p && { backgroundColor: theme.accent.primary },
              ]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  { color: theme.text.secondary },
                  period === p && { color: '#000000', fontWeight: '600' },
                ]}
              >
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Activity Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {[
            { key: 'all', label: 'Todas Atividades' },
            { key: 'running', label: 'Corrida' },
            { key: 'strength', label: 'Forca' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                { backgroundColor: theme.background.secondary },
                activityFilter === filter.key && {
                  backgroundColor: theme.accent.muted,
                  borderColor: theme.accent.primary,
                  borderWidth: 1,
                },
              ]}
              onPress={() => setActivityFilter(filter.key as ActivityFilter)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: theme.text.secondary },
                  activityFilter === filter.key && { color: theme.accent.primary },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Main Pace Card */}
        <View style={[styles.mainCard, { backgroundColor: theme.background.secondary }]}>
          <View style={styles.mainCardHeader}>
            <Text style={[styles.mainCardTitle, { color: theme.text.primary }]}>
              Evolução do Pace
            </Text>
            {paceTrend.change !== 0 && (
              <View
                style={[
                  styles.changeBadge,
                  { backgroundColor: paceTrend.change > 0 ? theme.semantic.successMuted : theme.semantic.errorMuted },
                ]}
              >
                <Feather
                  name={paceTrend.change > 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={paceTrend.change > 0 ? theme.semantic.success : theme.semantic.error}
                />
                <Text
                  style={[
                    styles.changeBadgeText,
                    { color: paceTrend.change > 0 ? theme.semantic.success : theme.semantic.error },
                  ]}
                >
                  {Math.abs(paceTrend.change)}%
                </Text>
              </View>
            )}
          </View>

          <View style={styles.mainCardValue}>
            <Text style={[styles.mainValueText, { color: theme.accent.primary }]}>
              {paceTrend.current}
            </Text>
            <Text style={[styles.mainValueUnit, { color: theme.text.tertiary }]}>min/km</Text>
          </View>

          {/* Simple chart visualization */}
          <View style={styles.chartPlaceholder}>
            {filteredRunning.slice(0, 7).reverse().map((activity, index) => {
              const paces = filteredRunning.filter(a => a.pace).map(a => a.pace!);
              const maxPace = Math.max(...paces, 1);
              const minPace = Math.min(...paces, 0);
              const range = maxPace - minPace || 1;
              const height = activity.pace
                ? ((maxPace - activity.pace) / range) * 60 + 20
                : 30;

              return (
                <View key={index} style={styles.chartBarContainer}>
                  <View
                    style={[
                      styles.chartBarInner,
                      { height, backgroundColor: theme.accent.primary },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatGridCard
            icon="flame"
            label="Calorias"
            value={Math.round(runningStats.totalDistance * 60)}
            unit="kcal"
            theme={theme}
          />
          <StatGridCard
            icon="map-pin"
            label="Distância"
            value={formatDistance(runningStats.totalDistance)}
            unit="km"
            theme={theme}
          />
          <StatGridCard
            icon="heart"
            label="FC Média"
            value={runningStats.averageHeartRate || '--'}
            unit="bpm"
            theme={theme}
          />
          <StatGridCard
            icon="trending-up"
            label="Elevacao"
            value={Math.round(runningStats.totalDistance * 15)}
            unit="m"
            theme={theme}
          />
        </View>

        {/* Consistency Section */}
        <View style={[styles.consistencyCard, { backgroundColor: theme.background.secondary }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Consistência</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.text.secondary }]}>
              Últimos 28 dias
            </Text>
          </View>

          <View style={styles.calendarGrid}>
            {consistencyData.map((day, index) => (
              <View
                key={index}
                style={[
                  styles.calendarDay,
                  { backgroundColor: day.hasActivity ? theme.accent.primary : theme.background.tertiary },
                ]}
              />
            ))}
          </View>

          <View style={styles.calendarLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.background.tertiary }]} />
              <Text style={[styles.legendText, { color: theme.text.tertiary }]}>Sem atividade</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.accent.primary }]} />
              <Text style={[styles.legendText, { color: theme.text.tertiary }]}>Com atividade</Text>
            </View>
          </View>
        </View>

        {/* Recent Records */}
        {recentRecords.length > 0 && (
          <View style={[styles.recordsCard, { backgroundColor: theme.background.secondary }]}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Recordes Recentes
            </Text>

            {recentRecords.map((record, index) => (
              <View
                key={index}
                style={[
                  styles.recordItem,
                  index !== recentRecords.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border.primary,
                  },
                ]}
              >
                <View style={[styles.recordIcon, { backgroundColor: record.color + '20' }]}>
                  <Feather name={record.icon as any} size={18} color={record.color} />
                </View>
                <View style={styles.recordInfo}>
                  <Text style={[styles.recordTitle, { color: theme.text.primary }]}>
                    {record.title}
                  </Text>
                  <Text style={[styles.recordValue, { color: theme.text.secondary }]}>
                    {record.value}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={theme.text.tertiary} />
              </View>
            ))}
          </View>
        )}

        {/* Detailed Stats Links */}
        <View style={[styles.linksCard, { backgroundColor: theme.background.secondary }]}>
          <TouchableOpacity
            style={[styles.linkItem, { borderBottomColor: theme.border.primary }]}
            onPress={() => navigation.navigate('RunningStats')}
          >
            <View style={styles.linkLeft}>
              <View style={[styles.linkIcon, { backgroundColor: theme.accent.muted }]}>
                <Feather name="activity" size={18} color={theme.accent.primary} />
              </View>
              <Text style={[styles.linkText, { color: theme.text.primary }]}>
                Estatisticas de Corrida
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={theme.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => navigation.navigate('StrengthStats')}
          >
            <View style={styles.linkLeft}>
              <View style={[styles.linkIcon, { backgroundColor: theme.semantic.infoMuted }]}>
                <Feather name="target" size={18} color={theme.semantic.info} />
              </View>
              <Text style={[styles.linkText, { color: theme.text.primary }]}>
                Estatisticas de Forca
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={theme.text.tertiary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterScroll: {
    marginBottom: 20,
  },
  filterContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mainCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  mainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mainCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  changeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  mainCardValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 20,
  },
  mainValueText: {
    fontSize: 48,
    fontWeight: '700',
  },
  mainValueUnit: {
    fontSize: 16,
  },
  chartPlaceholder: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    gap: 8,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarInner: {
    width: '60%',
    borderRadius: 4,
    minHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statGridCard: {
    width: '48%',
    borderRadius: 14,
    padding: 14,
  },
  statGridIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statGridLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  statGridValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statGridValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statGridUnit: {
    fontSize: 13,
  },
  consistencyCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 13,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  calendarDay: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
  },
  recordsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  recordValue: {
    fontSize: 13,
    marginTop: 2,
  },
  linksCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
