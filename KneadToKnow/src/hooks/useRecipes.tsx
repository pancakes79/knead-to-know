import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './useAuth';
import { Recipe } from '../types';

// ─── Context ───

interface RecipeContextValue {
  recipes: Recipe[];
  communityRecipes: Recipe[];
  loading: boolean;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'visibility' | 'totalBakes'>) => Promise<string>;
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  getRecipe: (id: string) => Recipe | undefined;
  saveToMyRecipes: (recipe: Recipe) => Promise<string>;
}

const RecipeContext = createContext<RecipeContextValue | null>(null);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>(SAMPLE_RECIPES);
  const [loading, setLoading] = useState(false);
  const useFirebaseRef = React.useRef(false);

  // Listen for the current user's recipes
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
      return;
    }

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
    (id: string) => recipes.find((r) => r.id === id) || communityRecipes.find((r) => r.id === id),
    [recipes, communityRecipes]
  );

  // Copy a community recipe to the current user's collection
  const saveToMyRecipes = useCallback(async (recipe: Recipe) => {
    if (!user) throw new Error('Must be signed in');
    const { id, ownerId, ownerName, visibility, createdAt, updatedAt, totalBakes, ...recipeData } = recipe;
    const docRef = await addDoc(collection(db, 'recipes'), {
      ...recipeData,
      ownerId: user.uid,
      ownerName: user.displayName || user.email || 'Anonymous Baker',
      visibility: 'private',
      totalBakes: 0,
      forkedFrom: id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }, [user]);

  return (
    <RecipeContext.Provider value={{
      recipes,
      communityRecipes,
      loading,
      addRecipe,
      updateRecipe,
      deleteRecipe,
      getRecipe,
      saveToMyRecipes,
    }}>
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipes() {
  const ctx = useContext(RecipeContext);
  if (!ctx) throw new Error('useRecipes must be used within RecipeProvider');
  return ctx;
}
