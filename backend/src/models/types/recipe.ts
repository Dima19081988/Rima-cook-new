export interface Recipe {
    id: number;
    title: string;
    slug: string;
    description?: string;
    image_url?: string;
    cooking_time?: string;
    servings?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    created_at: Date;
    updated_at: Date;
    categories?: string[];
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    color: string;
    created_at: Date;
}

export interface HomeData {
    popular: Recipe[];
    category: CategoryPreview[];
}

export interface CategoryPreview {
    id: number;
    name: string;
    slug: string;
    color: string;
    recipe_ids: number[];
}