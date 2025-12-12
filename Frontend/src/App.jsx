import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

// Components
import FloatingChatButton from "./components/FloatingChatButton";
import RecipeForm from "./components/RecipeForm";
import Home from "./pages/Home";
import ChatPage from "./pages/ChatPage";
import RecipeLibraryPage from "./pages/RecipeLibraryPage";
import RecipeDetailsPage from "./pages/RecipeDetailsPage";
import MealPlannerPage from "./pages/MealPlannerPage";
import ProfilePage from "./pages/ProfilePage";
import Navigation from "./components/Navigation";

// Auth Pages
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./auth/RegisterPage";
import LoginPage from "./auth/LoginPage";
import AIGenerateRecipePage from "./pages/AIGenerateRecipePage";
import AIGeneratedRecipesPage from "./pages/AIGeneratedRecipesPage";
import RecipeDetailApi from "./pages/RecipeDetailApi";
import RecipeListApi from "./pages/RecipeListApi";

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "true";
  });

  // Theme toggle logic
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "true");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "false");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const isAuthenticated = () => {
    return localStorage.getItem("tokens") != null;
  };
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  const Islogged = ({ children }) => {
    if (isAuthenticated()) {
      return <Navigate to="/app/home" />;
    }
    return children;
  };

  const location = useLocation();
  const hideFloatingChat = location.pathname.startsWith("/app/recipe/");

  return (
    <div className="min-h-screen bg-background font-['Inter']">
      {/* Common Navigation (hide on landing, login, register) */}
      <Routes>
        <Route
          path="/"
          element={
            <Islogged>
              <LandingPage />
            </Islogged>
          }
        />
        <Route
          path="/login"
          element={
            <Islogged>
              <LoginPage />
            </Islogged>
          }
        />
        <Route
          path="/register"
          element={
            <Islogged>
              <RegisterPage />
            </Islogged>
          }
        />

        {/* Main app routes */}
        <Route
          path="/app/*"
          element={
            <>
              <Navigation isDark={isDark} onToggleTheme={toggleTheme} />

              <Routes>
                <Route path="home" element={<Home />} />
                <Route
                  path="chat"
                  element={
                    <>
                      <ChatPage />
                    </>
                  }
                />
                <Route path="recipes" element={<RecipeLibraryPage />} />
                <Route path="ai-generate" element={<AIGenerateRecipePage />} />
                <Route
                  path="ai-recipes"
                  element={
                    <ProtectedRoute>
                      <AIGeneratedRecipesPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="recipe/:id" element={<RecipeDetailsPage />} />
                <Route
                  path="planner"
                  element={
                    <ProtectedRoute>
                      <MealPlannerPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="add"
                  element={
                    <ProtectedRoute>
                      <RecipeForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route path="listapi" element={<RecipeListApi />} />
                <Route path="recipeapi/:id" element={<RecipeDetailApi />} />
              </Routes>

              {/* Floating Chat Button - Hide on chat page */}
              {!hideFloatingChat && <FloatingChatButton />}
            </>
          }
        />
      </Routes>
    </div>
  );
}
