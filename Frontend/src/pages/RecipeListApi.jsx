import React, { useState } from "react";
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



// import React, { useEffect, useState } from "react";
// import { useParams, Link } from "react-router-dom";

// const RecipeDetailApi = () => {
//   const { id } = useParams();
//   const [recipe, setRecipe] = useState(null);

//   useEffect(() => {
//     const fetchRecipeDetails = async () => {
//       const res = await fetch(`http://127.0.0.1:8000/api/spoonculardetail/${id}/`);
//       const data = await res.json();
//       setRecipe(data);
//     };
//     fetchRecipeDetails();
//   }, [id]);

//   if (!recipe) return <p className="p-6">Loading...</p>;

//   return (
//     <div className="p-6">
//       <Link to="/" className="text-blue-500">← Back to Recipes</Link>
//       <h2 className="text-3xl font-bold mt-2">{recipe.title}</h2>
//       <img
//         src={recipe.image}
//         alt={recipe.title}
//         className="rounded-xl w-full max-w-md mt-4"
//       />
//       <p className="mt-4 text-gray-700">
//         <strong>Ready in:</strong> {recipe.readyInMinutes} mins
//       </p>
//       <p className="mt-2">
//         <strong>Servings:</strong> {recipe.servings}
//       </p>
//       <h3 className="text-xl font-semibold mt-4">Ingredients</h3>
//       <ul className="list-disc ml-6">
//         {recipe.extendedIngredients?.map((ing) => (
//           <li key={ing.id}>{ing.original}</li>
//         ))}
//       </ul>
//       <h3 className="text-xl font-semibold mt-4">Instructions</h3>
//       <p className="mt-2">{recipe.instructions || "No instructions available."}</p>
//     </div>
//   );
// };

// export default RecipeDetailApi;
