import React, { useEffect, useState, useRef } from "react";
import { Heart, Play, ShoppingCart, Sparkles, X } from "lucide-react";
import { useParams, Link } from "react-router-dom"; // Added Link back

// --- Placeholder Component ---
/**
 * ADDED: A placeholder GroceryListPanel component to resolve the import error.
 * In a real application, this would be in its own file.
 */
const GroceryListPanel = ({ recipe, setIsGroceryList, Reciepename }) => {
  // `recipe` here is the `aiIngredients` object
  const categories = Object.keys(recipe);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Grocery List</h2>
          <button
            onClick={() => setIsGroceryList(false)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
            aria-label="Close grocery list"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Items to buy for: <span className="font-medium text-gray-900 dark:text-white">{Reciepename}</span>
          </p>

          {categories.length > 0 ? (
            categories.map((category) => (
              <div key={category}>
                <h3 className="font-semibold text-purple-600 dark:text-purple-400 capitalize mb-2">
                  {category}
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {recipe[category].map((item, index) => (
                    <li key={index} className="text-gray-800 dark:text-gray-200">{item}</li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No items in the grocery list.</p>
          )}
        </div>

         {/* Footer Button */}
         <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
           <button 
             onClick={() => window.print()}
             className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
           >
             Print List
           </button>
         </div>
      </div>
    </div>
  );
};


// --- Utility Function ---

/**
 * NEW: This function "translates" the Spoonacular API response
 * into the data structure our component expects.
 */
const formatSpoonacularData = (data) => {
  if (!data) return null;

  // 1. Format Ingredients
  // Spoonacular gives an array 'extendedIngredients'
  const ingredients = (data.extendedIngredients || []).map((ing) => ({
    id: ing.id,
    item: ing.original, // The 'original' field has the full string (e.g., "2 cups flour")
  }));

  // 2. Format Instructions (Steps)
  let steps = [];
  // Spoonacular sometimes provides 'analyzedInstructions' which is much better
  if (data.analyzedInstructions && data.analyzedInstructions.length > 0) {
    // Use the pre-parsed steps
    steps = data.analyzedInstructions[0].steps.map((step) => ({
      id: step.number,
      instruction: step.step,
    }));
  } else if (data.instructions) {
    // Fallback: Use the raw 'instructions' string
    // Remove HTML tags (if any)
    const plainTextInstructions = data.instructions.replace(/<[^>]*>?/gm, '');
    steps = plainTextInstructions
      .split(/\r?\n/) // Split by new lines
      .map((s) => s.trim()) // Trim whitespace
      .filter(Boolean) // Remove empty lines
      .map((instruction, index) => ({
        id: index + 1,
        instruction,
      }));
  }

  // 3. Build the final recipe object
  return {
    id: data.id,
    title: data.title,
    image: data.image,
    // Create a description from available data
    description: `A delicious recipe ready in ${data.readyInMinutes} minutes. Serves ${data.servings}.`,
    // Use 'cuisines' or 'dishTypes'
    cuisine: data.cuisines?.join(', ') || data.dishTypes?.join(', ') || "Unknown",
    // Use 'diets'
    dietType: data.diets?.join(', ') || "General",
    difficulty: "N/A", // API doesn't provide this
    ingredients,
    steps,
    // Use 'sourceUrl' as the main link
    youtube: data.sourceUrl || data.spoonacularSourceUrl || null,
    // Store these new fields for display
    readyInMinutes: data.readyInMinutes,
    servings: data.servings,
  };
};

// --- Main Component ---

export default function RecipeDetailApi() {
  // --- State Declarations ---

  // Page loading and error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Recipe data
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);

  // UI interaction state
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState(new Set());
  const [isingredientsList, setIsIngredientsList] = useState(false);
  const [aiIngredients, setAiIngredients] = useState({});
  const [generatelistloading, setGeneratelistloading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // AI Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  // --- Refs ---
  const chatScrollRef = useRef(null);

  // --- Effects ---

  /**
   * MODIFIED: Effect to fetch recipe details from the Spoonacular API
   */
  useEffect(() => {
    if (!id) {
      setError("No recipe ID provided.");
      setLoading(false);
      return;
    }

    const fetchRecipeDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        // Using the Spoonacular API endpoint from your original simple component
        // FIXED: Use the full absolute URL to call the backend API
        const res = await fetch(`http://127.0.0.1:8000/api/spoonculardetail/${id}/`);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        
        if (data) {
          // Use our new "translator" function
          setRecipe(formatSpoonacularData(data));
        } else {
          setError("Recipe not found.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load recipe. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipeDetails();
  }, [id]); // Re-run only if ID changes

  /**
   * Effect to scroll the chat window to the bottom
   */
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  // --- Event Handlers ---

  /**
   * Handles sending a message to the AI chat.
   * This context now works because formatSpoonacularData provides
   * all the fields (title, cuisine, ingredients, steps).
   */
  const handleSendChat = async () => {
    const contentToSend = chatInput.trim();
    if (!contentToSend || !recipe || chatLoading) return;

    setChatLoading(true);
    setChatError(null);

    const userMessage = {
      id: Date.now().toString(),
      type: "user",
      content: contentToSend,
      timestamp: new Date(),
    };

    const typingMessage = {
      id: "typing",
      type: "assistant",
      content: "ChefGenie is thinking...",
      timestamp: new Date(),
    };

    const newMessagesForApi = [...chatMessages, userMessage];
    setChatMessages((prev) => [...prev, userMessage, typingMessage]);
    setChatInput("");

    // Create the API payload with recipe context
    const recipeContext = {
      role: "model",
      content: `Recipe context:\nTitle: ${recipe.title}\nCuisine: ${
        recipe.cuisine
      }\nCategory: ${recipe.dietType}\nIngredients:\n${recipe.ingredients
        .map((i) => `- ${i.item}`)
        .join("\n")}\nSteps:\n${recipe.steps
        .slice(0, 20) // Limit context size
        .map((s) => `${s.id}. ${s.instruction}`)
        .join("\n")}`,
    };

    const historyMessages = newMessagesForApi.map((msg) => ({
      role: msg.type === "user" ? "user" : "model",
      content: msg.content,
    }));

    const apiMessages = [recipeContext, ...historyMessages];

    try {
      // NOTE: This assumes you have an '/api/detail-page-ai/' endpoint.
      // FIXED: Use the full absolute URL to call the backend API
      const res = await fetch("http://127.0.0.1:8000/api/detail-page-ai/", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add any other headers like auth if needed
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) {
        throw new Error('AI API request failed');
      }

      const resData = await res.json();
      const assistantText =
        (resData && (resData.reply || resData.output || resData.message)) ||
        "Sorry, I couldn't get a response.";

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: assistantText,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [
        ...prev.filter((msg) => msg.id !== "typing"),
        assistantMessage,
      ]);
    } catch (err) {
      console.error("Error fetching AI reply:", err);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Sorry, I ran into an error. Please try again.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [
        ...prev.filter((msg) => msg.id !== "typing"),
        errorMessage,
      ]);
      setChatError("Sorry, I ran into an error. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  /**
   * Handles the 'Enter' key press in the chat textarea.
   */
  const handleChatKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendChat();
    }
  };

  /**
   * Toggles an ingredient's checked state.
   */
  const toggleIngredient = (id) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  /**
   * Generates a grocery list based on checked ingredients.
   */
  const generateGroceryList = async () => {
    setGeneratelistloading(true);

    const needsToBuy = recipe.ingredients
      .filter((ing) => checkedIngredients.has(ing.id))
      .map((ing) => ing.item);

    try {
      // NOTE: This assumes you have a '/api/grocery-list/' endpoint.
      // FIXED: Use the full absolute URL to call the backend API
      const res = await fetch(`http://127.0.0.1:8000/api/grocery-list/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: needsToBuy }),
      });

      if (!res.ok) {
        throw new Error('Grocery list API request failed');
      }

      const resData = await res.json();
      setAiIngredients(resData.ingredients_sorted);
      setIsIngredientsList(true);
      console.log(resData.ingredients_sorted);
    } catch (err) {
      console.error("Grocery list error:", err);
      // Show an error to the user in a better way if possible
    } finally {
      setGeneratelistloading(false);
    }
  };

  /**
   * Toggles the recipe's favorite status.
   */
  const toggleFavorite = () => {
    setIsFavorite((s) => !s);
    // API call to save favorite status would go here
  };

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading recipe...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 p-6 text-center">
        {error}
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        No recipe data available.
      </div>
    );
  }

  // 4. Success State (Main Render)
  return (
    <div className="min-h-screen flex flex-col md:flex-row relative overflow-x-hidden">
      {/* --- Left / Main column --- */}
      <div
        className={`w-full ${
          isChatOpen ? "md:w-2/3" : "md:w-full"
        } transition-all duration-300`}
      >
        {/* --- Image Header --- */}
        <div className="relative h-96 overflow-hidden">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src =
                "https://placehold.co/1200x600/e2e8f0/64748b?text=Image+Not+Available";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

          {/* --- Recipe Info Box (overlaps image) --- */}
          <div className="absolute bottom-6 left-4 right-4 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-800 bg-opacity-90 backdrop-blur-md rounded-2xl p-6 border dark:border-gray-700 shadow-2xl">
              <div className="flex flex-col md:flex-row md:justify-between gap-4">
                <div className="flex-1">
                  {/* Tags */}
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    {recipe.cuisine !== "Unknown" && (
                      <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm">
                        {recipe.cuisine}
                      </span>
                    )}
                    {recipe.dietType !== "General" && (
                       <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                        {recipe.dietType}
                       </span>
                    )}
                  </div>
                  {/* Title & Description */}
                  <h1 className="text-xl md:text-2xl font-bold mb-2 text-gray-900 dark:text-white">{recipe.title}</h1>
                  <p className="text-gray-700 dark:text-gray-300">{recipe.description}</p>
                  
                  {/* NEW: Added readyInMinutes and servings */}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-800 dark:text-gray-200">
                    <span className="font-medium">
                      Ready in:{" "}
                      <span className="font-normal">{recipe.readyInMinutes} mins</span>
                    </span>
                    <span className="font-medium">
                      Servings:{" "}
                      <span className="font-normal">{recipe.servings}</span>
                    </span>
                  </div>
                </div>
                {/* Favorite Button */}
                <button
                  className={`flex-shrink-0 rounded-full w-12 h-12 flex items-center justify-center border ${
                    isFavorite
                      ? "bg-red-500 text-white border-red-600"
                      : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                  }`}
                  onClick={toggleFavorite}
                  aria-label="Toggle favorite"
                >
                  <Heart
                    className={`w-6 h-6 ${isFavorite ? "fill-current" : ""}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- Main Content Area (below image) --- */}
        <div className="max-w-5xl mx-auto px-4 py-8 relative">
          
          {/* ADDED: Back Link */}
          <Link to="/" className="text-blue-500 dark:text-blue-400 mb-4 inline-block">
            ← Back to Recipes
          </Link>

          {/* --- Action Buttons --- */}
          <div className="flex flex-wrap gap-4 mb-8">
            {recipe.youtube ? (
              <a
                href={recipe.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:opacity-90 transition-opacity"
              >
                <Play className="w-5 h-5" /> {recipe.youtube.includes('youtube.com') ? 'Watch on YouTube' : 'View Source'}
              </a>
            ) : (
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-400 text-white opacity-60 cursor-not-allowed"
                disabled
              >
                <Play className="w-5 h-5" /> No Video/Source Link
              </button>
            )}

            <button
              onClick={() => setIsChatOpen(true)} // Opens AI chat
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
            >
              <Sparkles className="w-5 h-5" /> Ask AI Chef
            </button>
          </div>

          {/* --- Ingredients & Instructions Grid --- */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* --- Ingredients Card (Sticky) --- */}
            <div className="md:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border dark:border-gray-700 shadow-md sticky top-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Ingredients</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Check items you need to buy.
                </p>

                <div className="space-y-3">
                  {recipe.ingredients.map((ing) => (
                    <div key={ing.id} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={`ing-${ing.id}`}
                        checked={checkedIngredients.has(ing.id)} // checked = user *needs* to buy
                        onChange={() => toggleIngredient(ing.id)}
                        className="mt-1 accent-green-600 rounded"
                      />
                      <label
                        htmlFor={`ing-${ing.id}`}
                        className={`cursor-pointer text-gray-800 dark:text-gray-200 ${
                          checkedIngredients.has(ing.id)
                            ? "font-medium" // Style for 'need to buy'
                            : "text-gray-600 dark:text-gray-400" // Style for 'already have'
                        }`}
                      >
                        {ing.item}
                      </label>
                    </div>
                  ))}
                </div>

                <button
                  onClick={generateGroceryList}
                  disabled={generatelistloading || checkedIngredients.size < 1}
                  className={`w-full mt-6 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white transition 
                  ${
                    generatelistloading || checkedIngredients.size < 1
                      ? "cursor-not-allowed bg-gray-400 dark:bg-gray-600"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {!generatelistloading ? "Generate List" : "Generating..."}
                </button>
              </div>
            </div>

            {/* --- Instructions Card --- */}
            <div className="md:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border dark:border-gray-700 shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Instructions</h2>
                {recipe.steps.length > 0 ? (
                  <div className="space-y-6">
                    {recipe.steps.map((step) => (
                      <div key={step.id} className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                          {step.id}
                        </div>
                        <p className="flex-1 pt-1 text-gray-800 dark:text-gray-200">{step.instruction}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">No instructions available for this recipe.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Right / Chat Panel --- */}
      {isChatOpen && (
        <aside className="fixed inset-y-0 right-0 w-full md:w-1/3 bg-white dark:bg-gray-800 border-l dark:border-gray-700 shadow-lg flex flex-col z-50">
          {/* --- Chat Header --- */}
          <div className="flex bg-gray-100 dark:bg-gray-700 items-center justify-between p-4 border-b dark:border-gray-600">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Chef Assistant</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ask anything about this recipe
              </p>
            </div>
            <button
              onClick={() => setIsChatOpen(false)} // Closes panel
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* --- Chat Scrollable Area --- */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900"
          >
            {chatMessages.length === 0 && !chatLoading && (
              <div className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-white dark:bg-gray-800 rounded-lg">
                Ask me for ingredient substitutions, clarification on steps, or anything else!
              </div>
            )}

            {chatMessages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md p-3 rounded-xl shadow-sm ${
                    m.type === "user"
                      ? "bg-purple-500 text-white"
                      : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {m.content}
                  </div>
                </div>
              </div>
            ))}

            {chatError && (
              <div className="text-sm text-red-500">{chatError}</div>
            )}
          </div>

          {/* --- Chat Input Area --- */}
          <div className="p-4 border-t dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center gap-2">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
              placeholder="Ask a question..."
              className="flex-1 w-full rounded-md p-3 text-sm resize-none h-14 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              rows={1}
            />
            <button
              onClick={handleSendChat}
              disabled={chatLoading || !chatInput.trim()}
              className={`h-full px-4 py-2 rounded-md text-white font-semibold transition-colors ${
                chatLoading || !chatInput.trim()
                  ? "bg-purple-300 cursor-not-allowed"
                  : "bg-gradient-to-br from-purple-500 to-pink-500 hover:opacity-90"
              }`}
            >
              {chatLoading ? "..." : "Send"}
            </button>
          </div>
        </aside>
      )}

      {/* --- Grocery List Panel --- */}
      {isingredientsList && (
        <GroceryListPanel
          recipe={aiIngredients}
          setIsGroceryList={setIsIngredientsList}
          Reciepename={recipe.title}
        />
      )}
    </div>
  );
}

