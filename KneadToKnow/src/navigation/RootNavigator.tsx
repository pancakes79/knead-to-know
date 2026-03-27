import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { colors, fonts } from '../constants/theme';

// Auth screens
import { SignInScreen } from '../screens/SignInScreen';

// App screens
import { RecipeListScreen } from '../screens/RecipeListScreen';
import { RecipeDetailScreen } from '../screens/RecipeDetailScreen';
import { ImportRecipeScreen } from '../screens/ImportRecipeScreen';
import { EditRecipeScreen } from '../screens/EditRecipeScreen';
import { ActiveBakeScreen } from '../screens/ActiveBakeScreen';
import { ProofingScreen } from '../screens/ProofingScreen';
import { BakeLogScreen } from '../screens/BakeLogScreen';
import { BakeCompleteScreen } from '../screens/BakeCompleteScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

// ─── Tab Icons ───

function TabIcon({ label, color, size }: { label: string; color: string; size: number }) {
  const icons: Record<string, string> = {
    Recipes: '📖',
    Proofing: '🌡',
    Bake: '🍞',
    Settings: '⚙',
    Profile: '👤',
  };
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{
        fontSize: size * 0.7,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <View style={{
          width: size - 2,
          height: size - 2,
          borderRadius: (size - 2) / 2,
          borderWidth: 1.5,
          borderColor: color,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: color === colors.amber ? `${colors.cream}` : 'transparent',
        }}>
          <View style={{
            width: size * 0.4,
            height: size * 0.25,
            borderRadius: size * 0.12,
            backgroundColor: color,
          }} />
        </View>
      </View>
    </View>
  );
}

// ─── Navigation Types ───

type RecipeStackParamList = {
  RecipeList: undefined;
  RecipeDetail: { recipeId: string };
  EditRecipe: { recipeId: string };
  ImportRecipe: undefined;
  ActiveBake: { recipeId: string };
  BakeComplete: { recipeId: string };
  BakeLog: { recipeId: string };
};

type RootTabParamList = {
  RecipesTab: undefined;
  ProofingTab: undefined;
  ActiveBakeTab: undefined;
  SettingsTab: undefined;
};

// ─── Recipe Stack ───

const RecipeStack = createNativeStackNavigator<RecipeStackParamList>();

function RecipeStackNavigator() {
  return (
    <RecipeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgPrimary },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontFamily: fonts.bodyBold, fontSize: 18 },
        headerShadowVisible: false,
      }}
    >
      <RecipeStack.Screen name="RecipeList" component={RecipeListScreen} options={{ headerShown: false }} />
      <RecipeStack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: 'Recipe' }} />
      <RecipeStack.Screen name="EditRecipe" component={EditRecipeScreen} options={{ title: 'Edit Recipe' }} />
      <RecipeStack.Screen name="ImportRecipe" component={ImportRecipeScreen} options={{ title: 'Import Recipe', presentation: 'modal' }} />
      <RecipeStack.Screen name="ActiveBake" component={ActiveBakeScreen} options={{ title: 'Active Bake', headerBackTitle: 'Recipe' }} />
      <RecipeStack.Screen name="BakeComplete" component={BakeCompleteScreen} options={{ title: 'Bake Complete', headerShown: false }} />
      <RecipeStack.Screen name="BakeLog" component={BakeLogScreen} options={{ title: 'Bake Log' }} />
    </RecipeStack.Navigator>
  );
}

// ─── Bake Stack ───

type BakeStackParamList = {
  ActiveBakeMain: undefined;
  BakeComplete: { recipeId: string };
  BakeLog: { recipeId: string };
};

const BakeStack = createNativeStackNavigator<BakeStackParamList>();

function BakeStackNavigator() {
  return (
    <BakeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgPrimary },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontFamily: fonts.bodyBold, fontSize: 18 },
        headerShadowVisible: false,
      }}
    >
      <BakeStack.Screen name="ActiveBakeMain" component={ActiveBakeScreen} options={{ title: 'Active Bake' }} />
      <BakeStack.Screen name="BakeComplete" component={BakeCompleteScreen} options={{ headerShown: false }} />
      <BakeStack.Screen name="BakeLog" component={BakeLogScreen} options={{ title: 'Bake Log' }} />
    </BakeStack.Navigator>
  );
}

// ─── Authenticated Tab Navigator ───

const Tab = createBottomTabNavigator<RootTabParamList>();

function AuthenticatedApp() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.bgPrimary,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: fonts.bodySemiBold,
          fontSize: 11,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="RecipesTab"
        component={RecipeStackNavigator}
        options={{
          tabBarLabel: 'Recipes',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIcon}>
              <View style={[styles.tabIconInner, { borderColor: color }]}>
                <View style={[styles.tabIconDot, { backgroundColor: color }]} />
              </View>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ProofingTab"
        component={ProofingScreen}
        options={{
          tabBarLabel: 'Proofing',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIcon}>
              <View style={[styles.tabIconCircle, { borderColor: color }]}>
                <View style={[styles.tabIconHand, { backgroundColor: color }]} />
              </View>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ActiveBakeTab"
        component={BakeStackNavigator}
        options={{
          tabBarLabel: 'Bake',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIcon}>
              <View style={[styles.tabIconSquare, { borderColor: color }]}>
                <View style={[styles.tabIconLoaf, { backgroundColor: color }]} />
              </View>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIcon}>
              <View style={[styles.tabIconCircle, { borderColor: color }]}>
                <View style={[styles.tabIconGear, { backgroundColor: color }]} />
              </View>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Navigator — auth gate ───

const AuthStack = createNativeStackNavigator();

export function RootNavigator() {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.amber} />
      </View>
    );
  }

  // Not authenticated — show sign-in
  if (!user) {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="SignIn" component={SignInScreen} />
      </AuthStack.Navigator>
    );
  }

  // Authenticated — show the app
  return <AuthenticatedApp />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgPrimary,
  },
  tabIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconDot: {
    width: 8,
    height: 5,
    borderRadius: 3,
  },
  tabIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconHand: {
    width: 1.5,
    height: 6,
  },
  tabIconSquare: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 3,
  },
  tabIconLoaf: {
    width: 10,
    height: 6,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  tabIconGear: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
