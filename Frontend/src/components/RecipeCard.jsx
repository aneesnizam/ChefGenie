import { Heart } from 'lucide-react';
import { useState } from 'react';

export default function RecipeCard({
  idMeal,
  strMeal,
  strMealThumb,
  strCategory,
  strArea,
  isFavorite = false,
  onToggleFavorite,
  onClick,
  loading = false
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`group relative ${loading ? "bg-gray-200" : "bg-card"} rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer ${loading ? "animate-pulse" : ""}`}
      onClick={() => onClick && onClick(idMeal)}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-300">
        {strMealThumb ? (
          <img
            src={imgError ? 'https://static.vecteezy.com/system/resources/previews/003/170/825/original/isolated-food-plate-fork-and-spoon-design-free-vector.jpg' : strMealThumb}
            alt={strMeal || "Recipe image"}
            className={`w-full h-full object-cover transition-transform duration-300 ${loading ? ' opacity-0' : 'group-hover:scale-110'}`}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">No image</span>
          </div>
        )}


        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(idMeal);
            }}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
              }`}
            />
          </button>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {strArea && strArea!="Unknown" && (
            <span className="bg-white/90 text-black backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold">
              {strArea}
            </span>
          )}
          {strCategory && (
            <span className="bg-secondary text-secondary-foreground backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold">
              {strCategory.split(",")[0]}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="mb-1 line-clamp-2 font-semibold text-base">
          {strMeal}
        </h3>
      </div>
    </div>
  );
}
