import axios from "axios";
import type { Recipe, HomeData, CreateRecipeData, UpdateRecipeData, RecipeFull } from "../types/recipe";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    withCredentials: true
});

export const recipesApi = {
    // ✅ Публичные API 
    getRecipes: (): Promise<Recipe[]> => api.get('/recipes').then(res => res.data),
    getHome: (): Promise<HomeData> => api.get('/home').then(res => res.data),
    getAdminCategories: (): Promise<{id: number, name: string}[]> => 
        api.get('/admin/categories').then(res => res.data),
    getRecipeById: (id: number): Promise<RecipeFull> =>
        api.get(`/recipes/${id}`).then(res => res.data),

    // ✅ Админские API
    getAdminRecipes: (): Promise<Recipe[]> =>
        api.get('/admin/recipes').then(res => res.data),
    getAdminRecipeById: (id: number): Promise<RecipeFull> =>
        api.get(`/admin/recipes/${id}`).then(res => res.data),
    updateRecipe: (id: number, data: UpdateRecipeData |FormData): Promise<void> =>
        api.put(`/admin/recipes/${id}`, data, {
            headers: { "Content-Type": 'multipart/form-data' }
        }).then(res => res.data.recipe),
    deleteRecipe: (id: number): Promise<void> => api.delete(`/admin/recipes/${id}`).then(() => {}),
    createRecipe: (data: CreateRecipeData | FormData): Promise<Recipe> =>
        api.post('/admin/recipes', data, {
            headers: data instanceof FormData
                ? { 'Content-Type': 'multipart/form-data' }
                : {}
        }).then(res => res.data.recipe),
    addMultipleImages: (recipeId: number, formData: FormData): Promise<{
            message: string,
            recipe: RecipeFull,
        }> => api.post(`/admin/recipes/${recipeId}/images`, formData, {
            headers: { "Content-Type": 'multipart/form-data'}
        }).then(res => res.data),
    addStepImages: async (recipeId: number, formData: FormData): Promise<void> =>
        api.post(`/admin/recipes/${recipeId}/step-images`, formData, {
            headers: { "Content-Type": 'multipart/form-data'}
        }).then(() => {}),
    deleteStepImage: (recipe_id: number, image_id: number): Promise<void> => 
        api.delete(`/admin/recipes/${recipe_id}/images/${image_id}`).then(() => {}),
};