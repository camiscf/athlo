import React from 'react';
import { Text, Platform, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import { useAuth } from '../context/AuthContext';
import { useColors } from '../context/ThemeContext';
import HomeScreen from '../screens/main/HomeScreen';
import ActivitiesScreen from '../screens/main/ActivitiesScreen';
import AddActivityScreen from '../screens/main/AddActivityScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ActivityDetailScreen from '../screens/main/ActivityDetailScreen';
import DivisionsScreen from '../screens/main/DivisionsScreen';
import EditDivisionScreen from '../screens/main/EditDivisionScreen';
import RecordStrengthWorkoutScreen from '../screens/main/RecordStrengthWorkoutScreen';
import StrengthActivityDetailScreen from '../screens/main/StrengthActivityDetailScreen';
import EditStrengthWorkoutScreen from '../screens/main/EditStrengthWorkoutScreen';
import BodyScreen from '../screens/main/BodyScreen';
import StatsScreen from '../screens/main/StatsScreen';
import RunningStatsScreen from '../screens/main/RunningStatsScreen';
import StrengthStatsScreen from '../screens/main/StrengthStatsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ProfileHeaderButton() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const theme = useColors();

  return (
    <TouchableOpacity
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.accent.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
      }}
      onPress={() => navigation.navigate('Profile')}
    >
      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text.primary }}>
        {user?.name?.charAt(0).toUpperCase() || '?'}
      </Text>
    </TouchableOpacity>
  );
}

function TabNavigator() {
  const theme = useColors();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: theme.accent.primary,
        tabBarInactiveTintColor: theme.text.tertiary,
        tabBarStyle: {
          backgroundColor: theme.background.secondary,
          borderTopColor: theme.border.primary,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: Platform.OS === 'ios' ? 25 : 15,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarShowLabel: true,
        headerStyle: {
          backgroundColor: theme.background.secondary,
        },
        headerTintColor: theme.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerRight: () => <ProfileHeaderButton />,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tab.Screen
        name="Activities"
        component={ActivitiesScreen}
        options={{
          title: 'Atividades',
          tabBarIcon: ({ color }) => <TabIcon name="list" color={color} />,
        }}
      />
      <Tab.Screen
        name="AddActivity"
        component={AddActivityScreen}
        options={{
          title: 'Corrida',
          tabBarIcon: ({ color }) => <TabIcon name="run" color={color} />,
        }}
      />
      <Tab.Screen
        name="Divisions"
        component={DivisionsScreen}
        options={{
          title: 'Força',
          tabBarIcon: ({ color }) => <TabIcon name="strength" color={color} />,
        }}
      />
      <Tab.Screen
        name="Body"
        component={BodyScreen}
        options={{
          title: 'Corpo',
          tabBarIcon: ({ color }) => <TabIcon name="body" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  const theme = useColors();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background.secondary,
        },
        headerTintColor: theme.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: theme.background.primary,
        },
      }}
    >
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{
          title: 'Detalhes',
          headerBackTitle: 'Voltar',
        }}
      />
      <Stack.Screen
        name="EditActivity"
        component={AddActivityScreen}
        options={{
          title: 'Editar Atividade',
          headerBackTitle: 'Voltar',
        }}
      />
      <Stack.Screen
        name="EditDivision"
        component={EditDivisionScreen}
        options={({ route }: any) => ({
          title: route.params?.divisionId ? 'Editar Divisão' : 'Nova Divisão',
          headerBackTitle: 'Voltar',
        })}
      />
      <Stack.Screen
        name="RecordStrengthWorkout"
        component={RecordStrengthWorkoutScreen}
        options={{
          title: 'Registrar Treino',
          headerBackTitle: 'Voltar',
        }}
      />
      <Stack.Screen
        name="StrengthActivityDetail"
        component={StrengthActivityDetailScreen}
        options={{
          title: 'Detalhes do Treino',
          headerBackTitle: 'Voltar',
        }}
      />
      <Stack.Screen
        name="EditStrengthWorkout"
        component={EditStrengthWorkoutScreen}
        options={{
          title: 'Editar Treino',
          headerBackTitle: 'Voltar',
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          headerBackTitle: 'Voltar',
        }}
      />
      <Stack.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          title: 'Estatísticas',
          headerBackTitle: 'Voltar',
        }}
      />
      <Stack.Screen
        name="RunningStats"
        component={RunningStatsScreen}
        options={{
          title: 'Estatísticas de Corrida',
          headerBackTitle: 'Voltar',
        }}
      />
      <Stack.Screen
        name="StrengthStats"
        component={StrengthStatsScreen}
        options={{
          title: 'Estatísticas de Força',
          headerBackTitle: 'Voltar',
        }}
      />
    </Stack.Navigator>
  );
}

function TabIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = {
    home: 'home',
    list: 'layers',
    run: 'zap',
    strength: 'target',
    body: 'user',
  };

  return <Feather name={(icons[name] || 'circle') as any} size={22} color={color} />;
}
