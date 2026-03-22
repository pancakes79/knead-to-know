// ─── Recipe Types ───

export interface Ingredient {
  id: string;
  text: string;
  sortOrder: number;
}

export interface RecipeStep {
  id: string;
  text: string;
  type: 'step' | 'stretch_folds' | 'proof';
  sortOrder: number;
}

export interface Recipe {
  id: string;
  name: string;
  source: string;
  createdAt: Date;
  ingredients: Ingredient[];
  steps: RecipeStep[];
}

// ─── Bake Log Types ───

export interface BakeLogEntry {
  id: string;
  recipeId: string;
  date: Date;
  rating: number; // 1-5
  notes: string;
  photoUrl: string | null;
  ambientTempF: number | null;
  proofingHours: number | null;
}

// ─── Active Bake State ───

export interface ActiveBakeState {
  recipeId: string;
  ingredientChecks: Record<string, boolean>;
  stepChecks: Record<string, boolean>;
  currentStretchFold: number; // 0-4
  ambientTempF: number;
  startedAt: Date | null;
}

// ─── Navigation Types ───

export type RootTabParamList = {
  RecipesTab: undefined;
  ProofingTab: undefined;
  ActiveBakeTab: undefined;
};

export type RecipeStackParamList = {
  RecipeList: undefined;
  RecipeDetail: { recipeId: string };
  ImportRecipe: undefined;
  ActiveBake: { recipeId: string };
  BakeLog: { recipeId: string };
};
