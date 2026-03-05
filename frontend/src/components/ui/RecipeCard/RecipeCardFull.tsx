import type { RecipeFull } from "../../../types/recipe";
import styles from './RecipeCard.module.css';

interface RecipeCardFullProps {
    recipe: RecipeFull;
    showActions?: boolean;
    onEdit?: (id: number) => void;
    className?: string
}

export default function RecipeCardFull({
    recipe,
    showActions = false,
    onEdit,
    className = ''
}: RecipeCardFullProps) {
    const difficultyLabels = {
        easy: '🟢 Легко',
        medium: '🟡 Средне',
        hard: '🔴 Сложно'
    };

    return (
        <div className={`${styles.container} ${styles.full} ${className}`}>
            <header className={styles.header}>
                <h1 className={styles.title}>{recipe.title}</h1>
                <p className={styles.description}>{recipe.description}</p>
            </header>
            <div className={styles.meta}>
                <div className={styles.metaItem}>
                    <span className={styles.metaIcon}>⏱️</span>
                    <span>{recipe.cooking_time || 'Не указано'} мин</span>
                </div>
                <div className={styles.metaItem}>
                    <span className={styles.metaIcon}>👥</span>
                    <span>{recipe.servings || 4} порции</span>
                </div>
                <div className={styles.metaItem}>
                    <span className={styles.metaIcon}>📊</span>
                    <span>{difficultyLabels[recipe.difficulty || 'medium']}</span>
                </div>
                {recipe.categories && recipe.categories.length > 0 && (
                    <div className={styles.metaItem}>
                        <span className={styles.metaIcon}>🏷️</span>
                        <span>{recipe.categories.join(', ')}</span>
                    </div>
                )}
            </div>
            {/* Main Image */}
            {recipe.image_url && (
                <div className={styles.mainImage}>
                    <img 
                        src={recipe.image_url} 
                        alt={recipe.title}
                        loading="lazy"
                    />
                </div>
            )}

            {/* Steps */}
            {recipe.steps && recipe.steps.length > 0 && (
                <section className={styles.steps}>
                    <h2 className={styles.sectionTitle}>📋 Приготовление</h2>
                    <div className={styles.stepsList}>
                        {recipe.steps.map((step, index) => {
                            const stepImage = recipe.images?.[index];

                            return (
                                <div key={step.id || index} className={styles.step}>
                                    <div className={styles.stepNumber}>{index + 1}</div>
                                    <div className={styles.stepContent}>
                                        <div className={styles.stepLayout}>
                                            {stepImage?.image_url && (
                                                <div className={styles.stepImageWrapper}>
                                                    <img 
                                                        src={stepImage.image_url} 
                                                        alt={`Этап ${index + 1}`}
                                                        loading="lazy"
                                                        className={styles.stepImage} 
                                                    />
                                                </div>
                                            )}
                                            <div className={styles.stepText}>
                                                <h3 className={styles.stepTitle}>{step.title}</h3>
                                                <p className={styles.stepDescription}>{step.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}

            {/* Gallery */}
            {recipe.images && recipe.images.length > 0 && (
                <section className={styles.gallery}>
                    <h3 className={styles.sectionTitle}>Фото этапов приготовления</h3>
                    <div className={styles.galleryGrid}>
                        {recipe.images.map((image, index) => (
                            <div key={image.id} className={styles.galleryItem}>
                                <img 
                                    src={image.image_url} 
                                    alt={`Шаг ${index + 1}`}
                                    loading="lazy" 
                                />
                                <span className={styles.galleryLabel}>Шаг {index + 1}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Actions */}
            {showActions && onEdit && (
                <div className={styles.actions}>
                    <button
                        onClick={() => onEdit(recipe.id)}
                        className={styles.editBtn}    
                    >
                        ✏️ Редактировать
                    </button>
                </div>
            )}

            {/* Footer */}
            <footer className={styles.footer}>
                <small>
                    Создан: {new Date(recipe.created_at).toLocaleDateString('ru-RU')}
                    {recipe.updated_at !== recipe.created_at && (
                        <> | Обновлено: {new Date(recipe.updated_at).toLocaleDateString('ru-RU')}</>
                    )}
                </small>
            </footer>
        </div>
    );
}