import React from 'react';
import { Text, Platform, TouchableOpacity, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { MainTabParamList } from './types';
import { useAuth } from '../context/AuthContext';
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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ProfileHeaderButton() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  return (
    <TouchableOpacity
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
      }}
      onPress={() => navigation.navigate('Profile')}
    >
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#007AFF' }}>
        {user?.name?.charAt(0).toUpperCase() || '?'}
      </Text>
    </TouchableOpacity>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E5EA',
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
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#FFFFFF',
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
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
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
    </Stack.Navigator>
  );
}

function TabIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = {
    home: '🏠',
    list: '📋',
    run: '🏃',
    strength: '💪',
    body: '⚖️',
    user: '👤',
  };

  return <Text style={{ fontSize: 20, color }}>{icons[name] || '•'}</Text>;
}
