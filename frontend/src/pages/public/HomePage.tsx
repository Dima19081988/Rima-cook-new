import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { recipesApi } from "../../api/recipes";
import type { HomeData } from "../../types/recipe";
import RecipeCard from "../../components/ui/RecipeCard/RecipeCard";
import styles from './HomePage.module.css';

export default function HomePage() {
    const [data, setData] = useState<HomeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');


    useEffect(() => {
        recipesApi.getHome()
            .then(setData)
            .catch(() => setError('Ошибка загрузки рецептов'))
            .finally(() => setLoading(false))
    }, []);


    if (!data) return <div>Нет данных</div>;
    if (loading) return <div className={styles.loading}>🍳 Загрузка рецептов...</div>
    if (error) return <div className={styles.error}>{error}</div>

    return (
        <div className={styles.home}>
            <header className={styles.header}>
                <h1>🍳 Моя Кухня - мой Мир</h1>
                <Link
                    to={'/admin/login'}
                    className={styles.adminBtn}
                    title="Панель администратора"
                >
                    🛠️ Хозяйский Вход
                </Link>
            </header>
            <section className={styles.popular}>
                <h1>🍴 Популярные рецепты ({data.popular.length})</h1>
                <div className={styles.grid}>
                    {data.popular.map(recipe => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            mode="preview"
                        />
                    ))}
                </div>
            </section>
            <section className={styles.categories}>
                    <h2>Категории</h2>
                    <div className={styles.categoryGrid}>
                        {data.categories.map(category => (
                            <Link
                                key={category.id}
                                to={`/category/${category.slug}`}
                                className={styles.category}
                                style={{ '--cat-color': category.color } as React.CSSProperties}
                            >
                                {category.name}
                                <small>({category.recipe_ids.length} рецептов)</small>
                            </Link>
                        ))}
                    </div>
            </section>
        </div>
    );
}