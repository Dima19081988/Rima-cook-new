import axios from "axios";
import type { Recipe, HomeData } from "../types/recipe";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

export const recipesApi = {
    getRecipes: (): Promise<Recipe[]> => api.get('/recipes').then(res => res.data),
    getHome: (): Promise<HomeData> => api.get('/home').then(res => res.data),
};