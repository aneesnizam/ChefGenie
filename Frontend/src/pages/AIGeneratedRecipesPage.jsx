import { useEffect, useState } from "react";
import { Sparkles, Trash2, User } from "lucide-react";
import RecipeCard from "../components/RecipeCard";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../services/axios";
import thumbnail from "../assets/img/AI Food1.png";

export default function AIGeneratedRecipesPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("my"); // "my" or "public"
  const [myRecipes, setMyRecipes] = useState([]);
  const [publicRecipes, setPublicRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);
  const [sharingId, setSharingId] = useState(null);

  // Fetch favorites on mount
  useEffect(() => {
    axiosInstance
      .get("/api/favorites/")
      .then((res) => {
        const favoriteMealIds = new Set(
          res.data.favorites.map((fav) => fav.meal.mealid)
        );
        setFavorites(favoriteMealIds);
      })
      .catch((err) => {
        console.error("Failed to fetch favorites:", err);
      });
  }, []);

  // Fetch recipes when view mode changes
  useEffect(() => {
    fetchRecipes();
  }, [viewMode]);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      if (viewMode === "my") {
        const response = await axiosInstance.get("/api/ai-recipes/");
        setMyRecipes(response.data.recipes || []);
      } else {
        const response = await axiosInstance.get(
          "/api/ai-recipes/?public=true"
        );
        setPublicRecipes(response.data.recipes || []);
      }
    } catch (err) {
      console.error("Failed to fetch AI recipes:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });

    axiosInstance
      .post("/api/favorites/toggle/", { mealid: id })
      .then((res) => {
        setFavorites((prev) => {
          const newSet = new Set(prev);
          if (res.data.is_favorited) {
            newSet.add(id);
          } else {
            newSet.delete(id);
          }
          return newSet;
        });
      })
      .catch((err) => {
        console.error("Failed to toggle favorite:", err);
      });
  };

  const handleShare = async (mealId) => {
    setSharingId(mealId);
    try {
      await axiosInstance.post("/api/ai-recipes/share/", { meal_id: mealId });
      // Refresh recipes
      await fetchRecipes();
      // alert("Recipe shared successfully!");
    } catch (err) {
      console.error("Failed to share recipe:", err);
      alert("Failed to share recipe. Please try again.");
    } finally {
      setSharingId(null);
    }
  };

  const handleUnshare = async (mealId) => {
    setSharingId(mealId);
    try {
      await axiosInstance.post("/api/ai-recipes/unshare/", { meal_id: mealId });
      // Refresh recipes
      await fetchRecipes();
      // alert("Recipe unshared successfully!");
    } catch (err) {
      console.error("Failed to unshare recipe:", err);
      alert("Failed to unshare recipe. Please try again.");
    } finally {
      setSharingId(null);
    }
  };

  const handleToggleShare = (recipe) => {
    if (recipe.is_public) {
      if (window.confirm("Are you sure you want to make this recipe private?")) {
        handleUnshare(recipe.id);
      }
    } else {
      handleShare(recipe.id);
    }
  };

  const handleDelete = async (mealId) => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) {
      return;
    }

    setDeletingId(mealId);
    try {
      await axiosInstance.delete(`/api/ai-recipes/${mealId}/`);
      // Remove from local state
      setMyRecipes((prev) => prev.filter((recipe) => recipe.id !== mealId));
      alert("Recipe deleted successfully!");
    } catch (err) {
      console.error("Failed to delete recipe:", err);
      alert("Failed to delete recipe. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const recipes = viewMode === "my" ? myRecipes : publicRecipes;

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-primary mr-3 animate-pulse" />
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              AI Generated Recipes
            </h1>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center bg-card rounded-xl p-1 border-2 border-border shadow-sm">
            <button
              onClick={() => setViewMode("my")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${viewMode === "my"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-muted"
                }`}
            >
              My AI Recipes
            </button>
            <button
              onClick={() => setViewMode("public")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${viewMode === "public"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-muted"
                }`}
            >
              Public AI Recipes
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground text-lg">
                Loading recipes...
              </p>
            </div>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-3">
              {viewMode === "my"
                ? "No AI recipes yet"
                : "No public recipes yet"}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {viewMode === "my"
                ? "Start generating recipes with AI to see them here!"
                : "Be the first to share an AI-generated recipe!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="relative">
                <RecipeCard
                  idMeal={recipe.mealid}
                  strMeal={recipe.title}
                  strMealThumb={thumbnail}
                  strCategory={
                    Array.isArray(recipe.category)
                      ? recipe.category.join(", ")
                      : recipe.category || "Unknown"
                  }
                  strArea={recipe.area || "Unknown"}
                  isFavorite={favorites.has(recipe.mealid)}
                  onToggleFavorite={toggleFavorite}
                  onClick={(id) => navigate(`/app/recipeapi/${id}`)}
                />

                {/* Action Buttons - Only show for user's own recipes in "my" view */}
                {viewMode === "my" && (
                  <div className="absolute bottom-16 right-3 flex gap-2 z-10 items-center">
                    {/* Public Toggle with Label */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (sharingId !== recipe.id) {
                          handleToggleShare(recipe);
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-md cursor-pointer transition-all duration-200 border ${recipe.is_public
                          ? "bg-green-100 border-green-200 hover:bg-green-200"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                        } ${sharingId === recipe.id
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                        }`}
                      title={
                        recipe.is_public
                          ? "Public (Click to make private)"
                          : "Private (Click to share)"
                      }
                    >
                      <span
                        className={`text-xs font-semibold ${recipe.is_public ? "text-green-700" : "text-gray-600"
                          }`}
                      >
                        {recipe.is_public ? "Public" : "Private"}
                      </span>
                      <div
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${recipe.is_public ? "bg-green-500" : "bg-gray-300"
                          }`}
                      >
                        <span
                          className={`${recipe.is_public ? "translate-x-4" : "translate-x-1"
                            } inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200`}
                        />
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(recipe.id);
                      }}
                      disabled={deletingId === recipe.id}
                      className="p-2 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition disabled:opacity-50"
                      title="Delete Recipe"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Creator Name for Public Recipes */}
                {viewMode === "public" && recipe.user_name && (
                  <div className="absolute top-3 left-3 z-10">
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold">
                      <User className="w-3 h-3" />
                      <span>{recipe.user_name}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
