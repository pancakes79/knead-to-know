import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { StarRating } from '../components/StarRating';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';
import { RecipeStackParamList } from '../types';

type RouteType = RouteProp<RecipeStackParamList, 'BakeLogDetail'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function BakeLogDetailScreen() {
  const route = useRoute<RouteType>();
  const nav = useNavigation();
  const { entryId, recipeName, date, rating, notes, photoUrl } = route.params;
  const [photoExpanded, setPhotoExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Bake Entry',
      'Are you sure you want to delete this bake log entry? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteDoc(doc(db, 'bakes', entryId));
              nav.goBack();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete entry.');
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.recipeName}>{recipeName}</Text>
      <Text style={styles.date}>{formattedDate}</Text>

      <View style={styles.ratingRow}>
        <StarRating rating={rating} readonly size={24} />
      </View>

      {photoUrl ? (
        <>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setPhotoExpanded(true)}
          >
            <Image source={{ uri: photoUrl }} style={styles.photo} />
            <Text style={styles.photoHint}>Tap to view full size</Text>
          </TouchableOpacity>

          <Modal
            visible={photoExpanded}
            transparent
            animationType="fade"
            onRequestClose={() => setPhotoExpanded(false)}
          >
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setPhotoExpanded(false)}
            >
              <Image
                source={{ uri: photoUrl }}
                style={styles.modalPhoto}
                resizeMode="contain"
              />
              <Text style={styles.modalHint}>Tap anywhere to close</Text>
            </TouchableOpacity>
          </Modal>
        </>
      ) : null}

      {notes ? (
        <View style={styles.notesCard}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{notes}</Text>
        </View>
      ) : (
        <View style={styles.notesCard}>
          <Text style={styles.noNotes}>No notes for this bake.</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
        onPress={handleDelete}
        disabled={deleting}
      >
        <Text style={styles.deleteButtonText}>
          {deleting ? 'Deleting...' : 'Delete Entry'}
        </Text>
      </TouchableOpacity>

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
    fontSize: 24,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  date: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  ratingRow: {
    marginBottom: spacing.xl,
  },
  photo: {
    width: '100%',
    height: 280,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgSecondary,
    marginBottom: spacing.xs,
  },
  photoHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPhoto: {
    width: screenWidth,
    height: screenHeight * 0.75,
  },
  modalHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: spacing.lg,
  },
  notesCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  notesText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 23,
  },
  noNotes: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  deleteButton: {
    marginTop: spacing.xxl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: '#d44',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: '#d44',
  },
});
