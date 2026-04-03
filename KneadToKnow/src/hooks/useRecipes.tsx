import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Recipe, Ingredient, RecipeStep } from '../types';

// ─── Sample data (used when Firebase is not configured) ───

const SAMPLE_RECIPES: Recipe[] = [
  {
    id: 'sample-1',
    name: 'Classic Sourdough Boule',
    source: 'The Sourdough Journey',
    createdAt: new Date(),
    ingredients: [
      { id: 'i1', text: '500g bread flour', sortOrder: 0 },
      { id: 'i2', text: '350g water (70% hydration)', sortOrder: 1 },
      { id: 'i3', text: '100g active starter', sortOrder: 2 },
      { id: 'i4', text: '10g fine sea salt', sortOrder: 3 },
    ],
    steps: [
      { id: 's1', text: 'Mix flour and water. Autolyse for 30 minutes.', type: 'step', sortOrder: 0 },
      { id: 's2', text: 'Add starter and salt. Mix until well incorporated.', type: 'step', sortOrder: 1 },
      { id: 'sf', text: 'Bulk fermentation — Stretch & Folds (4 sets, 30 min apart)', type: 'stretch_folds', sortOrder: 2 },
      { id: 's3', text: 'Continue bulk proof until dough has risen per proofing guide.', type: 'proof', sortOrder: 3 },
      { id: 's4', text: 'Pre-shape the dough into a round. Rest 20 minutes.', type: 'step', sortOrder: 4 },
      { id: 's5', text: 'Final shape into a boule and place in banneton.', type: 'step', sortOrder: 5 },
      { id: 's6', text: 'Cold retard in fridge for 8–16 hours.', type: 'step', sortOrder: 6 },
      { id: 's7', text: 'Preheat Dutch oven to 500°F (260°C) for 1 hour.', type: 'step', sortOrder: 7 },
      { id: 's8', text: 'Score and bake covered 20 min, then uncovered at 450°F for 20–25 min.', type: 'step', sortOrder: 8 },
      { id: 's9', text: 'Cool on wire rack for at least 1 hour before slicing.', type: 'step', sortOrder: 9 },
    ],
  },
  {
    id: 'sample-2',
    name: 'Sourdough Sandwich Loaf',
    source: 'Homemade',
    createdAt: new Date(),
    ingredients: [
      { id: 'i1', text: '450g bread flour', sortOrder: 0 },
      { id: 'i2', text: '50g whole wheat flour', sortOrder: 1 },
      { id: 'i3', text: '300g water', sortOrder: 2 },
      { id: 'i4', text: '100g active starter', sortOrder: 3 },
      { id: 'i5', text: '30g honey', sortOrder: 4 },
      { id: 'i6', text: '30g butter, softened', sortOrder: 5 },
      { id: 'i7', text: '10g salt', sortOrder: 6 },
    ],
    steps: [
      { id: 's1', text: 'Combine flour, water, and honey. Autolyse 30 min.', type: 'step', sortOrder: 0 },
      { id: 's2', text: 'Add starter, salt, and butter. Knead until smooth.', type: 'step', sortOrder: 1 },
      { id: 'sf', text: 'Bulk fermentation — Stretch & Folds (4 sets, 30 min apart)', type: 'stretch_folds', sortOrder: 2 },
      { id: 's3', text: 'Bulk proof until doubled.', type: 'proof', sortOrder: 3 },
      { id: 's4', text: 'Shape into a log and place in greased loaf pan.', type: 'step', sortOrder: 4 },
      { id: 's5', text: 'Proof until dough crests 1 inch above pan rim.', type: 'step', sortOrder: 5 },
      { id: 's6', text: 'Bake at 375°F (190°C) for 35–40 minutes.', type: 'step', sortOrder: 6 },
      { id: 's7', text: 'Cool completely before slicing.', type: 'step', sortOrder: 7 },
    ],
  },
];

// ─── Context ───

interface RecipeContextValue {
  recipes: Recipe[];
  loading: boolean;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => Promise<string>;
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  getRecipe: (id: string) => Recipe | undefined;
}

const RecipeContext = createContext<RecipeContextValue | null>(null);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>(SAMPLE_RECIPES);
  const [loading, setLoading] = useState(false);
  const useFirebaseRef = React.useRef(false);

  // Try to connect to Firestore — fall back to sample data if not configured
  useEffect(() => {
    try {
      const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const firebaseRecipes = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          })) as Recipe[];

          if (firebaseRecipes.length > 0 || useFirebaseRef.current) {
            setRecipes(firebaseRecipes);
            useFirebaseRef.current = true;
          }
          setLoading(false);
        },
        (error) => {
          console.log('Firestore not configured, using sample data:', error.message);
          setLoading(false);
        }
      );
      return unsubscribe;
    } catch (e) {
      console.log('Firebase not initialized, using sample data');
      setLoading(false);
    }
  }, []);

  const addRecipe = useCallback(async (recipe: Omit<Recipe, 'id' | 'createdAt'>) => {
    if (useFirebaseRef.current) {
      const docRef = await addDoc(collection(db, 'recipes'), {
        ...recipe,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } else {
      // Local mode
      const newRecipe: Recipe = {
        ...recipe,
        id: `local-${Date.now()}`,
        createdAt: new Date(),
      };
      setRecipes((prev) => [newRecipe, ...prev]);
      return newRecipe.id;
    }
  }, []);

  const updateRecipe = useCallback(async (id: string, updates: Partial<Recipe>) => {
    if (useFirebaseRef.current) {
      await updateDoc(doc(db, 'recipes', id), updates);
    } else {
      setRecipes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
      );
    }
  }, []);

  const deleteRecipe = useCallback(async (id: string) => {
    if (useFirebaseRef.current) {
      await deleteDoc(doc(db, 'recipes', id));
    } else {
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    }
  }, []);

  const getRecipe = useCallback(
    (id: string) => recipes.find((r) => r.id === id),
    [recipes]
  );

  return (
    <RecipeContext.Provider value={{ recipes, loading, addRecipe, updateRecipe, deleteRecipe, getRecipe }}>
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipes() {
  const ctx = useContext(RecipeContext);
  if (!ctx) throw new Error('useRecipes must be used within RecipeProvider');
  return ctx;
}
