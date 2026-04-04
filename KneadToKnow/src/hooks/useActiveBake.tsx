import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ActiveBake {
  id: string;
  recipeId: string;
  recipeName: string;
  startedAt: Date;
  ingredientChecks: Record<string, boolean>;
  equipmentChecks: Record<string, boolean>;
  stepChecks: Record<string, boolean>;
  loafCount: number;
}

interface ActiveBakeContextValue {
  activeBakes: ActiveBake[];
  selectedBakeId: string | null;
  selectedBake: ActiveBake | null;
  startBake: (recipeId: string, recipeName: string) => string;
  endBake: (bakeId: string) => void;
  selectBake: (bakeId: string) => void;
  toggleIngredient: (bakeId: string, ingredientId: string) => void;
  toggleEquipment: (bakeId: string, equipmentId: string) => void;
  toggleStep: (bakeId: string, stepId: string) => void;
  setLoafCount: (bakeId: string, count: number) => void;
}

const ActiveBakeContext = createContext<ActiveBakeContextValue | null>(null);

let nextBakeId = 1;

export function ActiveBakeProvider({ children }: { children: React.ReactNode }) {
  const [activeBakes, setActiveBakes] = useState<ActiveBake[]>([]);
  const [selectedBakeId, setSelectedBakeId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false); // To prevent flashing empty state

  // 1. Load saved bakes on mount
  useEffect(() => {
    AsyncStorage.getItem('@kneadtoknow_active_bakes').then((data) => {
      if (data) {
        // Note: JSON.parse converts dates to strings, so we map them back to Date objects
        const parsed = JSON.parse(data).map((b: any) => ({
          ...b,
          startedAt: new Date(b.startedAt)
        }));
        setActiveBakes(parsed);
      
        // Auto-select the first one if it exists
        if (parsed.length > 0) setSelectedBakeId(parsed[0].id);
      }
      setIsHydrated(true);
    });
  }, []);

  // 2. Save bakes whenever they change (only after initial load)
  useEffect(() => {
    if (isHydrated) {
      AsyncStorage.setItem('@kneadtoknow_active_bakes', JSON.stringify(activeBakes));
    }
  }, [activeBakes, isHydrated]);

  const selectedBake = activeBakes.find((b) => b.id === selectedBakeId) || null;

  const startBake = useCallback((recipeId: string, recipeName: string) => {
    // Generate a unique ID based on the exact millisecond the bake started
    const id = `bake-${Date.now()}`;
    const bake: ActiveBake = {
      id,
      recipeId,
      recipeName,
      startedAt: new Date(),
      ingredientChecks: {},
      equipmentChecks: {},
      stepChecks: {},
      loafCount: 1,
    };
    setActiveBakes((prev) => [...prev, bake]);
    setSelectedBakeId(id);
    return id;
  }, []);

  const endBake = useCallback((bakeId: string) => {
    setActiveBakes((prev) => prev.filter((b) => b.id !== bakeId));
    setSelectedBakeId((prev) => prev === bakeId ? null : prev);
  }, []);

  const selectBake = useCallback((bakeId: string) => {
    setSelectedBakeId(bakeId);
  }, []);

  const toggleIngredient = useCallback((bakeId: string, ingredientId: string) => {
    setActiveBakes((prev) =>
      prev.map((b) =>
        b.id === bakeId
          ? { ...b, ingredientChecks: { ...b.ingredientChecks, [ingredientId]: !b.ingredientChecks[ingredientId] } }
          : b
      )
    );
  }, []);

  const toggleEquipment = useCallback((bakeId: string, equipmentId: string) => {
    setActiveBakes((prev) =>
      prev.map((b) =>
        b.id === bakeId
          ? { ...b, equipmentChecks: { ...b.equipmentChecks, [equipmentId]: !b.equipmentChecks[equipmentId] } }
          : b
      )
    );
  }, []);

  const setLoafCount = useCallback((bakeId: string, count: number) => {
    setActiveBakes((prev) =>
      prev.map((b) =>
        b.id === bakeId ? { ...b, loafCount: Math.max(1, Math.min(10, count)) } : b
      )
    );
  }, []);

  const toggleStep = useCallback((bakeId: string, stepId: string) => {
    setActiveBakes((prev) =>
      prev.map((b) =>
        b.id === bakeId
          ? { ...b, stepChecks: { ...b.stepChecks, [stepId]: !b.stepChecks[stepId] } }
          : b
      )
    );
  }, []);

  return (
    <ActiveBakeContext.Provider value={{
      activeBakes,
      selectedBakeId,
      selectedBake,
      startBake,
      endBake,
      selectBake,
      toggleIngredient,
      toggleEquipment,
      toggleStep,
      setLoafCount,
    }}>
      {children}
    </ActiveBakeContext.Provider>
  );
}

export function useActiveBake() {
  const ctx = useContext(ActiveBakeContext);
  if (!ctx) throw new Error('useActiveBake must be used within ActiveBakeProvider');
  return ctx;
}
