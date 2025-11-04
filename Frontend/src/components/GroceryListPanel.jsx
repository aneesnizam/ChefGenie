import { useState, useEffect } from "react";
import { X } from "lucide-react";
import axios from "axios";

export default function GroceryListPanel({ recipe, setIsGroceryList, Reciepename }) {
  const [groceryList, setGroceryList] = useState([]);
  const [loading, setLoading] = useState(false);

  const units = ["cup", "tsp", "tbsp", "g", "kg", "ml", "L", "pcs"];

  // Initialize grocery list from recipe
  useEffect(() => {
    if (recipe) {
      const initialList = recipe.map((item, idx) => ({
        id: idx + 1,
        ingredient_name: item.ingredient_name || "",
        quantity: item.quantity || "",
        unit: item.unit || "",
      }));
      setGroceryList(initialList);
    }
  }, [recipe]);

  // Handle input changes
  const handleChange = (id, field, value) => {
    setGroceryList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Submit grocery list to backend
  const handleSubmit = async () => {
    try {
      setLoading(true);

      const filteredIngredients = groceryList
      .filter(({ quantity }) => {
        if (quantity === null || quantity === "") return true; // keep null/empty
        const numericValue = parseFloat(quantity);
        return !(numericValue === 0 || isNaN(numericValue) && quantity === "0"); // remove 0
      })
      .map(({ ingredient_name, quantity, unit }) => ({
        ingredient_name,
        quantity,
        unit,
      }));

      const payload = {
        recipe_name: Reciepename || "Unnamed Recipe",
        ingredients: filteredIngredients,
      };

      // ✅ Send to backend
      // const res = await axios.post("http://localhost:5000/api/grocery", payload);

      // console.log("✅ Grocery list sent:", res.data);
      console.log(payload)
      alert("Grocery list submitted successfully!");
      setIsGroceryList(false);
    } catch (err) {
      console.error("❌ Error submitting grocery list:", err);
      alert("Failed to submit grocery list.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay */}
      <div className="fixed inset-0 text-black bg-black/70 z-40"></div>

      {/* Panel */}
      <div className="bg-card w-[500px] p-6 rounded-lg relative z-50 shadow-lg max-h-[80vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setIsGroceryList(false)}
          className="absolute top-3 right-3 p-2 rounded-full dark:text-white text-gray-700 hover:bg-muted"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center">
          Grocery List — {Reciepename || "Recipe"}
        </h2>

        {/* Grocery Items */}
        <div className="space-y-3 text-center">
          {groceryList.map((item) => (
            <div key={item.id} className="flex items-center justify-center gap-3">
              <input
                type="text"
                placeholder="Ingredient"
                value={item.ingredient_name}
                readOnly
                onChange={(e) =>
                  handleChange(item.id, "ingredient_name", e.target.value)
                }
                className="border border-border rounded p-1 w-[150px]"
              />
              <input
                type="text"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) =>
                  handleChange(item.id, "quantity", e.target.value)
                }
                className="border border-border rounded p-1 w-[70px]"
              />
              <select
                value={item.unit}
                disabled={String(item.quantity || '').toLowerCase().includes('taste')}
                onChange={(e) => handleChange(item.id, "unit", e.target.value)}
                className="border border-border rounded p-1 w-[80px]"
              >
                <option value="">Unit</option>
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex mt-5 w-1/2 justify-self-center flex-col bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Submit Grocery List"}
        </button>
      </div>
    </div>
  );
}
