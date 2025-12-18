import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Activities: undefined;
  AddActivity: { activityId?: string } | undefined;
  Profile: undefined;
  ActivityDetail: { activityId: string };
};

// Activity Stack (for detail screens)
export type ActivityStackParamList = {
  ActivityList: undefined;
  ActivityDetail: { activityId: string };
  EditActivity: { activityId: string };
};

// Root Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Screen props types
export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type ActivityStackScreenProps<T extends keyof ActivityStackParamList> =
  NativeStackScreenProps<ActivityStackParamList, T>;
