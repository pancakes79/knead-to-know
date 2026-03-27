import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SectionList,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { useRecipes } from '../hooks/useRecipes';
import { StarRating } from '../components/StarRating';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';
import { BakeLogEntry, RecipeStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RecipeStackParamList>;

interface BakeLogSection {
  recipeId: string;
  recipeName: string;
  data: BakeLogEntry[];
}

export function GlobalBakeLogScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { user } = useAuth();
  const { recipes } = useRecipes();
  const [entries, setEntries] = useState<BakeLogEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'bakes'),
        where('ownerId', '==', user.uid),
        orderBy('date', 'desc')
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const logs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate() || new Date(),
          })) as BakeLogEntry[];
          setEntries(logs);
        },
        (error) => {
          console.log('Firestore error (global bake log):', error.message);
        }
      );
      return unsubscribe;
    } catch {
      // Firebase not configured
    }
  }, [user?.uid]);

  // Group entries by recipe
  const sections: BakeLogSection[] = [];
  const grouped = new Map<string, BakeLogEntry[]>();

  for (const entry of entries) {
    const existing = grouped.get(entry.recipeId);
    if (existing) {
      existing.push(entry);
    } else {
      grouped.set(entry.recipeId, [entry]);
    }
  }

  for (const [recipeId, data] of grouped) {
    const recipe = recipes.find((r) => r.id === recipeId);
    sections.push({
      recipeId,
      recipeName: recipe?.name || 'Unknown Recipe',
      data,
    });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Bake Log</Text>
        <Text style={styles.subtitle}>Your baking history across all recipes</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => {
          const s = section as BakeLogSection;
          return (
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => nav.navigate('RecipeDetail', { recipeId: s.recipeId })}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>{s.recipeName}</Text>
              <Text style={styles.sectionCount}>
                {s.data.length} bake{s.data.length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          );
        }}
        renderItem={({ item }) => (
          <View style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryDate}>
                {item.date instanceof Date
                  ? item.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Unknown date'}
              </Text>
              <StarRating rating={item.rating} readonly size={16} />
            </View>
            {item.notes ? (
              <Text style={styles.entryNotes}>{item.notes}</Text>
            ) : null}
            {item.photoUrl ? (
              <Image source={{ uri: item.photoUrl }} style={styles.entryPhoto} />
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No Bakes Logged Yet</Text>
            <Text style={styles.emptyText}>
              After you finish a bake, log your results to track your progress over time.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.textPrimary,
    flex: 1,
  },
  sectionCount: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  entryCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm + 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  entryDate: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  entryNotes: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  entryPhoto: {
    width: '100%',
    height: 160,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
    backgroundColor: colors.bgSecondary,
  },
  empty: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
