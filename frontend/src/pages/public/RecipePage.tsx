import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { recipesApi } from "../../api/recipes";
import RecipeCard from "../../components/ui/RecipeCard/RecipeCard";
import type { RecipeFull } from "../../types/recipe";
import styles from './RecipePage.module.css';

export default function RecipeCardPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState<RecipeFull | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;

        const loadRecipe = async () => {
            try {
                const data = await recipesApi.getRecipeById(Number(id));
                setRecipe(data);
            } catch (error) {
                setError('Ошибка загрузки рецепта');
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        loadRecipe();
    }, [id]);

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}>🍳 Загрузка рецепта...</div>
            </div>
        );
    }

    if (error || !recipe) {
        return (
            <div className={styles.error}>
                <h2>😕 {error || 'Рецерт не найден'}</h2>
                <Link to='/' className={styles.backBtn}>← На главную</Link>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <button onClick={() => navigate('/admin')} className={styles.backBtn}>
                ← Назад к списку рецептов
            </button>
            <RecipeCard
                recipe={recipe}
                mode="full"
                showActions={false}
            />
        </div>
    );
}