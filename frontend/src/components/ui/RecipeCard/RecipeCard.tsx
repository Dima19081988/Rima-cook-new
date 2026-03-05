import type { Recipe, RecipeFull } from "../../../types/recipe";
import RecipeCardTable from "./RecipeCardTable";
import RecipeCardFull from "./RecipeCardFull";
import RecipeCardPreview from "./RecipeCardPreview";

export type RecipeCardMode = 'preview' | 'full' | 'table';

export interface RecipeCardProps {
    recipe: Recipe | RecipeFull;
    mode?: RecipeCardMode;
    showActions?: boolean;
    onView?: (id: number) => void;
    onEdit?: (id: number) => void;
    onDelete?: (id: number) => void;
    deletingId?: number | null;
    className?: string;
}

export default function RecipeCard({
    recipe,
    mode = 'preview',
    showActions = false,
    onView,
    onEdit,
    onDelete,
    deletingId,
    className = ''
}: RecipeCardProps) {
    console.log('🔄 RecipeCard render, mode:', mode, 'recipe:', recipe);
    switch (mode) {
        case 'full':
            return (
                <RecipeCardFull
                    recipe={recipe as RecipeFull}
                    showActions={showActions}
                    onEdit={onEdit}
                    className={className}
                />
            );
        case 'table':
            return (
                <RecipeCardTable
                    recipe={recipe}
                    showActions={showActions}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onView={onView}
                    deletingId={deletingId}
                />
            );
        case 'preview':
            return (
                <RecipeCardPreview
                    recipe={recipe}
                    onView={onView}
                    className={className}
                />
            );
    }
}