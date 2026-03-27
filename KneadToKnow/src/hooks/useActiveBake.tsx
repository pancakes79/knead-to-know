import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ActiveBake {
  id: string;
  recipeId: string;
  recipeName: string;
  startedAt: Date;
  ingredientChecks: Record<string, boolean>;
  stepChecks: Record<string, boolean>;
}

interface ActiveBakeContextValue {
  activeBakes: ActiveBake[];
  selectedBakeId: string | null;
  selectedBake: ActiveBake | null;
  startBake: (recipeId: string, recipeName: string) => string;
  endBake: (bakeId: string) => void;
  selectBake: (bakeId: string) => void;
  toggleIngredient: (bakeId: string, ingredientId: string) => void;
  toggleStep: (bakeId: string, stepId: string) => void;
}

const ActiveBakeContext = createContext<ActiveBakeContextValue | null>(null);

let nextBakeId = 1;

export function ActiveBakeProvider({ children }: { children: React.ReactNode }) {
  const [activeBakes, setActiveBakes] = useState<ActiveBake[]>([]);
  const [selectedBakeId, setSelectedBakeId] = useState<string | null>(null);

  const selectedBake = activeBakes.find((b) => b.id === selectedBakeId) || null;

  const startBake = useCallback((recipeId: string, recipeName: string) => {
    const id = `bake-${nextBakeId++}`;
    const bake: ActiveBake = {
      id,
      recipeId,
      recipeName,
      startedAt: new Date(),
      ingredientChecks: {},
      stepChecks: {},
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
      toggleStep,
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
