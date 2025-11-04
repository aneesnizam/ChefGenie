import { useState } from 'react';


export default function RecipeForm() {
  const [title, setTitle] = useState('');
  const [images, setImages] = useState([]);
  const [description, setDescription] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [servings, setServings] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [dietType, setDietType] = useState('');
  const [ingredients, setIngredients] = useState([{ item: '', quantity: '' }]);
  const [steps, setSteps] = useState([{ instruction: '' }]);

  // handle image upload & preview
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImages(previews);
  };

  const addIngredient = () =>
    setIngredients([...ingredients, { item: '', quantity: '' }]);

  const removeIngredient = (index) =>
    setIngredients(ingredients.filter((_, i) => i !== index));

  const updateIngredient = (index, field, value) =>
    setIngredients(
      ingredients.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing
      )
    );

  const addStep = () => setSteps([...steps, { instruction: '' }]);
  const removeStep = (index) => setSteps(steps.filter((_, i) => i !== index));
  const updateStep = (index, value) =>
    setSteps(steps.map((step, i) => (i === index ? { instruction: value } : step)));

  const handleSubmit = (e) => {
    e.preventDefault();

    const newRecipe = {
      title,
      images,
      description,
      cookTime,
      prepTime,
      servings,
      cuisine,
      dietType,
      ingredients,
      steps,
    };


    // reset form
    setTitle('');
    setImages([]);
    setDescription('');
    setCookTime('');
    setPrepTime('');
    setServings('');
    setCuisine('');
    setDietType('');
    setIngredients([{ item: '', quantity: '' }]);
    setSteps([{ instruction: '' }]);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl mx-auto p-6 my-7 space-y-6 border rounded-lg shadow-md"
    >
      <h2 className="text-2xl font-bold mb-4">Add New Recipe</h2>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-semibold">Recipe Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g., Creamy Garlic Pasta"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Cuisine</label>
          <input
            type="text"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g., Italian"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Diet Type</label>
          <input
            type="text"
            value={dietType}
            onChange={(e) => setDietType(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g., Vegetarian"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Servings</label>
          <input
            type="number"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g., 4"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Cook Time</label>
          <input
            type="text"
            value={cookTime}
            onChange={(e) => setCookTime(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g., 25 min"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Prep Time</label>
          <input
            type="text"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g., 10 min"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block mb-1 font-semibold">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Write a short description..."
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block mb-1 font-semibold">Upload Images (max 3)</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className="block w-full text-sm text-gray-700 border border-gray-300 rounded cursor-pointer p-2"
        />
        {images.length > 0 && (
          <div className="flex gap-4 mt-3">
            {images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Preview ${index + 1}`}
                className="w-24 h-24 object-cover rounded border"
              />
            ))}
          </div>
        )}
      </div>

      <hr className="my-4" />

      {/* Ingredients */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Ingredients</h3>
        {ingredients.map((ing, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={ing.item}
              onChange={(e) => updateIngredient(index, 'item', e.target.value)}
              className="flex-1 p-2 border rounded"
              placeholder={`Ingredient ${index + 1}`}
            />
            <input
              type="text"
              value={ing.quantity}
              onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
              className="w-32 p-2 border rounded"
              placeholder="Qty"
            />
            <button
              type="button"
              onClick={() => removeIngredient(index)}
              className="px-3 py-1 border rounded bg-red-500 text-white"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addIngredient}
          className="px-4 py-2 border rounded bg-green-500 text-white"
        >
          + Add Ingredient
        </button>
      </div>

      <hr className="my-4" />

      {/* Steps */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Steps</h3>
        {steps.map((step, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <textarea
              value={step.instruction}
              onChange={(e) => updateStep(index, e.target.value)}
              className="flex-1 p-2 border rounded"
              placeholder={`Step ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => removeStep(index)}
              className="px-3 py-1 border rounded bg-red-500 text-white"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addStep}
          className="px-4 py-2 border rounded bg-green-500 text-white"
        >
          + Add Step
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full py-3 mt-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
      >
        Save Recipe
      </button>
    </form>
  );
}
