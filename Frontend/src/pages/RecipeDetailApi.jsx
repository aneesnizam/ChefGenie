import { useEffect, useState, useRef } from "react";
import { Heart, Play, ShoppingCart, Sparkles, X } from "lucide-react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import GroceryListPanel from "../components/GroceryListPanel";
import axiosInstance from "../services/axios";

// --- Utility Function ---

const formatRecipeData = (meal) => {
  if (!meal) return null;

  // Ingredients from DB (already an array)
  const ingredients = meal.ingredients?.map((item, idx) => ({
    id: idx + 1,
    item,
  })) || [];

  // Instructions → split by line for steps
  const steps = (meal.instructions || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((instruction, index) => ({
      id: index + 1,
      instruction,
    }));

  return {
    id: meal.id,
    mealid: meal.mealid || meal.id, // Use mealid if available, fallback to id
    title: meal.title,
    image: meal.image,
    description: `A delicious ${meal.area || ""} ${Array.isArray(meal.category) ? meal.category.join(", ") : meal.category || ""} dish.`,
    cuisine: meal.area || "Unknown",
    dietType: Array.isArray(meal.category) ? meal.category.join(", ") : meal.category || "General",
    difficulty: "N/A",
    ingredients,
    steps,
    youtube: meal.youtube,
  };
};

const formatSpoonacularRecipe = (data) => {
  if (!data) return null;

  const ingredients =
    data.extendedIngredients?.map((ing, idx) => ({
      id: idx + 1,
      item: ing.original,
    })) || [];

  const steps =
    data.analyzedInstructions?.[0]?.steps?.map((step) => ({
      id: step.number,
      instruction: step.step,
    })) ||
    (data.instructions
      ? [{ id: 1, instruction: data.instructions }]
      : []);

  return {
    id: data.id,
    title: data.title,
    image: data.image,
    description: data.summary?.replace(/<[^>]+>/g, "") || "A tasty dish.",
    cuisine: data.cuisines?.[0] || "Unknown",
    dietType: data.dishTypes?.[0] || "General",
    difficulty: "N/A",
    ingredients,
    steps,
    youtube: null,
  };
};


// --- Main Component ---

export default function RecipeDetailApi() {
  // --- State Declarations ---

  // Page loading and error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params] = useSearchParams();
  // console.log(Boolean(params.get("m")))
  const [isSpoonacular, setIsSpoonacular] = useState(Boolean(params.get("m")))

  // Recipe data
  const { id } = useParams();
  const location = useLocation();
  // Try to get recipe from location state first (passed from previous page)
  const [recipe, setRecipe] = useState(
    location.state?.recipe ? formatRecipeData(location.state.recipe) : null

  );
  // Flag to show "AI Generated" badge
  const isAIRecipe = Boolean(location.state?.meals);
  // const isSpoonacular = Boolean(params);


  // UI interaction state
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState(new Set());
  const [groceryList, setGroceryList] = useState([]); // Note: This state is set but not currently used in the JSX.
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isingredientsList, setIsIngredientsList] = useState(false);
  const [aiIngredients, setAiIngredients] = useState({});
  const [generatelistloading, setGeneratelistloading] = useState(false);
  // AI Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);


  // --- Refs ---

  // Ref to auto-scroll the chat window
  const chatScrollRef = useRef(null);

  // --- Effects ---

  /**
   * Effect to fetch recipe details if not passed in location state.
   */


useEffect(() => {
  if (recipe) {
    setLoading(false);
    return;
  }

  if (!id) {
    setError("No recipe ID provided.");
    setLoading(false);
    return;
  }


  const fetchRecipe = async () => {
    setLoading(true);
    try {
      if (isSpoonacular) {
        // Fetch from Spoonacular
        console.log("check", isSpoonacular)
        console.log("spoon")
        const res = await axiosInstance.get(`/api/spoonculardetail/${id}/`);
        if (res.data && res.data.title) {
          setRecipe(formatSpoonacularRecipe(res.data));
          console.log(formatSpoonacularRecipe(res.data))
        } else {
          setError("Recipe not found in Spoonacular.");
        }
      } else {
        // Fetch from MealDB
        console.log("meal")
        const res = await axiosInstance.get(`/api/recipedetail/${id}/`);
        if (res.data && res.data.title) {
          setRecipe(formatRecipeData(res.data));
          console.log(formatRecipeData(res.data));
        } else {
          setError("Recipe not found in database.");
        }

      }
    } catch (err) {
      console.error("Error fetching recipe:", err);
      setError("Failed to load recipe. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  fetchRecipe();
}, [id, recipe, isSpoonacular]);

/**
 * Effect to check if recipe is favorited when recipe data is available
 * Only for non-Spoonacular recipes (they don't have mealid in our DB)
 */
useEffect(() => {
  if (!recipe || isSpoonacular) return;

  // Use mealid if available, otherwise use id (which should be mealid from URL param)
  const mealid = recipe.mealid || recipe.id || id;

  // Check if recipe is in favorites
  axiosInstance
    .get("/api/favorites/")
    .then((res) => {
      const favoriteMealIds = new Set(
        res.data.favorites.map((fav) => fav.meal.mealid)
      );
      setIsFavorite(favoriteMealIds.has(mealid));
    })
    .catch((err) => {
      console.error("Failed to check favorite status:", err);
    });
}, [recipe, isSpoonacular, id]);


  /**
   * Effect to scroll the chat window to the bottom
   * when new messages are added or loading status changes.
   */
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]); // Re-run when messages or loading state change

  // --- Event Handlers ---

  /**
   * Handles sending a message to the AI chat.
   */
  const handleSendChat = async () => {
    const contentToSend = chatInput.trim();
    // Prevent sending empty messages or while already loading
    if (!contentToSend || !recipe || chatLoading) return;

    setChatLoading(true);
    setChatError(null); // Clear any previous errors

    // 1. Create the user's message
    const userMessage = {
      id: Date.now().toString(),
      type: "user",
      content: contentToSend,
      timestamp: new Date(),
    };

    // 2. Create a temporary "typing" message
    const typingMessage = {
      id: "typing",
      type: "assistant",
      content: "ChefGenie is thinking...",
      timestamp: new Date(),
    };

    // 3. This list is for the API payload (doesn't include "typing")
    const newMessagesForApi = [...chatMessages, userMessage];

    // 4. Update UI immediately to show user message + typing indicator
    setChatMessages((prev) => [...prev, userMessage, typingMessage]);
    setChatInput(""); // Clear the input field

    // 5. Create the API payload with recipe context
    const recipeContext = {
      role: "model",
      content: `Recipe context:\nTitle: ${recipe.title}\nCuisine: ${
        recipe.cuisine
      }\nCategory: ${recipe.dietType}\nIngredients:\n${recipe.ingredients
        .map((i) => `- ${i.item}`)
        .join("\n")}\nSteps:\n${recipe.steps
        .slice(0, 20)
        .map((s) => `${s.id}. ${s.instruction}`)
        .join("\n")}`,
    };

    const historyMessages = newMessagesForApi.map((msg) => ({
      role: msg.type === "user" ? "user" : "model",
      content: msg.content,
    }));

    const apiMessages = [recipeContext, ...historyMessages];

    try {
      // 6. Send to API
      console.log("Sending payload:", { messages: apiMessages });
      const res = await axiosInstance.post("/api/detail-page-ai/", {
        messages: apiMessages,
      });

      // 7. Get reply text
      const assistantText =
        (res.data && (res.data.reply || res.data.output || res.data.message)) ||
        "Sorry, I couldn't get a response.";

      // 8. Create final assistant message
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: assistantText,
        timestamp: new Date(),
      };

      // 9. Replace "typing" message with the real response
      setChatMessages((prev) => [
        ...prev.filter((msg) => msg.id !== "typing"), // Remove "typing"
        assistantMessage, // Add real response
      ]);
    } catch (err) {
      console.error("Error fetching AI reply:", err);

      // 10. Handle errors by replacing "typing" with an error message
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Sorry, I ran into an error. Please try again.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [
        ...prev.filter((msg) => msg.id !== "typing"), // Remove "typing"
        errorMessage, // Add error message
      ]);
      setChatError("Sorry, I ran into an error. Please try again.");
    } finally {
      // 11. ALWAYS set loading to false
      setChatLoading(false);
    }
  };

  /**
   * Handles the 'Enter' key press in the chat textarea.
   * @param {React.KeyboardEvent} event
   */
  const handleChatKeyDown = (event) => {
    // Check for "Enter" key without the "Shift" key
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevent adding a new line
      handleSendChat();
    }
  };

  /**
   * Toggles an ingredient's checked state in the list.
   * We are checking items the user *needs* to buy (doesn't have).
   * @param {number} id - The ingredient ID.
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
   * Currently logs to console and sets state (which isn't used in JSX).
   */
  const generateGroceryList = () => {
    setGeneratelistloading(true);

    const needsToBuy = recipe.ingredients
      .filter((ing) => checkedIngredients.has(ing.id))
      .map((ing) => ing.item);

    axiosInstance
      .post(`/api/grocery-list/`, {
        ingredients: needsToBuy,
      })
      .then((res) => {
        setAiIngredients(res.data.ingredients_sorted);
        setIsIngredientsList(true);
         console.log(res.data.ingredients_sorted)
      })
      .catch(() => setError("Failed to load recipe. Please try again later."))
      .finally(() => setGeneratelistloading(false));
  };

  /**
   * Toggles the recipe's favorite status.
   */
  const toggleFavorite = () => {
    if (!recipe) return;
    
    // For Spoonacular recipes, we can't favorite them (they don't have mealid in our DB)
    if (isSpoonacular) {
      console.warn("Cannot favorite Spoonacular recipes");
      return;
    }
    
    // Use mealid if available, otherwise use id (which should be mealid from URL param)
    const mealid = recipe.mealid || recipe.id || id;
    
    // Optimistically update UI
    setIsFavorite((prev) => !prev);

    // Make API call to toggle favorite
    axiosInstance
      .post("/api/favorites/toggle/", { mealid })
      .then((res) => {
        // Update state based on API response
        setIsFavorite(res.data.is_favorited);
      })
      .catch((err) => {
        // Revert optimistic update on error
        setIsFavorite((prev) => !prev);
        console.error("Failed to toggle favorite:", err);
      });
  };

  // --- Render Logic ---

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading recipe...
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  // 3. No Recipe State
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
      {/* Adjusts width based on chat panel visibility */}
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
              // Fallback image in case the src fails
              e.currentTarget.src =
                "https://static.vecteezy.com/system/resources/previews/013/224/085/non_2x/recipe-book-on-wooden-table-background-banner-free-vector.jpg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

          {/* --- Recipe Info Box (overlaps image) --- */}
          <div className="absolute bottom-6 left-4 right-4 max-w-5xl mx-auto">
            <div className=" bg-card backdrop-blur-md rounded-2xl p-6 border shadow-2xl">
              <div className="flex flex-col md:flex-row md:justify-between gap-4">
                <div className="flex-1">
                  {/* Tags */}
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm">
                      {recipe.cuisine}
                    </span>
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                      {recipe.dietType}
                    </span>
                  </div>
                  {/* Title & Description */}
                  <h1 className="text-xl font-bold mb-2">{recipe.title}</h1>
                  <p className="text-muted-foreground">{recipe.description}</p>
                </div>
                {/* Favorite Button - Only show for non-Spoonacular recipes */}
                {!isSpoonacular && (
                  <button
                    className={`rounded-full w-12 h-12 flex items-center justify-center border ${
                      isFavorite
                        ? "bg-red-500 text-white"
                        : "border-gray-300 text-gray-500"
                    }`}
                    onClick={toggleFavorite}
                    aria-label="Toggle favorite"
                  >
                    <Heart
                      className={`w-6 h-6 ${isFavorite ? "fill-current" : ""}`}
                    />
                  </button>
                )}
              </div>
              <div className="my-4 border-t"></div>
            </div>
          </div>
        </div>

        {/* --- Main Content Area (below image) --- */}
        <div className="max-w-5xl mx-auto px-4 py-8 relative">
          {isAIRecipe && (
            <span className="absolute right-0 text-xs bg-yellow-400 text-black px-2 py-1 rounded-full font-semibold">
              AI Generated
            </span>
          )}

          {/* --- Action Buttons --- */}
          <div className="flex flex-wrap gap-4 mb-8">
            {recipe.youtube ? (
              <a
                href={recipe.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              >
                <Play className="w-5 h-5" /> Watch on YouTube
              </a>
            ) : (
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white opacity-60 cursor-not-allowed"
                disabled
              >
                <Play className="w-5 h-5" /> Cook Mode (No Video)
              </button>
            )}

            <button
              onClick={() => setIsChatOpen(true)} // Opens AI chat
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              <Sparkles className="w-5 h-5" /> Ask AI Chef
            </button>
          </div>

          {/* --- Ingredients & Instructions Grid --- */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* --- Ingredients Card (Sticky) --- */}
            <div className="md:col-span-1">
              <div className="bg-card rounded-2xl p-6 border sticky top-6">
                <h2 className="font-semibold mb-4">Ingredients</h2>
                <p className="text-sm text-gray-500 mb-3">
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
                        className="mt-1 accent-green-600"
                      />
                      <label
                        htmlFor={`ing-${ing.id}`}
                        className={`cursor-pointer ${
                          checkedIngredients.has(ing.id)
                            ? "text-black dark:text-white font-medium" // Style for 'need to buy'
                            : " text-gray-500 " // Style for 'already have'
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
                  className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-white transition 
    ${
      generatelistloading || checkedIngredients.size < 1
        ? "cursor-not-allowed bg-gray-600"
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
              <div className="bg-card rounded-2xl p-6 border mb-8">
                <h2 className="font-semibold mb-6">Instructions</h2>
                <div className="space-y-6">
                  {recipe.steps.map((step) => (
                    <div key={step.id} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
                        {step.id}
                      </div>
                      <p className="flex-1 pt-1">{step.instruction}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Right / Chat Panel --- */}
      {/* This section is only rendered if 'isChatOpen' is true */}
      {isChatOpen && (
        <aside className="fixed right-0 pb-5  h-[90vh] w-full md:w-1/3 bg-background border-l shadow-lg flex flex-col z-50">
          {/* --- Chat Header --- */}
          <div className="flex bg-muted/40 items-center justify-between p-4 border-b">
            <div>
              <h3 className="text-lg font-semibold">AI Chef Assistant</h3>
              <p className="text-sm text-muted-foreground">
                Ask anything about this recipe
              </p>
            </div>
            <button
              onClick={() => setIsChatOpen(false)} // Closes panel
              className="p-2 rounded-full hover:bg-card"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* --- Chat Scrollable Area --- */}
          <div
            ref={chatScrollRef}
            className=" cheif-scroll flex flex-col flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-card/10"
          >
            {/* Welcome message */}
            {chatMessages.length === 0 && !chatLoading && (
              <div className="text-sm text-muted-foreground">
                Ask me anything about ingredients, timing, substitutions, etc.
              </div>
            )}

            {/* Chat messages */}
            {chatMessages.map((m) => (
              <div
                key={m.id}
                className={`max-w-fit flex flex-col ${
                  m.type === "user" ? "ml-auto text-right" : ""
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-xl  ${
                    m.type === "user"
                      ? "bg-purple-500 text-white"
                      : "bg-card border border-border "
                  }`}
                >
                  <div className=" text-sm whitespace-pre-wrap text-justify">
                    {m.content}
                  </div>
                </div>
                <div
                  className={` text-xs text-muted-foreground mt-1 ${
                    m.type === "user" ? "" : "float-right"
                  }`}
                >
                  {m.type === "user" ? "You" : "Assistant"}
                </div>
              </div>
            ))}

            {/* Loading indicator (this is handled by the "typing" message) */}

            {/* Error message display */}
            {chatError && (
              <div className="text-sm text-red-500">{chatError}</div>
            )}
          </div>

          {/* --- Chat Input Area --- */}
          <div className="p-4 border-t flex items-center gap-2">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown} // <-- BUG FIX
              placeholder="Ask about this recipe (press Enter to send)"
              className="cheif-scroll w-full rounded-md p-3 text-sm resize-none h-14 border-none outline-none focus:ring-2 focus:ring-muted-foreground focus:border-muted"
            />
            <button
              onClick={handleSendChat}
              disabled={chatLoading || !chatInput.trim()}
              className={`h-fit px-4 py-2 rounded-md text-white  ${
                chatLoading || !chatInput.trim()
                  ? "bg-gradient-to-br from-purple-300 to-pink-300 cursor-not-allowed"
                  : "bg-gradient-to-br from-purple-500 to-pink-500"
              }`}
            >
              {chatLoading ? "...." : "Send"}
            </button>
          </div>
        </aside>
      )}
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
