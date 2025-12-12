import { useEffect, useState } from "react";
import { Search, Sparkles, TrendingUp, Clock, Users } from "lucide-react";
import RecipeCard from "../components/RecipeCard";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../services/axios";

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState(new Set());
  const [featuredRecipes, setFeaturedRecipes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get("/api/homerecipes/")
      .then((res) => {
        setFeaturedRecipes(res.data);
        console.log(res.data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });

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

  const toggleFavorite = (id) => {
    // Optimistically update UI
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });

    // Make API call to toggle favorite
    axiosInstance
      .post("/api/favorites/toggle/", { mealid: id })
      .then((res) => {
        // Update state based on API response
        setFavorites((prev) => {
          const newFavorites = new Set(prev);
          if (res.data.is_favorited) {
            newFavorites.add(id);
          } else {
            newFavorites.delete(id);
          }
          return newFavorites;
        });
      })
      .catch((err) => {
        // Revert optimistic update on error
        setFavorites((prev) => {
          const newFavorites = new Set(prev);
          if (newFavorites.has(id)) {
            newFavorites.delete(id);
          } else {
            newFavorites.add(id);
          }
          return newFavorites;
        });
        console.error("Failed to toggle favorite:", err);
      });
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffecd1_0%,#fdf8f3_50%,#f4ede3_100%)] dark:bg-[linear-gradient(180deg,#1a1410_100%)]">
      {/* Hero Section */}
      <section className="relative px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Title */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              Your Cooking Genie
            </h1>
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Just Ask & Cook
          </p>

          {/* Ingredient Search */}
          <div className="relative max-w-2xl  mx-auto mb-8">
            <div className="relative bg-card rounded-2xl shadow-2xl border-2 border-border p-2 backdrop-blur-sm">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                }}
                className="flex items-center gap-3"
              >
                <Search className="w-6 h-6 text-muted-foreground ml-3" />
                <input
                  type="text"
                  placeholder="Enter ingredients you have..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border-0 bg-transparent text-lg focus:outline-none focus:ring-0"
                />
                <button
                  onClick={() => navigate(`/app/recipes?s=${searchQuery}`)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold shadow-md hover:opacity-90 transition"
                >
                  Find Recipes
                </button>
              </form>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate("/app/chat")}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-lg transition-all flex items-center"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Ask ChefGenie
            </button>
            <button
              onClick={() => navigate("/app/recipes")}
              className="px-6 py-3 rounded-xl border-2 border-border text-foreground font-semibold hover:bg-muted transition-all flex items-center"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Explore Recipes
            </button>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="px-4 w-full py-12 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Clock className="w-8 h-8 text-primary" />,
                title: "Quick Recipes",
                desc: "Find meals ready in 30 minutes or less",
                color: "bg-primary/10",
              },
              {
                icon: <Sparkles className="w-8 h-8 text-secondary" />,
                title: "AI Powered",
                desc: "Get personalized cooking guidance",
                color: "bg-secondary/10",
              },
              {
                icon: <Users className="w-8 h-8 text-primary" />,
                title: "For Everyone",
                desc: "Dietary filters and preferences",
                color: "bg-primary/10",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl p-6 text-center shadow-md border border-border"
              >
                <div
                  className={`${stat.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}
                >
                  {stat.icon}
                </div>
                <h3 className="text-lg font-semibold">{stat.title}</h3>
                <p className="text-muted-foreground mt-2">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Recipes */}
      <section className="px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Newly Added Recipes</h2>
            {/* <button
              onClick={() => navigate("/app/recipes")}
              className="text-primary font-semibold hover:underline"
            >
              View All →
            </button>                                                                                                                                                                                  */}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading
              ? Array(4)
                  .fill("")
                  .map((_, i) => (
                    <RecipeCard
                      key={i}
                      idMeal={null}
                      strMeal=""
                      strMealThumb={null}
                      strCategory=""
                      strArea=""
                      isFavorite={false}
                      onToggleFavorite={null}
                      loading={true}
                    />
                  ))
              : featuredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    idMeal={recipe.mealid}
                    strMeal={recipe.title}
                    strMealThumb={recipe.image || "https://i.pinimg.com/736x/b1/2d/23/b12d235e771c190d39444f36140a9aff.jpg"}
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
        </div>
      </section>
    </div>
  );
}

// {
//   id: "1",
//   title: "Creamy Garlic Parmesan Pasta",
//   image:
//     "https://images.unsplash.com/photo-1619568759244-8372de67304a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
//   cookTime: "25 min",
//   servings: 4,
//   cuisine: "Italian",
//   dietType: "Vegetarian",
// }
