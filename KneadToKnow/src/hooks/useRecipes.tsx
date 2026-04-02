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
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [communityRecipes, setCommunityRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  // Listen for the current user's recipes
  useEffect(() => {
    if (!user) {
      setRecipes([]);
      setCommunityRecipes([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const myQuery = query(
      collection(db, 'recipes'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      myQuery,
      (snapshot) => {
        const myRecipes = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate() || new Date(),
          updatedAt: d.data().updatedAt?.toDate() || undefined,
        })) as Recipe[];
        setRecipes(myRecipes);
        setLoading(false);
      },
      (error) => {
        console.log('Firestore error (my recipes):', error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  // Listen for community (shared) recipes
  useEffect(() => {
    if (!user) return;

    const communityQuery = query(
      collection(db, 'recipes'),
      where('visibility', '==', 'shared'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      communityQuery,
      (snapshot) => {
        const shared = snapshot.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate() || new Date(),
            updatedAt: d.data().updatedAt?.toDate() || undefined,
          })) as Recipe[];
        // Exclude own recipes from community list
        setCommunityRecipes(shared.filter((r) => r.ownerId !== user.uid));
      },
      (error) => {
        console.log('Firestore error (community recipes):', error.message);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  const addRecipe = useCallback(async (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'ownerName' | 'visibility' | 'totalBakes'>) => {
    if (!user) throw new Error('Must be signed in to add recipes');
    const docRef = await addDoc(collection(db, 'recipes'), {
      ...recipe,
      ownerId: user.uid,
      ownerName: user.displayName || user.email || 'Anonymous Baker',
      visibility: 'private',
      totalBakes: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }, [user]);

  const updateRecipe = useCallback(async (id: string, updates: Partial<Recipe>) => {
    await updateDoc(doc(db, 'recipes', id), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }, []);

  const deleteRecipe = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'recipes', id));
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
