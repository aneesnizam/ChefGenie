import { useState } from "react";
import {
  User,
  Settings,
  Heart,
  ShoppingCart,
  Clock,
  Mail,
} from "lucide-react";
import RecipeCard from "../components/RecipeCard"; // assuming RecipeCard is already JSX compatible
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const [favorites, setFavorites] = useState(new Set(["1", "2", "4"]));
  const [activeTab, setActiveTab] = useState("favorites");
  
  const navigate = useNavigate()

  const favoriteRecipes = [
    {
      id: "1",
      title: "Creamy Garlic Parmesan Pasta",
      image:
        "https://images.unsplash.com/photo-1619568759244-8372de67304a?w=1080",
      cookTime: "25 min",
      servings: 4,
      cuisine: "Italian",
      dietType: "Vegetarian",
    },
    {
      id: "2",
      title: "Herb-Crusted Grilled Salmon",
      image:
        "https://images.unsplash.com/photo-1708388464725-5c62c6e4574d?w=1080",
      cookTime: "20 min",
      servings: 2,
      cuisine: "American",
      dietType: "Keto",
    },
    {
      id: "4",
      title: "Asian Veggie Stir-Fry",
      image:
        "https://images.unsplash.com/photo-1758979690131-11e2aa0b142b?w=1080",
      cookTime: "18 min",
      servings: 3,
      cuisine: "Asian",
      dietType: "Vegan",
    },
  ];

  const pastRecipes = [
    {
      id: "5",
      title: "Decadent Chocolate Lava Cake",
      image:
        "https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=1080",
      cookTime: "30 min",
      servings: 2,
      cuisine: "French",
      dietType: "Vegetarian",
      cookedOn: "Oct 7, 2025",
    },
    {
      id: "8",
      title: "Authentic Mexican Tacos",
      image:
        "https://images.unsplash.com/photo-1757774551171-91143e145b0a?w=1080",
      cookTime: "20 min",
      servings: 3,
      cuisine: "Mexican",
      cookedOn: "Oct 5, 2025",
    },
  ];

  const groceryList = [
    {
      category: "Vegetables",
      items: ["Tomatoes (4 pcs)", "Garlic (2 bulbs)", "Onions (3 pcs)"],
    },
    {
      category: "Proteins",
      items: ["Chicken breast (2 lbs)", "Salmon fillet (1 lb)"],
    },
    {
      category: "Dairy",
      items: ["Parmesan cheese (8 oz)", "Heavy cream (2 cups)"],
    },
    {
      category: "Pantry",
      items: ["Pasta (2 lbs)", "Olive oil (1 bottle)", "Rice (1 bag)"],
    },
  ];

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

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
              <h1 className="mb-2 text-xl font-bold">Sarah Johnson</h1>
              <p className="text-gray-500 mb-4">Home Chef · Food Enthusiast</p>

              {/* Dietary Preferences */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                <span className="bg-bright text-white px-3 py-1 rounded-full text-sm">
                  Vegetarian Friendly
                </span>
                <span className="border px-3 py-1 rounded-full text-sm">
                  Dairy-Free Options
                </span>
                <span className="border px-3 py-1 rounded-full text-sm">
                  Quick Meals
                </span>
              </div>

              {/* Stats */}
              <div className="flex gap-6  justify-center md:justify-start">
                <div>
                  <p className="text-2xl  font-bold">{favoriteRecipes.length}</p>
                  <p className="text-sm text-gray-500">Favorites</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{pastRecipes.length}</p>
                  <p className="text-sm text-gray-500">Recipes Cooked</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">48</p>
                  <p className="text-sm text-gray-500">Days Active</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex md:flex-col gap-2">
              <button className="flex items-center justify-center px-4 py-2 border rounded-xl hover:bg-muted">
                <Settings className="w-4 h-4 mr-2" /> Settings
              </button>
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  activeTab === tab ? "bg-bright dark: text-white" : "bg-gray-100 dark:bg-muted"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  {...recipe}
                  isFavorite={favorites.has(recipe.id)}
                  onToggleFavorite={toggleFavorite}
                   onClick={() => navigate(`/app/recipe/${recipe.id}`)}
                />
              ))}
            </div>
          )}

          {activeTab === "grocery" && (
            <div className="bg-card rounded-2xl border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Current Grocery List</h2>
                <button className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-muted">
                  <ShoppingCart className="w-4 h-4" /> Export
                </button>
              </div>
              <div className="space-y-4">
                {groceryList.map((section, i) => (
                  <div key={i}>
                    <h3 className="font-semibold mb-2">{section.category}</h3>
                    <div className="space-y-1">
                      {section.items.map((item, idx) => (
                        <label
                          key={idx}
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted hover:bg-accent/80 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                          />
                          {item}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              {pastRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-card border rounded-2xl p-4 flex gap-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/app/recipe/${recipe.id}`)}
                >
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{recipe.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      Cooked on {recipe.cookedOn}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <span className="border px-2 py-1 rounded-full text-xs">
                        {recipe.cuisine}
                      </span>
                      {recipe.dietType && (
                        <span className="bg-bright text-white px-2 py-1 rounded-full text-xs">
                          {recipe.dietType}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="self-start px-3 py-1 border rounded-lg hover:bg-muted text-sm">
                    Cook Again
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              {/* Account Settings */}
              <div className="bg-card border rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4">Account Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Sarah Johnson"
                      className="mt-1 w-full p-2 border bg-muted rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Email</label>
                    <input
                      type="email"
                      defaultValue="sarah@example.com"
                      className="mt-1 w-full bg-muted p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Connected Accounts</h3>
                    <button className="flex items-center bg-muted gap-2 w-full px-4 py-2 border rounded-xl  mb-2">
                      <Mail className="w-4 h-4" /> Connect with Google
                    </button>
                  
                  </div>
                </div>
              </div>

              {/* Dietary Restrictions */}
              <div className="bg-card border rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4">Dietary Restrictions</h2>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Vegetarian",
                    "Vegan",
                    "Gluten-Free",
                    "Dairy-Free",
                    "Keto",
                    "Paleo",
                  ].map((diet) => (
                    <button
                      key={diet}
                      className="px-3 py-1 border rounded-full text-sm hover:bg-muted"
                    >
                      {diet}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
