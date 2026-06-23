import 'react-native-gesture-handler';
import React, { useEffect, useRef, Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen       from './src/screens/HomeScreen';
import RoutinesScreen   from './src/screens/RoutinesScreen';
import ProgressScreen   from './src/screens/ProgressScreen';
import LibraryScreen    from './src/screens/LibraryScreen';
import SettingsScreen   from './src/screens/SettingsScreen';
import SessionModal     from './src/screens/session/SessionModal';
import DrillConfigModal from './src/screens/drill/DrillConfigModal';
import OnboardingModal  from './src/screens/onboarding/OnboardingModal';
import AuthModal        from './src/screens/auth/AuthModal';

import { Colors } from './src/constants/colors';
import { FontSize, FontWeight } from './src/constants/layout';
import { migrateDatabase } from './src/db/schema';
import { useProfileStore } from './src/stores/profileStore';
import { RootTabParamList } from './src/types';

const Tab = createBottomTabNavigator<RootTabParamList>();
type TabName = keyof RootTabParamList;

// ─── Error Boundary ───────────────────────────────────────────────────────────

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  state = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message ?? 'Unknown error' };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={eb.container}>
        <Text style={eb.icon}>⚠️</Text>
        <Text style={eb.title}>Something went wrong</Text>
        <Text style={eb.body}>{this.state.message}</Text>
        <TouchableOpacity style={eb.btn} onPress={() => this.setState({ hasError: false, message: '' })}>
          <Text style={eb.btnTxt}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const eb = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center', padding: 32 },
  icon:      { fontSize: 48, marginBottom: 16 },
  title:     { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' },
  body:      { fontSize: 13, color: '#9A9A9A', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btn:       { backgroundColor: '#FF6B35', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 9999 },
  btnTxt:    { fontSize: 15, fontWeight: '700', color: '#000' },
});

const navigationRef = createNavigationContainerRef<RootTabParamList>();

// Navigates to Train whenever the user completes auth+onboarding (including after sign-out+re-login).
function NavToTrainAfterAuth() {
  const hasCompletedAuth    = useProfileStore((s) => s.hasCompletedAuth);
  const isOnboardingComplete = useProfileStore((s) => s.isOnboardingComplete);
  const prevReady = useRef(false);

  useEffect(() => {
    const ready = hasCompletedAuth && isOnboardingComplete;
    if (ready && !prevReady.current && navigationRef.isReady()) {
      navigationRef.navigate('Train');
    }
    prevReady.current = ready;
  }, [hasCompletedAuth, isOnboardingComplete]);

  return null;
}

const TAB_ICONS: Record<TabName, { focused: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap }> = {
  Train:    { focused: 'fitness',   outline: 'fitness-outline'   },
  Routines: { focused: 'list',      outline: 'list-outline'      },
  Progress: { focused: 'bar-chart', outline: 'bar-chart-outline' },
  Library:  { focused: 'library',   outline: 'library-outline'   },
  Settings: { focused: 'settings',  outline: 'settings-outline'  },
};


export default function App() {
  return (
    <AppErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SQLiteProvider databaseName="squashghostingx.db" onInit={migrateDatabase}>

          <AuthModal />
          <OnboardingModal />
          <DrillConfigModal />
          <SessionModal />
          <NavToTrainAfterAuth />

          <NavigationContainer ref={navigationRef}>
            <StatusBar style="light" backgroundColor={Colors.background} />
            <Tab.Navigator
              initialRouteName="Train"
              screenOptions={({ route }) => {
                const name = route.name as TabName;
                return {
                  headerShown: false,
                  tabBarActiveTintColor:        Colors.tabActive,
                  tabBarInactiveTintColor:      Colors.tabInactive,
                  tabBarActiveBackgroundColor:  'rgba(255,107,53,0.08)',
                  tabBarStyle: {
                    backgroundColor: Colors.tabBackground,
                    borderTopColor:  Colors.border,
                    borderTopWidth:  0.5,
                    height: 72,
                    paddingTop: 6,
                    paddingBottom: 12,
                  },
                  tabBarLabelStyle: {
                    fontSize:      FontSize.caption,
                    fontWeight:    FontWeight.semiBold,
                    letterSpacing: 0.2,
                    marginTop: 1,
                  },
                  tabBarItemStyle: {
                    borderRadius: 12,
                    marginHorizontal: 2,
                    marginTop: 4,
                  },
                  tabBarIcon: ({ focused, color, size }) => (
                    <Ionicons
                      name={focused ? TAB_ICONS[name].focused : TAB_ICONS[name].outline}
                      size={focused ? size + 1 : size}
                      color={color}
                    />
                  ),
                };
              }}
            >
              <Tab.Screen name="Train"    component={HomeScreen}     options={{ tabBarLabel: 'Train'    }} />
              <Tab.Screen name="Routines" component={RoutinesScreen} options={{ tabBarLabel: 'Routines' }} />
              <Tab.Screen name="Progress" component={ProgressScreen} options={{ tabBarLabel: 'Progress' }} />
              <Tab.Screen name="Library"  component={LibraryScreen}  options={{ tabBarLabel: 'Library'  }} />
              <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
            </Tab.Navigator>
          </NavigationContainer>

        </SQLiteProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}
