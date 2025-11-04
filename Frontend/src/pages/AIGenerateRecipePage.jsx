import { useState } from "react";
import { Sparkles, Send,ArrowLeft  } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../services/axios";

export default function AIGenerateRecipePage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);

    try {
      const response = await axiosInstance.post("/api/recipe-ai/", {
      "prompt":prompt
      });

     
      const data = response.data;
      console.log(data)

      if (data?.meals?.length > 0) {
        const recipeId = data.meals[0].idMeal || "ai-generated";
        navigate(`/app/recipe/${recipeId}`, { state: data });
      } else {
        alert("AI couldn’t generate a recipe. Try again!");
      }
    } catch (err) {
      console.error("Error generating recipe:", err);
      alert("Failed to generate recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br relative from-slate-900 via-purple-900 to-black text-white flex flex-col items-center justify-center p-6">
         <button
        onClick={() => navigate("/app/recipes")}
        className="absolute top-6 left-6 flex items-center gap-2 text-fuchsia-200 hover:text-fuchsia-400 font-medium transition-all duration-200"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Search
      </button>
        
      <div className="max-w-3xl w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-10 relative overflow-hidden">
      
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-pink-500/30 blur-3xl -z-10"></div>

        <div className="flex items-center justify-center gap-3 mb-8">
          <Sparkles className="w-7 h-7 text-yellow-300 animate-pulse" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
            AI Recipe Generator
          </h1>
          <Sparkles className="w-7 h-7 text-cyan-300 animate-pulse" />
        </div>

        <p className="text-center text-gray-300 mb-8 text-lg">
          Describe what you’d like — for example: <br />
          <span className="italic text-fuchsia-300">
            “Suggest a quick 30-minute vegetarian dinner using paneer”
          </span>
        </p>

        <textarea
          className="w-full min-h-[150px] p-4 rounded-2xl bg-black/40 border border-fuchsia-500/40 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 text-lg transition"
          placeholder="Enter your recipe idea here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-8 w-full py-4 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 font-semibold text-lg flex items-center justify-center gap-3 hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              Generating Recipe...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Generate Recipe
            </>
          )}
        </button>
      </div>
    </div>
  );
}
