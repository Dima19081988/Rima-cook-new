import { Link } from "react-router-dom";
import type { Recipe } from "../../../types/recipe";
import styles from "./RecipeCard.module.css";

export interface RecipeCardTableProps {
    recipe: Recipe;
    showActions?: boolean;
    onEdit?: (id: number) => void;
    onDelete?: (id: number) => void;
    onView?: (id: number) => void;
    deletingId?: number | null;
}

export default function RecipeCardTable({
    recipe,
    showActions = true,
    onEdit,
    onDelete,
    onView,
    deletingId
}: RecipeCardTableProps) {
    return (
        <tr className={styles.tableRow}>
            <td>{recipe.id}</td>
            <td className={styles.imageCell}>
                {recipe.image_url ? (
                    <img 
                        src={recipe.image_url} 
                        alt={recipe.title}
                        className={styles.recipeImage}
                        loading="lazy"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : (
                    <div className={styles.noImage}>📷</div>
                )}
            </td>
            <td>{recipe.title}</td>
            <td className={styles.descriptionCell}>
                {recipe.description && recipe.description.length > 50 
                    ? recipe.description.slice(0, 50) + "..." 
                    : recipe.description}
            </td>
            <td>{recipe.servings || '-'}</td>
            <td>{recipe.difficulty || '-'}</td>
            <td>{new Date(recipe.created_at).toLocaleString('ru-RU')}</td>
            <td className={styles.actionsCell}>
                {showActions && (
                    <>
                        {onView && (
                            <Link
                                to={`/recipe/${recipe.id}`}
                                target="_blank"
                                className={styles.viewBtn}
                            >
                                👁️
                            </Link>
                        )}
                        {onEdit && (
                            <button
                                onClick={() => onEdit(recipe.id)}
                                className={styles.editBtn}
                                title="Редактировать"
                            >
                                ✏️
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => onDelete(recipe.id)}
                                disabled={deletingId === recipe.id}  // ← Используйте здесь
                                className={styles.delBtn}
                                title="Удалить"
                            >
                                {deletingId === recipe.id ? '🗑️...' : '🗑️'}
                            </button>
                        )}
                    </>
                )}
            </td>

        </tr>
    )
}