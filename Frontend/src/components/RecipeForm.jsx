import { useEffect, useState } from "react";



export default function RecipeForm() {
  // --- Form state ---
  const [title, setTitle] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [area, setArea] = useState(""); // empty => backend may convert to null
  const [ingredients, setIngredients] = useState([{ item: "", quantity: "" }]);
  const [steps, setSteps] = useState([{ instruction: "" }]);

  // image file and preview
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // optional suggestions loaded from local JSON (non-critical)
  const [fetchedCategory, setFetchedCategory] = useState([]);
  const [areas, setAreas] = useState([]);

  // UI state
  const [errors, setErrors] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  // Load optional suggestions (categories & areas)
  useEffect(() => {
    async function loadSuggestions() {
      try {
        const [catRes, areaRes] = await Promise.all([
          fetch("/data/categories.json"),
          fetch("/data/areas.json"),
        ]);
        if (catRes.ok) {
          const catJson = await catRes.json();
          setFetchedCategory(Array.isArray(catJson) ? catJson : []);
        }
        if (areaRes.ok) {
          const areaJson = await areaRes.json();
          setAreas(Array.isArray(areaJson) ? areaJson : []);
        }
      } catch (err) {
        // suggestions are optional
        console.warn("Suggestion load failed:", err);
      }
    }
    loadSuggestions();
  }, []);

  // --- Ingredient helpers ---
  const addIngredient = () =>
    setIngredients([...ingredients, { item: "", quantity: "" }]);

  const removeIngredient = (index) =>
    setIngredients(ingredients.filter((_, i) => i !== index));

  const updateIngredient = (index, field, value) =>
    setIngredients(
      ingredients.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );

  // --- Step helpers ---
  const addStep = () => setSteps([...steps, { instruction: "" }]);
  const removeStep = (index) => setSteps(steps.filter((_, i) => i !== index));
  const updateStep = (index, value) =>
    setSteps(steps.map((s, i) => (i === index ? { instruction: value } : s)));

  // Append category suggestion
  const appendCategorySuggestion = (cat) => {
    const existing = categoryInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!existing.includes(cat)) {
      const newVal = existing.length ? `${existing.join(", ")}, ${cat}` : cat;
      setCategoryInput(newVal);
    }
  };

  // Image file selection + preview
  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setImageFile(null);
      setImagePreview("");
      return;
    }
    setImageFile(file);
    try {
      setImagePreview(URL.createObjectURL(file));
    } catch {
      setImagePreview("");
    }
  };

  // Build payload pieces
  const getIngredientStrings = () =>
    ingredients
      .map((ing) => {
        const item = (ing.item || "").trim();
        const qty = (ing.quantity || "").trim();
        if (!item) return null;
        return qty ? `${qty} ${item}` : item;
      })
      .filter(Boolean);

  const getInstructionString = () =>
    steps.map((s) => (s.instruction || "").trim()).filter(Boolean).join("\n");

  // Submit handler - single multipart/form-data request
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors("");
    setSuccess("");
    setSubmitting(true);

    // Basic client-side validation
    if (!title.trim()) {
      setErrors("Title is required.");
      setSubmitting(false);
      return;
    }
    const ingStrings = getIngredientStrings();
    if (ingStrings.length === 0) {
      setErrors("At least one ingredient is required.");
      setSubmitting(false);
      return;
    }
    const instructions = getInstructionString();
    if (!instructions) {
      setErrors("At least one instruction/step is required.");
      setSubmitting(false);
      return;
    }
    if (!imageFile) {
      setErrors("Please select an image file.");
      setSubmitting(false);
      return;
    }

    try {
      // Build FormData and append fields
      const formData = new FormData();
      formData.append("title", title.trim());
      // category: send as comma-separated string (backend example used string)
      const normalizedCategory = categoryInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .join(", ");
      formData.append("category", normalizedCategory);
      // area: send empty string if none; backend may treat "" as null
      formData.append("area", area.trim() === "" ? "" : area.trim());
      // instructions: single string with newline separators
      formData.append("instructions", instructions);
      // ingredients: send as JSON string array; backend should JSON.parse it
      formData.append("ingredients", JSON.stringify(ingStrings));
      // image file
      formData.append("image", imageFile);

      // If your backend requires additional fields, append them here.

      // Send multipart/form-data POST to the backend
      // NOTE: Do NOT set Content-Type header — the browser sets it (with boundary).
      const recipeEndpoint = "/api/recipes"; // change if needed
      const res = await fetch(recipeEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        // attempt to extract server error message
        const txt = await res.text().catch(() => "");
        throw new Error(`Server responded ${res.status}${txt ? `: ${txt}` : ""}`);
      }

      // Successful create
      setSuccess("Recipe uploaded successfully.");
      // Reset form
      setTitle("");
      setCategoryInput("");
      setArea("");
      setIngredients([{ item: "", quantity: "" }]);
      setSteps([{ instruction: "" }]);
      setImageFile(null);
      setImagePreview("");
    } catch (err) {
      console.error(err);
      setErrors(err.message || "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl mx-auto p-6 my-7 space-y-6 border rounded-lg shadow-md"
    >
      <h2 className="text-2xl font-bold mb-4">Add New Recipe </h2>

      {errors && <div className="p-3 bg-red-100 text-red-800 rounded">{errors}</div>}
      {success && <div className="p-3 bg-green-100 text-green-800 rounded">{success}</div>}

      {/* Title & Category / Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-semibold">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Healthy tomato soup"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Category (comma-separated)</label>
          <input
            type="text"
            value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Freezable, Healthy, Vegetarian"
          />
          {fetchedCategory && fetchedCategory.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {fetchedCategory.slice(0, 12).map((cat, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => appendCategorySuggestion(cat)}
                  className="text-sm px-2 py-1 border rounded bg-gray-50 hover:bg-gray-100"
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block mb-1 font-semibold">Area / Cuisine</label>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">(none)</option>
            {areas.map((a, i) => (
              <option key={i} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Image upload */}
        <div>
          <label className="block mb-1 font-semibold">Upload Image (required)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded cursor-pointer p-2"
          />
          {imagePreview && (
            <div className="mt-2">
              <img
                src={imagePreview}
                alt="preview"
                className="w-40 h-28 object-cover rounded border"
              />
            </div>
          )}
        </div>
      </div>

      <hr className="my-4" />

      {/* Ingredients */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Ingredients</h3>
        {ingredients.map((ing, index) => (
          <div key={index} className="flex gap-2 mb-2 items-center">
            <input
              type="text"
              value={ing.quantity}
              onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
              className="w-36 p-2 border rounded"
              placeholder="Qty (e.g., 2 tbsp)"
            />
            <input
              type="text"
              value={ing.item}
              onChange={(e) => updateIngredient(index, "item", e.target.value)}
              className="flex-1 p-2 border rounded"
              placeholder={`Ingredient ${index + 1} (e.g., onions chopped)`}
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
        <h3 className="text-lg font-semibold mb-2">Steps / Instructions</h3>
        <p className="text-sm text-gray-600 mb-2">
          Steps will be joined with newline characters in the `instructions` field.
        </p>
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
      <div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 mt-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
        >
          {submitting ? "Uploading..." : "Save Recipe"}
        </button>
      </div>
    </form>
  );
}
