import { useState } from "react";
import { Link } from "react-router-dom";

const RecipeListApi = () => {
  const [ingredients, setIngredients] = useState("");
  const [recipes, setRecipes] = useState([]);

  const fetchRecipes = async () => {
    const res = await fetch(
      `http://127.0.0.1:8000/api/spooncularrecipes/?ingredients=${ingredients}`
    );
    const data = await res.json();
    setRecipes(data);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Find Recipes by Ingredients</h2>
      <div className="flex mb-6">
        <input
          type="text"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="e.g. apples, sugar, flour"
          className="border rounded-l-lg p-2 w-full"
        />
        <button
          onClick={fetchRecipes}
          className="bg-green-600 text-white px-4 rounded-r-lg"
        >
          Search
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="bg-white shadow-md rounded-lg p-3">
            <img
              src={recipe.image}
              alt={recipe.title}
              className="rounded-lg w-full h-40 object-cover"
            />
            <h3 className="font-semibold mt-2">{recipe.title}</h3>
            <Link
              to={`/app/recipeapi/${recipe.id}?m=true`}
              className="text-blue-600 text-sm mt-1 inline-block"
            >
              View Details →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipeListApi;




