import { Sparkles, ChefHat, Utensils, LogIn, UserPlus } from "lucide-react";
import Logo from "../assets/logo/Logo.png";
import { useNavigate } from "react-router-dom";

export default function LandingPage( ) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[linear-gradient(180deg,#ffecd1_0%,#fdf8f3_50%,#f4ede3_100%)] dark:bg-[linear-gradient(180deg,#1a1410_100%)] text-foreground">
      
      {/* ===== HEADER ===== */}
      <header className="flex justify-between items-center px-6 py-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img src={Logo} alt="ChefGenie Logo" className="rounded-2xl w-10 h-10" />
          <h1 className="text-2xl font-bold tracking-wide">ChefGenie</h1>
        </div>

        <div className="flex items-center gap-4">
           <button
            onClick={() => navigate("/app/home")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-blue-700 border-2 border-blue-700 hover:bg-blue-700 hover:text-white transition-all"
          >
            Home
          </button>
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-primary border-2 border-primary hover:bg-primary hover:text-white transition-all"
          >
            <LogIn className="w-4 h-4" /> Login
          </button>
          <button
            onClick={() => navigate("/register")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-primary to-secondary text-white shadow-md hover:opacity-90 transition-all"
          >
            <UserPlus className="w-4 h-4" /> Sign Up
          </button>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="text-center px-6 md:px-16 py-16 md:py-24 flex flex-col items-center justify-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          <h2 className="text-4xl md:text-6xl font-bold">Your AI Cooking Companion</h2>
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
        </div>

        <p className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-8">
          Discover delicious recipes, plan meals, and chat with your personal AI chef — ChefGenie makes cooking smarter and easier.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate("signup")}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-lg transition-all flex items-center justify-center"
          >
            <ChefHat className="w-5 h-5 mr-2" /> Get Started
          </button>
          <button
            onClick={() => navigate("/app/recipes")}
            className="px-6 py-3 rounded-xl border-2 border-border text-foreground font-semibold hover:bg-muted transition-all flex items-center justify-center"
          >
            <Utensils className="w-5 h-5 mr-2" /> Explore Recipes
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="text-center py-6 text-sm text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} ChefGenie — Crafted with ❤️ by Anees
      </footer>
    </div>
  );
}
