import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { recipesApi } from "../../api/recipes";
import { authApi } from "../../api/auth";
import RecipeCard from "../../components/ui/RecipeCard/RecipeCard";
import type { Recipe } from "../../types/recipe";
import styles from './AdminPanel.module.css';

export default function AdminPanel() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const searchQuery = searchParams.get('search') || '';

    useEffect(() => {
        loadRecipes();
    }, []);

    const loadRecipes = async () => {
        try {
            const data = await recipesApi.getAdminRecipes();
            console.log('🔍 RECIPES FROM API:', data);
            console.log('🔍 FIRST RECIPE:', data[0]);
            setRecipes(data);
        } catch (error) {
            console.error('Ошибка загрузки рецептов:', error)
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authApi.logout();
        window.location.href = '/'
    };

    const handleEdit = (id: number) => {
        navigate(`/admin/recipes/${id}/edit`);
    };

    const handleView = (id: number) => {
        window.open(`/recipe/${id}`, '_blank');
    };
    
    const handleDelete = async (id: number) => {
        if (!confirm(`Удалить рецепт "${recipes.find(r => r.id === id)?.title}"?`)) {
            return;
        }

        setDeletingId(id);
        try {
            await recipesApi.deleteRecipe(id);
            setRecipes(recipes.filter(r => r.id !== id));
        } catch (error) {
            alert('Ошибка удаления: ' + error);
        } finally {
            setDeletingId(null);
        }
    };

    const filteredRecipes = recipes.filter(recipe =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.slug.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) return <div className={styles.loading}>Загрузка...</div>;

    return (
        <div className={styles.admin}>
            <header className={styles.header}>
                <h1>🛠️ Управление книгой рецептов</h1>
                <div className={styles.actions}>
                    <button onClick={loadRecipes} className={styles.refreshBtn}>
                        🔄 Обновить
                    </button>
                    <Link to='/admin/recipes/new' className={styles.newBtn}>
                        ➕ Новый рецепт
                    </Link>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        🚪 Выход
                    </button>
                </div>
            </header>

            <div className={styles.search}>
                <input 
                    type="text"
                    placeholder="Поиск по названию и описанию"
                    value={searchQuery}
                    onChange={(e) => setSearchParams({ search: e.target.value })}
                    className={styles.searchInput}
                />
            </div>

            <div className={styles.stats}>
                <div className={styles.stat}>
                    <strong>{recipes.length}</strong> рецептов
                </div>
            </div>

            <div className={styles.table}>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Фото</th>
                            <th>Название</th>
                            <th>Описание</th>
                            <th>Порций</th>
                            <th>Сложность</th>
                            <th>Дата</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecipes.map(recipe => (
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                mode="table"
                                showActions={true}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onView={handleView}
                                deletingId={deletingId}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}