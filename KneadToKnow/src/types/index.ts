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
  timerSeconds?: number;
}

export interface Equipment {
  id: string;
  text: string;
  sortOrder: number;
}

export interface Recipe {
  id: string;
  name: string;
  source: string;
  ownerId: string;
  ownerName?: string;
  visibility: 'private' | 'shared';
  createdAt: Date;
  updatedAt?: Date;
  totalBakes: number;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  equipment?: Equipment[];
}

// ─── Bake Log Types ───

export interface BakeLogEntry {
  id: string;
  recipeId: string;
  recipeName?: string;
  ownerId: string;
  date: Date;
  rating: number; // 0-5
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
  ActiveBakeTab: undefined;
  BakeLogTab: undefined;
  ResourcesTab: undefined;
  SettingsTab: undefined;
  ProfileTab: undefined;
};

export type RecipeStackParamList = {
  RecipeList: undefined;
  RecipeDetail: { recipeId: string };
  EditRecipe: { recipeId: string };
  ImportRecipe: undefined;
  ActiveBake: { recipeId: string };
  BakeComplete: { recipeId: string };
  BakeLog: { recipeId: string };
  BakeLogDetail: {
    entryId: string;
    recipeId: string;
    recipeName: string;
    date: string;
    rating: number;
    notes: string;
    photoUrl: string | null;
  };
};
