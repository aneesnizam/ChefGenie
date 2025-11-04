import { useEffect, useState } from "react";
import { Search, Grid3x3, List } from "lucide-react";
import RecipeCard from "../components/RecipeCard";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../services/axios";

export default function RecipeLibraryPage() {
  const navigate = useNavigate();

  // States
  const [allRecipes, setAllRecipes] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [favorites, setFavorites] = useState(new Set());
  const [areaFilter, setAreaFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [areas, setAreas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔁 Toggle favorite recipes
  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
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
  }, []);

  // 🔍 Search recipes by name
  const searchResults = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/recipefilter/${searchQuery}/`);
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
      filtered = filtered.filter(
        (item) => item.strCategory === categoryFilter
      );
    }

    if (areaFilter !== "all") {
      filtered = filtered.filter((item) => item.strArea === areaFilter);
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
    {/* <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-purple-600 opacity-0  blur-lg transition duration-500"></div> */}
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
          <div className="relative flex justify-center items-center w-full max-w-2xl mx-auto">
            <div className="relative w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
              <input
                type="text"
                placeholder="Search recipes by name, ingredient, or cuisine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchResults()}
                className="w-full pl-12 pr-24 h-16 rounded-2xl bg-card border-2 border-border text-foreground text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all duration-200 shadow-sm hover:shadow-md"
              />
              <button
                onClick={searchResults}
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 active:scale-95 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {/* Filters & View Mode */}
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            {/* Dropdowns */}
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
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  {categories.map((cat, i) => (
                    <option key={i} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* View Mode */}
            <div className="flex gap-2 bg-card rounded-xl p-1 border-2 border-border shadow-sm">
              <button
                className={`p-3 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted"
                }`}
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="w-4 h-4" />
                <span className="text-sm font-medium">Grid</span>
              </button>
              <button
                className={`p-3 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  viewMode === "list"
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
                Found <span className="font-semibold text-primary">{recipes.length}</span> recipe{recipes.length !== 1 && "s"}
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
                  key={recipe.idMeal}
                  idMeal={recipe.idMeal}
                  strMeal={recipe.strMeal}
                  strMealThumb={recipe.strMealThumb}
                  strCategory={recipe.strCategory ?? "Unknown"}
                  strArea={recipe.strArea ?? "Unknown"}
                  isFavorite={favorites.has(recipe.idMeal)}
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