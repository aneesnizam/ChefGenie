from django.urls import path, include
from .views import HomeRecipes,RecipeDetail,RecipeFilter,GeminiChat,GeminiRecipeDetail,RecipeAIChat,GroceryList,SpoonacularRecipeDetail,SpoonacularRecipes


urlpatterns = [
  path('homerecipes/',HomeRecipes.as_view(),name="home_recipes"),
  path('recipedetail/<int:id>/',RecipeDetail.as_view(),name="recipe_detail"),
  path('recipefilter/<str:name>/',RecipeFilter.as_view(),name="recipe_filter"),
  path('chatbot/',GeminiChat.as_view(),name="chatbot"),
  path('recipe-ai/',GeminiRecipeDetail.as_view(),name="recipe_ai"),
  path('detail-page-ai/',RecipeAIChat.as_view(),name="detail_page_ai"),
  path('grocery-list/',GroceryList.as_view(),name="grocery_list"),
  path('spooncularrecipes/', SpoonacularRecipes.as_view(), name='spoonacular_recipes'),
  path('spoonculardetail/<int:recipe_id>/', SpoonacularRecipeDetail.as_view(),name='spoonacular_recipe_detail'),
]
