import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';
import { RecipeStackParamList } from '../types';

type RouteType = RouteProp<RecipeStackParamList, 'BakeComplete'>;
type NavType = NativeStackNavigationProp<RecipeStackParamList, 'BakeComplete'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COUNT = 40;
const CONFETTI_COLORS = [
  colors.amber,
  colors.golden,
  '#E8A849',
  '#D4943A',
  colors.cream,
  '#F5DEB3',
  colors.success,
  '#FFD700',
];

interface ConfettiPiece {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  startX: number;
}

export function BakeCompleteScreen() {
  const route = useRoute<RouteType>();
  const nav = useNavigation<NavType>();
  const confetti = useRef<ConfettiPiece[]>([]);
  const fadeIn = useRef(new Animated.Value(0)).current;

  // Initialize confetti pieces
  if (confetti.current.length === 0) {
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const startX = Math.random() * SCREEN_WIDTH;
      confetti.current.push({
        x: new Animated.Value(startX),
        y: new Animated.Value(-20 - Math.random() * 100),
        rotate: new Animated.Value(0),
        opacity: new Animated.Value(1),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 8,
        startX,
      });
    }
  }

  useEffect(() => {
    // Fade in content
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Animate confetti
    const animations = confetti.current.map((piece) => {
      const duration = 2000 + Math.random() * 2000;
      const drift = (Math.random() - 0.5) * 120;

      return Animated.parallel([
        Animated.timing(piece.y, {
          toValue: SCREEN_HEIGHT + 20,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(piece.x, {
          toValue: piece.startX + drift,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(piece.rotate, {
          toValue: 3 + Math.random() * 5,
          duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(duration * 0.7),
          Animated.timing(piece.opacity, {
            toValue: 0,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.stagger(50, animations).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Confetti layer */}
      {confetti.current.map((piece, i) => (
        <Animated.View
          key={i}
          style={[
            styles.confetti,
            {
              width: piece.size,
              height: piece.size * 1.4,
              backgroundColor: piece.color,
              borderRadius: piece.size * 0.2,
              opacity: piece.opacity,
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                {
                  rotate: piece.rotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeIn }]}>
        <Text style={styles.emoji}>🍞</Text>
        <Text style={styles.title}>Bake Complete!</Text>
        <Text style={styles.subtitle}>
          Great job! Would you like to log how this bake turned out?
        </Text>

        <TouchableOpacity
          style={styles.logButton}
          onPress={() => {
            nav.replace('BakeLog', { recipeId: route.params.recipeId });
          }}
        >
          <Text style={styles.logButtonText}>Log This Bake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => nav.popToTop()}
        >
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  confetti: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 32,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxxl,
  },
  logButton: {
    backgroundColor: colors.amber,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xxxl + spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: '#fff',
  },
  skipButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  skipButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textMuted,
  },
});
