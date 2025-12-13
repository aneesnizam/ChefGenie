import { useState, useEffect } from "react";
import { User, Settings, Heart, ShoppingCart, Clock, Mail, LogOut } from "lucide-react";
import RecipeCard from "../components/RecipeCard"; // assuming RecipeCard is already JSX compatible
import { useNavigate } from "react-router-dom";
import axiosInstance from "../services/axios";

export default function ProfilePage() {
  const [favorites, setFavorites] = useState(new Set());
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("favorites");
  const [groceryList, setGroceryList] = useState([]);
  const [groceryLoading, setGroceryLoading] = useState(false);
  const [groceryError, setGroceryError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [removingIngredientId, setRemovingIngredientId] = useState(null);

  // History state
  const [recentViews, setRecentViews] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // User profile state
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    favorites_count: 0,
    days_active: 0,
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [updatingName, setUpdatingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const navigate = useNavigate();

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
        // If unfavorited, remove from favoriteRecipes list
        if (!res.data.is_favorited) {
          setFavoriteRecipes((prev) =>
            prev.filter((recipe) => recipe.mealid !== id)
          );
          // Update favorites count
          setUserProfile((prev) => ({
            ...prev,
            favorites_count: Math.max(0, prev.favorites_count - 1),
          }));
        } else {
          // Update favorites count when favorited
          setUserProfile((prev) => ({
            ...prev,
            favorites_count: prev.favorites_count + 1,
          }));
        }
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

  const normalizeGroceryResponse = (data) => {
    if (Array.isArray(data)) {
      const looksLikeIngredients = data.every(
        (item) =>
          item &&
          typeof item === "object" &&
          ("ingredient_name" in item || "ingredient" in item)
      );

      if (looksLikeIngredients) {
        return [
          {
            id: "current",
            recipe_name: "Current List",
            ingredients: data,
          },
        ];
      }

      return data;
    }

    if (Array.isArray(data?.results)) {
      return normalizeGroceryResponse(data.results);
    }

    if (Array.isArray(data?.ingredients)) {
      return [
        {
          id: data.id ?? "current",
          recipe_name: data.recipe_name ?? "Current List",
          ingredients: data.ingredients,
        },
      ];
    }

    return [];
  };

  const fetchGroceryLists = async () => {
    setGroceryLoading(true);
    setGroceryError("");
    try {
      const { data } = await axiosInstance.get("/api/grocery-list-create/");
      console.log(data);
      setGroceryList(normalizeGroceryResponse(data));
    } catch (err) {
      console.error("Failed to load grocery lists:", err);
      setGroceryError("Could not load your grocery lists. Please try again.");
    } finally {
      setGroceryLoading(false);
    }
  };

  const handleRemoveIngredient = async (ingredient, parentListId) => {
    if (!ingredient?.id) {
      alert("Unable to remove this ingredient because it has no ID yet.");
      return;
    }
    setRemovingIngredientId(ingredient.id);
    try {
      await axiosInstance.delete(`/api/grocery-list-create/${ingredient.id}/`);
      setGroceryList((prev) =>
        prev
          .map((list) => {
            if ((list.id ?? "current") !== parentListId) return list;
            const nextIngredients = (list.ingredients || []).filter(
              (item) => item.id !== ingredient.id
            );
            return { ...list, ingredients: nextIngredients };
          })
          .filter((list) =>
            list.ingredients && list.ingredients.length > 0
              ? true
              : (list.id ?? "current") !== parentListId
          )
      );
    } catch (err) {
      console.error("Failed to remove ingredient:", err);
      alert("Unable to remove this ingredient. Please try again.");
    } finally {
      setRemovingIngredientId(null);
    }
  };

  // Fetch user profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (activeTab === "grocery") {
      fetchGroceryLists();
    } else if (activeTab === "history") {
      fetchRecentViews();
    }
  }, [activeTab]);

  const fetchRecentViews = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await axiosInstance.get("/api/recent-views/");
      // Transform views to recipe format
      const recipes = data.views.map((view) => ({
        mealid: view.meal.mealid,
        id: view.meal.mealid,
        title: view.meal.title,
        image: view.meal.image,
        category: Array.isArray(view.meal.category)
          ? view.meal.category.join(", ")
          : view.meal.category || "Unknown",
        area: view.meal.area || "Unknown",
        viewedAt: view.viewed_at,
      }));
      setRecentViews(recipes);
    } catch (err) {
      console.error("Failed to fetch recent views:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    setProfileLoading(true);
    setProfileError("");
    try {
      const { data } = await axiosInstance.get("/auth/profile/");
      setUserProfile({
        name: data.name || "",
        email: data.email || "",
        favorites_count: data.favorites_count || 0,
        days_active: data.days_active || 0,
      });
      setNameInput(data.name || "");
    } catch (err) {
      console.error("Failed to load profile:", err);
      setProfileError("Could not load your profile. Please try again.");
    } finally {
      setProfileLoading(false);
    }
  };

  const updateUserName = async () => {
    if (!nameInput.trim() || nameInput.trim() === userProfile.name) {
      return;
    }

    setUpdatingName(true);
    try {
      const { data } = await axiosInstance.patch("/auth/profile/", {
        name: nameInput.trim(),
      });
      setUserProfile((prev) => ({
        ...prev,
        name: data.name || nameInput.trim(),
      }));
    } catch (err) {
      console.error("Failed to update name:", err);
      alert("Failed to update name. Please try again.");
      setNameInput(userProfile.name); // Revert on error
    } finally {
      setUpdatingName(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("tokens");
      navigate("/login");
    }
  };

  // Fetch favorites on mount and when favorites tab is active
  useEffect(() => {
    if (activeTab === "favorites") {
      setFavoritesLoading(true);
      axiosInstance
        .get("/api/favorites/")
        .then((res) => {
          // Extract mealid from each favorite's meal object
          const favoriteMealIds = new Set(
            res.data.favorites.map((fav) => fav.meal.mealid)
          );
          setFavorites(favoriteMealIds);
          // Set favorite recipes from the API response
          const recipes = res.data.favorites.map((fav) => ({
            mealid: fav.meal.mealid,
            id: fav.meal.mealid,
            title: fav.meal.title,
            image: fav.meal.image,
            category: Array.isArray(fav.meal.category)
              ? fav.meal.category.join(", ")
              : fav.meal.category || "Unknown",
            area: fav.meal.area || "Unknown",
          }));
          setFavoriteRecipes(recipes);
        })
        .catch((err) => {
          console.error("Failed to fetch favorites:", err);
        })
        .finally(() => {
          setFavoritesLoading(false);
        });
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="bg-card rounded-2xl border p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 md:w-32 md:h-32 mx-auto md:mx-0 rounded-full bg-gradient-to-br from-bright dark:from-primary to-pink-500 dark:to-secondary flex items-center justify-center">
              <User className="w-12 h-12 md:w-16 md:h-16 text-white" />
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              {profileLoading ? (
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-muted-foreground">
                    Loading profile...
                  </span>
                </div>
              ) : profileError ? (
                <div className="text-sm text-red-500">{profileError}</div>
              ) : (
                <>
                  <h1 className="mb-2 text-xl font-bold">
                    {userProfile.name || "User"}
                  </h1>
                  {userProfile.email && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {userProfile.email}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex gap-6 justify-center md:justify-start">
                    <div>
                      <p className="text-2xl font-bold">
                        {userProfile.favorites_count}
                      </p>
                      <p className="text-sm text-gray-500">Favorites</p>
                    </div>

                    <div>
                      <p className="text-2xl font-bold">

                      </p>

                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex gap-2 mb-6 flex-wrap">
            {["favorites", "grocery", "history", "settings"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${activeTab === tab
                  ? "bg-bright dark: text-white"
                  : "bg-gray-100 dark:bg-muted"
                  }`}
              >
                {tab === "favorites" && <Heart className="w-4 h-4" />}
                {tab === "grocery" && <ShoppingCart className="w-4 h-4" />}
                {tab === "history" && <Clock className="w-4 h-4" />}
                {tab === "settings" && <Settings className="w-4 h-4" />}
                <span className="capitalize">{tab}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "favorites" && (
            <div>
              {favoritesLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground text-lg">
                      Loading favorites...
                    </p>
                  </div>
                </div>
              ) : favoriteRecipes.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">
                    No favorites yet
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Start favoriting recipes to see them here!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteRecipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.mealid}
                      idMeal={recipe.mealid}
                      strMeal={recipe.title}
                      strMealThumb={recipe.image || "https://i.pinimg.com/1200x/93/10/14/931014d8e72841cf1cef6b2942e68322.jpg"}
                      strCategory={recipe.category}
                      strArea={recipe.area}
                      isFavorite={favorites.has(recipe.mealid)}
                      onToggleFavorite={toggleFavorite}
                      onClick={(id) => navigate(`/app/recipeapi/${id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "grocery" && (
            <div className="bg-card rounded-2xl border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Current Grocery Lists</h2>
                <button
                  className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-muted"
                  onClick={fetchGroceryLists}
                  disabled={groceryLoading}
                >
                  <ShoppingCart className="w-4 h-4" /> Refresh
                </button>
              </div>
              {groceryLoading && (
                <p className="text-sm text-gray-500">Loading your lists...</p>
              )}
              {groceryError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
                  {groceryError}
                  <button
                    className="ml-3 underline"
                    onClick={fetchGroceryLists}
                  >
                    Retry
                  </button>
                </div>
              )}
              {!groceryLoading && !groceryError && groceryList.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-sm text-gray-500">
                    You don&apos;t have any grocery lists yet.
                  </p>
                </div>
              )}
              <div className="space-y-6">
                {groceryList.map((list) => {
                  const listKey = list.id ?? "current";
                  // Group ingredients by shop
                  const ingredientsByShop = {};
                  (list.ingredients || []).forEach((ingredient) => {
                    const shop = ingredient.shop || "Others";
                    if (!ingredientsByShop[shop]) {
                      ingredientsByShop[shop] = [];
                    }
                    ingredientsByShop[shop].push(ingredient);
                  });

                  // Sort shops alphabetically
                  const sortedShops = Object.keys(ingredientsByShop).sort();

                  return (
                    <div
                      key={listKey}
                      className="rounded-2xl border bg-gradient-to-br from-card to-muted/20 p-6 shadow-md"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-foreground">
                              {list.recipe_name || "Current Grocery List"}
                            </h3>
                            <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                              {list.ingredients?.length || 0} items
                            </span>
                          </div>
                          {list.updated_at && (
                            <p className="text-xs text-muted-foreground">
                              Updated{" "}
                              {new Date(list.updated_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Grouped by shop */}
                      <div className="space-y-6">
                        {sortedShops.map((shop) => {
                          const shopIngredients = ingredientsByShop[shop];
                          const shopColors = {
                            Supermarket: "from-blue-500 to-blue-600",
                            "Spices Store": "from-orange-500 to-orange-600",
                            "Vegetable Market": "from-green-500 to-green-600",
                            "Dairy Shop": "from-yellow-500 to-yellow-600",
                            "Meat Shop": "from-red-500 to-red-600",
                            Bakery: "from-amber-500 to-amber-600",
                            Others: "from-gray-500 to-gray-600",
                          };
                          const shopColor =
                            shopColors[shop] || shopColors["Others"];

                          return (
                            <div key={shop} className="space-y-3">
                              {/* Shop Header */}
                              <div
                                className={`bg-gradient-to-r ${shopColor} text-white px-4 py-2 rounded-lg flex items-center justify-between`}
                              >
                                <h4 className="font-semibold text-sm uppercase tracking-wide">
                                  {shop}
                                </h4>
                                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
                                  {shopIngredients.length}{" "}
                                  {shopIngredients.length === 1
                                    ? "item"
                                    : "items"}
                                </span>
                              </div>

                              {/* Ingredients in this shop */}
                              <div className="grid gap-2 pl-2">
                                {shopIngredients.map((ingredient, idx) => {
                                  const ingredientKey =
                                    ingredient.id ||
                                    `${listKey}-${shop}-${idx}`;
                                  const quantityLabel = `${ingredient.quantity || "--"
                                    } ${ingredient.unit || ""}`.trim();
                                  return (
                                    <div
                                      key={ingredientKey}
                                      className="flex flex-col gap-2 rounded-lg bg-white/60 dark:bg-background/80 px-4 py-3 text-sm border border-border/50 md:flex-row md:items-center md:justify-between hover:shadow-sm transition-shadow"
                                    >
                                      <div className="flex-1">
                                        <p className="font-medium text-foreground">
                                          {ingredient.ingredient_name ||
                                            "Unnamed ingredient"}
                                        </p>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                            {quantityLabel || "No quantity"}
                                          </span>
                                        </div>
                                      </div>
                                      <button
                                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-60 transition-colors"
                                        onClick={() =>
                                          handleRemoveIngredient(
                                            ingredient,
                                            listKey
                                          )
                                        }
                                        disabled={
                                          removingIngredientId === ingredient.id
                                        }
                                      >
                                        {removingIngredientId === ingredient.id
                                          ? "Removing..."
                                          : "Remove"}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div>

              {historyLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground text-lg">
                      Loading history...
                    </p>
                  </div>
                </div>
              ) : recentViews.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">
                    No recent views
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Start viewing recipes to see them here!
                  </p>
                </div>
              ) : (
                // 🔥 VERTICAL FULL-WIDTH LIST (NO GRID)
                <div className="space-y-6">
                  {recentViews.map((recipe) => (
                    <div
                      key={recipe.mealid}
                      onClick={() => navigate(`/app/recipeapi/${recipe.mealid}`)}
                      className="w-full bg-card rounded-2xl border border-border p-4 flex gap-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <img
                        src={recipe.image || "https://i.pinimg.com/1200x/93/10/14/931014d8e72841cf1cef6b2942e68322.jpg"}
                        alt={recipe.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />

                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{recipe.title}</h3>

                        <p className="text-sm text-muted-foreground mb-2">
                          {recipe.category} • {recipe.area}
                        </p>

                        <div className="flex gap-2">
                          <span className="px-2 py-1 text-xs border rounded-md">
                            {recipe.category}
                          </span>

                          <span className="px-2 py-1 text-xs bg-secondary text-white rounded-md">
                            Viewed recently
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              {/* Account Settings */}
              <div className="bg-card border rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4">Account Settings</h2>
                {profileLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Full Name
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          onBlur={updateUserName}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              updateUserName();
                              e.target.blur();
                            }
                          }}
                          className="flex-1 p-2 border bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Enter your name"
                        />
                        <button
                          onClick={updateUserName}
                          disabled={
                            updatingName ||
                            !nameInput.trim() ||
                            nameInput.trim() === userProfile.name
                          }
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {updatingName ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email
                      </label>
                      <input
                        disabled
                        type="email"
                        value={userProfile.email || ""}
                        className="mt-1 w-full bg-muted p-2 border rounded-lg cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Email cannot be changed
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <div className="bg-card border rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4 text-red-600">Danger Zone</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sign out of your account</p>
                    <p className="text-sm text-muted-foreground">
                      You will need to log in again to access your account.
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}