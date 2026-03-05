import { Link } from "react-router-dom";
import type { Recipe } from "../../../types/recipe";
import styles from './RecipeCard.module.css'

interface RecipeCardPreviewProps {
    recipe: Recipe;
    onView?: (id: number) => void;
    className?: string;
}

export default function RecipeCardPreview({
    recipe,
    onView,
    className = ''
}: RecipeCardPreviewProps) {
    const difficultyLabels = {
        easy: '🟢 Легко',
        medium: '🟡 Средне',
        hard: '🔴 Сложно'
    }

    return (
        <article className={`${styles.card} ${styles.preview} ${className}`}>
            <Link to={`/recipe/${recipe.id}`} className={styles.cardLink}>
                {recipe.image_url ? (
                    <div className={styles.cardImage}>
                        <img 
                            src={recipe.image_url} 
                            alt={recipe.title}
                            loading="lazy"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }} 
                        />
                    </div>
                ) : (
                    <div className={styles.cardImagePlaceholder}>📷</div>
                )}
                <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>{recipe.title}</h3>
                    {recipe.description && (
                        <p className={styles.cardDescription}>
                            {recipe.description.length > 100
                            ? recipe.description.slice(0, 100) + '...'
                            : recipe.description}
                        </p>
                    )}
                    <div className={styles.cardMeta}>
                        {recipe.cooking_time && (
                            <span className={styles.metaItem}>
                                ⏱️ {recipe.cooking_time} мин
                            </span>
                        )}
                        {recipe.servings && (
                            <span className={styles.metaItem}>
                                👥 {recipe.servings} порц.
                            </span>
                        )}
                        {recipe.difficulty && (
                            <span className={styles.metaItem}>
                                {difficultyLabels[recipe.difficulty]}
                            </span>
                        )}
                    </div>
                </div>
            </Link>

            {onView && (
                <button
                    onClick={() => onView(recipe.id)}
                    className={styles.viewBtn}
                >
                    👁️ Просмотр
                </button>
            )}
        </article>
    );
}