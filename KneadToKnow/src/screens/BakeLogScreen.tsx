import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useRecipes } from '../hooks/useRecipes';
import { StarRating } from '../components/StarRating';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';
import { RecipeStackParamList, BakeLogEntry } from '../types';

type RouteType = RouteProp<RecipeStackParamList, 'BakeLog'>;

export function BakeLogScreen() {
  const route = useRoute<RouteType>();
  const { getRecipe } = useRecipes();
  const recipe = getRecipe(route.params.recipeId);

  const [entries, setEntries] = useState<BakeLogEntry[]>([]);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load existing bake log entries
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'bakeLogs'),
        where('recipeId', '==', route.params.recipeId),
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
          console.log('Firestore not available for bake logs:', error.message);
        }
      );
      return unsubscribe;
    } catch {
      // Firebase not configured — use local state
    }
  }, [route.params.recipeId]);

  const handlePickPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Camera access is required to take bake photos.');
      return;
    }

    Alert.alert('Add Photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true,
            aspect: [4, 3],
          });
          if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
          }
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true,
            aspect: [4, 3],
          });
          if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  const handleSave = useCallback(async () => {
    if (rating === 0 && !notes.trim()) {
      Alert.alert('Missing Info', 'Please add a rating or some notes about your bake.');
      return;
    }

    setSaving(true);
    try {
      let photoUrl: string | null = null;

      // Upload photo to Firebase Storage if present
      if (photoUri) {
        try {
          const response = await fetch(photoUri);
          const blob = await response.blob();
          const filename = `bake-photos/${route.params.recipeId}/${Date.now()}.jpg`;
          const storageRef = ref(storage, filename);
          await uploadBytes(storageRef, blob);
          photoUrl = await getDownloadURL(storageRef);
        } catch {
          console.log('Photo upload failed — saving without photo');
        }
      }

      // Save to Firestore
      try {
        await addDoc(collection(db, 'bakeLogs'), {
          recipeId: route.params.recipeId,
          date: serverTimestamp(),
          rating,
          notes: notes.trim(),
          photoUrl,
          ambientTempF: null,
          proofingHours: null,
        });
      } catch {
        // Firebase not configured — save locally
        const localEntry: BakeLogEntry = {
          id: `local-${Date.now()}`,
          recipeId: route.params.recipeId,
          date: new Date(),
          rating,
          notes: notes.trim(),
          photoUrl: photoUri,
          ambientTempF: null,
          proofingHours: null,
        };
        setEntries((prev) => [localEntry, ...prev]);
      }

      // Reset form
      setRating(0);
      setNotes('');
      setPhotoUri(null);
      Alert.alert('Saved!', 'Your bake has been logged.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save bake log.');
    } finally {
      setSaving(false);
    }
  }, [rating, notes, photoUri, route.params.recipeId]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Recipe name */}
      {recipe && (
        <Text style={styles.recipeName}>{recipe.name}</Text>
      )}

      {/* New entry form */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Log a Bake</Text>

        {/* Rating */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Rating</Text>
          <StarRating rating={rating} onRate={setRating} size={28} />
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput
            style={styles.textArea}
            placeholder="How did it turn out? What would you change next time?"
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Photo */}
        <View style={styles.field}>
          {photoUri ? (
            <TouchableOpacity onPress={handlePickPhoto}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <Text style={styles.photoChangeText}>Tap to change photo</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto}>
              <Text style={styles.photoButtonIcon}>📸</Text>
              <Text style={styles.photoButtonText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Entry'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Past entries */}
      {entries.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Past Bakes</Text>
          {entries.map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryDate}>
                  {entry.date instanceof Date
                    ? entry.date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Unknown date'}
                </Text>
                <StarRating rating={entry.rating} readonly size={18} />
              </View>
              {entry.notes ? (
                <Text style={styles.entryNotes}>{entry.notes}</Text>
              ) : null}
              {entry.photoUrl ? (
                <Image source={{ uri: entry.photoUrl }} style={styles.entryPhoto} />
              ) : null}
            </View>
          ))}
        </View>
      )}

      {entries.length === 0 && (
        <View style={styles.emptyHistory}>
          <Text style={styles.emptyText}>No bakes logged yet. Rate your next bake above!</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: spacing.xl,
  },
  recipeName: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  formCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  formTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  textArea: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 80,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    backgroundColor: colors.bgCard,
    alignSelf: 'flex-start',
  },
  photoButtonIcon: {
    fontSize: 18,
  },
  photoButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.amber,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgSecondary,
  },
  photoChangeText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.amber,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: '#fff',
  },
  historySection: {
    marginBottom: spacing.lg,
  },
  historyTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.md,
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
  emptyHistory: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
