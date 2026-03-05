import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RecipeCardPage from "./pages/public/RecipePage";
import HomePage from "./pages/public/HomePage";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminPanel from "./pages/admin/AdminPanel";
import CreateRecipe from "./pages/admin/CreateRecipe";
import EditRecipe from "./pages/admin/EditRecipe";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="recipe/:id" element={<RecipeCardPage />} />
                <Route path="/category/:slug" element={<div>Панель категорий</div>} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/admin/recipes/new" element={<CreateRecipe />} />
                    <Route path="/admin/recipes/:id/edit" element={<EditRecipe />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;