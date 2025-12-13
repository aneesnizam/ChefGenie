import { useEffect, useState } from "react";
import { Search, Grid3x3, List } from "lucide-react";
import RecipeCard from "../components/RecipeCard";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../services/axios";

export default function RecipeLibraryPage() {
  const navigate = useNavigate();

  // States
  const [searchParams, setSearchParams] = useSearchParams();
  const [allRecipes, setAllRecipes] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("s") || "");
  const [viewMode, setViewMode] = useState("grid");
  const [favorites, setFavorites] = useState(new Set());
  const [areaFilter, setAreaFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [areas, setAreas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isIngredientMode, setIsIngredientMode] = useState(false);

  // 🔁 Toggle favorite recipes
  const toggleFavorite = (id) => {
    // Optimistically update UI
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });

    // Make API call to toggle favorite
    axiosInstance
      .post("/api/favorites/toggle/", { mealid: id })
      .then((res) => {
        // Update state based on API response
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
        // Revert optimistic update on error
        setFavorites((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return newSet;
        });
        console.error("Failed to toggle favorite:", err);
      });
  };

  // 📦 Fetch area and category filters (static data)
  const fetchAreas = async () => {
    const res = await fetch("/data/areas.json");
    const data = await res.json();
    setAreas(data);
  };

  const fetchCategories = async () => {
    const res = await fetch("/data/categories.json");
    const data = await res.json();
    setCategories(data);
  };

  // 🚀 On mount, fetch filters
  useEffect(() => {
    fetchAreas();
    fetchCategories();
    searchQuery && searchResults();

    // Fetch user's favorites
    axiosInstance
      .get("/api/favorites/")
      .then((res) => {
        // Extract mealid from each favorite's meal object
        const favoriteMealIds = new Set(
          res.data.favorites.map((fav) => fav.meal.mealid)
        );
        setFavorites(favoriteMealIds);
      })
      .catch((err) => {
        console.error("Failed to fetch favorites:", err);
      });
  }, []);

  // 🔍 Search recipes (normal or ingredient)
  const searchResults = async (ingredientMode = false) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearchParams({ s: searchQuery })
    try {
      const endpoint = ingredientMode
        ? `/api/ingredientfilter/${searchQuery}/`
        : `/api/recipefilter/${searchQuery}/`;

      const res = await axiosInstance.get(endpoint);
      setAllRecipes(res.data || []);
      setRecipes(res.data || []);
    } catch (err) {
      console.error("Error fetching recipes:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🎛️ Filter recipes by category & area
  const handleFilter = () => {
    let filtered = allRecipes;

    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => {
        if (Array.isArray(item.category)) {
          return item.category.includes(categoryFilter);
        }
        return item.category === categoryFilter;
      });
    }

    if (areaFilter !== "all") {
      filtered = filtered.filter((item) => item.area === areaFilter);
    }

    setRecipes(filtered);
  };

  // Run filter when category or area changes
  useEffect(() => {
    if (allRecipes.length > 0) handleFilter();
  }, [categoryFilter, areaFilter, allRecipes]);


  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-8 py-8 relative">
      <div className="max-w-7xl mx-auto ">
        <div className="absolute top-3 right-8">
          <button
            onClick={() => navigate("/app/ai-generate")}
            className="group relative px-3 py-2 text-sm font-semibold rounded-xl overflow-hidden bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            <span className="relative z-10 flex items-center gap-2">
              <span className="animate-pulse">🤖</span> Generate Recipe with AI
            </span>
          </button>
        </div>

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="w-3 h-8 bg-gradient-to-b from-primary to-primary/80 rounded-full mr-3"></div>
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Recipe Library
            </h1>
            <div className="w-3 h-8 bg-gradient-to-b from-primary/80 to-primary rounded-full ml-3"></div>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Discover and explore delicious recipes from around the world. Find your next culinary adventure!
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mb-10 space-y-6">
          {/* Search Bar */}
          <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
            {/* Search Bar Container */}
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder={
                  isIngredientMode
                    ? "Search recipes by ingredients..."
                    : "Search recipes by name, cuisine..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchResults(isIngredientMode)}
                className="w-full h-14 pl-12 pr-36 rounded-2xl bg-card border border-border text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
              />
              <button
                onClick={() => searchResults(isIngredientMode)}
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 bg-primary text-primary-foreground px-4 rounded-xl hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-2 font-medium disabled:opacity-50"
              >
                {loading ? (
                  "..."
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Search
                  </>
                )}
              </button>
            </div>

            {/* Toggle Container */}
            <div className="flex justify-end">
              <div
                className="flex items-center gap-3 bg-card px-4 py-2 rounded-full shadow-sm border border-border cursor-pointer hover:shadow-md transition-all"
                onClick={() => setIsIngredientMode(!isIngredientMode)}
              >
                <span
                  className={`text-sm font-medium transition-colors ${!isIngredientMode ? "text-primary" : "text-muted-foreground"
                    }`}
                >
                  Normal
                </span>

                {/* The Switch */}
                <div
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${isIngredientMode ? "bg-green-500" : "bg-primary/20"
                    }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out ${isIngredientMode ? "translate-x-5" : "translate-x-0"
                      }`}
                  />
                </div>

                <span
                  className={`text-sm font-medium transition-colors ${isIngredientMode ? "text-green-600" : "text-muted-foreground"
                    }`}
                >
                  Ingredients
                </span>
              </div>
            </div>
          </div>

          {/* Filters & View Mode */}
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <div className="relative">
                <select
                  className="w-48 rounded-xl border-2 border-border bg-card px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary outline-none transition-all duration-200 appearance-none cursor-pointer shadow-sm hover:shadow-md"
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                >
                  <option value="all">All Cuisines</option>
                  {areas.map((area, i) => (
                    <option key={i} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select
                  className="w-48 rounded-xl border-2 border-border bg-card px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary outline-none transition-all duration-200 appearance-none cursor-pointer shadow-sm hover:shadow-md"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat, i) => {
                    <option key={i} value={cat}>
                      {cat}
                    </option>
                  })}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>


            </div>




            {/* View Mode */}
            <div className="flex gap-2 bg-card rounded-xl p-1 border-2 border-border shadow-sm">
              <button
                className={`p-3 rounded-lg transition-all duration-200 flex items-center gap-2 ${viewMode === "grid"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted"
                  }`}
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="w-4 h-4" />
                <span className="text-sm font-medium">Grid</span>
              </button>
              <button
                className={`p-3 rounded-lg transition-all duration-200 flex items-center gap-2 ${viewMode === "list"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted"
                  }`}
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
                <span className="text-sm font-medium">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground text-lg">Loading delicious recipes...</p>
            </div>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-3">No recipes found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <p className="text-muted-foreground text-lg">
                Found <span className="font-semibold text-primary">{recipes.length}</span> recipe
                {recipes.length !== 1 && "s"}
              </p>
              <div className="hidden sm:block w-4 h-1 bg-gradient-to-r from-primary to-primary/80 rounded-full"></div>
            </div>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
                  : "space-y-6"
              }
            >
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  idMeal={recipe.mealid}
                  strMeal={recipe.title}
                  strMealThumb={recipe.image}
                  strCategory={
                    Array.isArray(recipe.category)
                      ? recipe.category.join(", ")
                      : recipe.category ?? "Unknown"
                  }
                  strArea={recipe.area ?? "Unknown"}
                  isFavorite={favorites.has(recipe.mealid)}
                  onToggleFavorite={toggleFavorite}
                  onClick={(id) => navigate(`/app/recipeapi/${id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
