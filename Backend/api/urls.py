from django.urls import path, include
from .views import HomeRecipes, RecipeDetail, RecipeFilter, GeminiChat, GeminiRecipeDetail, RecipeAIChat, GenerateGroceryList, SpoonacularRecipeDetail, SpoonacularRecipes, IngredientsFilter, GroceryListCreate, ListFavorites, ToggleFavorite, RecentRecipeViews, SaveAIRecipe, ListAIRecipes, ShareAIRecipe, UnshareAIRecipe, DeleteAIRecipe


urlpatterns = [
    path('homerecipes/', HomeRecipes.as_view(), name="home_recipes"),
    path('recipedetail/<str:id>/', RecipeDetail.as_view(), name="recipe_detail"),
    path('ingredientfilter/<path:ingredients>/',
         IngredientsFilter.as_view(), name="ingredient_filter"),
    path('recipefilter/<str:name>/', RecipeFilter.as_view(), name="recipe_filter"),
    path('chatbot/', GeminiChat.as_view(), name="chatbot"),
    path('recipe-ai/', GeminiRecipeDetail.as_view(), name="recipe_ai"),
    path('detail-page-ai/', RecipeAIChat.as_view(), name="detail_page_ai"),
    path('grocery-list/', GenerateGroceryList.as_view(), name="grocery_list"),
    path('spooncularrecipes/', SpoonacularRecipes.as_view(),
         name='spoonacular_recipes'),
    path('spoonculardetail/<int:recipe_id>/',
         SpoonacularRecipeDetail.as_view(), name='spoonacular_recipe_detail'),
    path('grocery-list-create/', GroceryListCreate.as_view(),
         name="grocery_list_create"),
    path("grocery-list-create/<int:pk>/",
         GroceryListCreate.as_view(), name="grocery-list-delete"),
    path('favorites/', ListFavorites.as_view(), name="list_favorites"),
    path('favorites/toggle/', ToggleFavorite.as_view(), name="toggle_favorite"),
    path('recent-views/', RecentRecipeViews.as_view(), name="recent_views"),
    path('ai-recipes/save/', SaveAIRecipe.as_view(), name="save_ai_recipe"),
    path('ai-recipes/', ListAIRecipes.as_view(), name="list_ai_recipes"),
    path('ai-recipes/share/', ShareAIRecipe.as_view(), name="share_ai_recipe"),
    path('ai-recipes/unshare/', UnshareAIRecipe.as_view(), name="unshare_ai_recipe"),
    path('ai-recipes/<int:meal_id>/',
         DeleteAIRecipe.as_view(), name="delete_ai_recipe"),
]
