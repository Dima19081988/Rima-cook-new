export interface Recipe {
    id: number;
    title: string;
    slug: string;
    description?: string;
    image_url?: string;
    cooking_time?: string;
    servings?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    created_at: string;
    updated_at: string;
    categories?: string[];
    category_ids?: number[];
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    color: string;
    created_at: Date;
}

export interface CategoryPreview {
    id: number;
    name: string;
    slug: string;
    color: string;
    recipe_ids: number[];
}

export interface HomeData {
    popular: Recipe[];
    categories: CategoryPreview[];
}

export interface CreateRecipeData {
    title: string;
    slug: string;
    description?: string;
    cooking_time?: string;
    servings?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    category_ids?: number[];
    image_url?: string;
}

export interface UpdateRecipeData {
    title: string;
    description?: string;
    cooking_time?: string;
    servings?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    category_ids?: number[];
    image_url?: string;
    steps?: string;
}

export interface RecipeImage {
    id: number;
    recipe_id: number;
    image_url: string;
    sort_order: number;
    created_at: string;
}

export interface RecipeFull extends Recipe {
    images: RecipeImage[];
    steps: RecipeStep[];
    category_ids?: number[];
    image_count?: number;
}

export interface CreateRecipeResponse {
    data: {
        message: string;
        recipe: Recipe;
    };
    status: number;
    statusText: string;
}

export interface RecipeStep {
    id?: number;
    title: string;
    description: string;
    image_url?: string;
    sort_order?: number;
}

