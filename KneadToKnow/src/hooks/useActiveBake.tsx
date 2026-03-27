import React, { createContext, useContext, useState, useCallback } from 'react';

interface ActiveBake {
  recipeId: string;
  recipeName: string;
  startedAt: Date;
  ingredientChecks: Record<string, boolean>;
  stepChecks: Record<string, boolean>;
}

interface ActiveBakeContextValue {
  activeBake: ActiveBake | null;
  startBake: (recipeId: string, recipeName: string) => void;
  endBake: () => void;
  toggleIngredient: (id: string) => void;
  toggleStep: (id: string) => void;
}

const ActiveBakeContext = createContext<ActiveBakeContextValue | null>(null);

export function ActiveBakeProvider({ children }: { children: React.ReactNode }) {
  const [activeBake, setActiveBake] = useState<ActiveBake | null>(null);

  const startBake = useCallback((recipeId: string, recipeName: string) => {
    setActiveBake({
      recipeId,
      recipeName,
      startedAt: new Date(),
      ingredientChecks: {},
      stepChecks: {},
    });
  }, []);

  const endBake = useCallback(() => {
    setActiveBake(null);
  }, []);

  const toggleIngredient = useCallback((id: string) => {
    setActiveBake((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ingredientChecks: { ...prev.ingredientChecks, [id]: !prev.ingredientChecks[id] },
      };
    });
  }, []);

  const toggleStep = useCallback((id: string) => {
    setActiveBake((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        stepChecks: { ...prev.stepChecks, [id]: !prev.stepChecks[id] },
      };
    });
  }, []);

  return (
    <ActiveBakeContext.Provider value={{ activeBake, startBake, endBake, toggleIngredient, toggleStep }}>
      {children}
    </ActiveBakeContext.Provider>
  );
}

export function useActiveBake() {
  const ctx = useContext(ActiveBakeContext);
  if (!ctx) throw new Error('useActiveBake must be used within ActiveBakeProvider');
  return ctx;
}
