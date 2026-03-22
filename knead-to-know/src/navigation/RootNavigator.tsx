import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { colors, fonts } from '../constants/theme';
import { RootTabParamList, RecipeStackParamList } from '../types';

// Screens
import { RecipeListScreen } from '../screens/RecipeListScreen';
import { RecipeDetailScreen } from '../screens/RecipeDetailScreen';
import { ImportRecipeScreen } from '../screens/ImportRecipeScreen';
import { ActiveBakeScreen } from '../screens/ActiveBakeScreen';
import { ProofingScreen } from '../screens/ProofingScreen';
import { BakeLogScreen } from '../screens/BakeLogScreen';

// ─── Tab Icons (simple SVG-like components) ───

function BreadIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color === colors.amber ? colors.cream : 'transparent',
      borderWidth: 1.5,
      borderColor: color,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <View style={{
        width: size * 0.4,
        height: size * 0.25,
        borderRadius: size * 0.15,
        backgroundColor: color,
      }} />
    </View>
  );
}

function TimerIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 1.5,
      borderColor: color,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <View style={{
        width: 1.5,
        height: size * 0.25,
        backgroundColor: color,
        position: 'absolute',
        top: size * 0.2,
      }} />
      <View style={{
        width: size * 0.2,
        height: 1.5,
        backgroundColor: color,
        position: 'absolute',
        right: size * 0.2,
      }} />
    </View>
  );
}

function BakeIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: color,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: 3,
    }}>
      <View style={{
        width: size * 0.5,
        height: size * 0.3,
        borderTopLeftRadius: size * 0.25,
        borderTopRightRadius: size * 0.25,
        backgroundColor: color,
      }} />
    </View>
  );
}

// ─── Recipe Stack Navigator ───

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
      <RecipeStack.Screen
        name="RecipeList"
        component={RecipeListScreen}
        options={{ headerShown: false }}
      />
      <RecipeStack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{ title: 'Recipe' }}
      />
      <RecipeStack.Screen
        name="ImportRecipe"
        component={ImportRecipeScreen}
        options={{ title: 'Import Recipe', presentation: 'modal' }}
      />
      <RecipeStack.Screen
        name="ActiveBake"
        component={ActiveBakeScreen}
        options={{ title: 'Active Bake', headerBackTitle: 'Recipe' }}
      />
      <RecipeStack.Screen
        name="BakeLog"
        component={BakeLogScreen}
        options={{ title: 'Bake Log' }}
      />
    </RecipeStack.Navigator>
  );
}

// ─── Root Tab Navigator ───

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootNavigator() {
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
          tabBarIcon: ({ color, size }) => <BreadIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ProofingTab"
        component={ProofingScreen}
        options={{
          tabBarLabel: 'Proofing',
          tabBarIcon: ({ color, size }) => <TimerIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ActiveBakeTab"
        component={ActiveBakeScreen}
        options={{
          tabBarLabel: 'Active Bake',
          tabBarIcon: ({ color, size }) => <BakeIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
