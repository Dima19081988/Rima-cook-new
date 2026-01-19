import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/public/HomePage";
import AdminLogin from "./pages/admin/AdminLogin";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/admin" element={<div>Админка работает! 🎉</div>} />
                </Route>
                <Route path="/category/:slug" element={<div>Панель категорий</div>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;