import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
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
import ResumePromptModal from './src/screens/session/ResumePromptModal';

import { Colors } from './src/constants/colors';
import { FontSize, FontWeight } from './src/constants/layout';
import { migrateDatabase } from './src/db/schema';
import { getCheckpoint } from './src/db/queries';
import { useSessionStore } from './src/stores/sessionStore';
import { useProfileStore } from './src/stores/profileStore';
import { RootTabParamList } from './src/types';
import { RESUME_MAX_AGE_HOURS } from './src/constants/timing';

const Tab = createBottomTabNavigator<RootTabParamList>();
type TabName = keyof RootTabParamList;

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

function StartupCheckpointChecker() {
  const db = useSQLiteContext() as any;
  const { setPendingCheckpoint } = useSessionStore();

  useEffect(() => {
    async function check() {
      try {
        const cp = await getCheckpoint(db);
        if (!cp) return;
        const ageHours = (Date.now() - new Date(cp.savedAt).getTime()) / 3_600_000;
        if (ageHours < RESUME_MAX_AGE_HOURS) setPendingCheckpoint(cp);
      } catch {}
    }
    check();
  }, []);

  return null;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SQLiteProvider databaseName="squashghostingx.db" onInit={migrateDatabase}>

          <AuthModal />
          <OnboardingModal />
          <DrillConfigModal />
          <SessionModal />
          <ResumePromptModal />
          <StartupCheckpointChecker />
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
  );
}
