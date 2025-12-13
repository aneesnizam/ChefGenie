from google.ai.generativelanguage_v1beta.types import permission
from rest_framework import viewsets
from rest_framework import status, permissions
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
import google.generativeai as genai
from django.conf import settings
import json
import re
from core.models import Meal, GroceryList, Favorite, RecipeView
from core.serializers import MealSerializer, GroceryListSerializer, FavoriteSerializer, RecipeViewSerializer
from django.db.models import Q
from django.db import transaction
from decimal import Decimal, InvalidOperation, getcontext
from fractions import Fraction


try:
    genai.configure(api_key=settings.GEMINI_API_KEY)
except AttributeError:
    print("FATAL ERROR: Gemini API key not configured. Check settings.py")


class HomeRecipes(APIView):
    def get(self, request):
        meal = Meal.objects.all().order_by('-id')[:4]
        try:
            serializer = MealSerializer(meal, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except requests.exceptions.RequestException as e:
            return Response({
                "error": "Failed to fetch recipes"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RecipeDetail(APIView):
    def get(self, request, id):
        try:
            # Search meal by mealid (string in your JSON data)
            # If user is authenticated, prefer their recipe, otherwise get any public or system recipe
            if request.user.is_authenticated:
                meal = Meal.objects.filter(
                    mealid=id,
                    user=request.user
                ).first()
                # If not found, try public recipes or recipes without user
                if not meal:
                    meal = Meal.objects.filter(
                        mealid=id,
                        is_public=True
                    ).first()
                # If still not found, try system recipes (user=None)
                if not meal:
                    meal = Meal.objects.filter(
                        mealid=id,
                        user__isnull=True
                    ).first()
            else:
                # For unauthenticated users, only show public or system recipes
                meal = Meal.objects.filter(
                    mealid=id
                ).exclude(
                    user__isnull=False, is_public=False
                ).first()

            if not meal:
                return Response(
                    {"error": f"No recipe found with id '{id}'."},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Track recipe view if user is authenticated
            # Wrap in try-except to prevent errors from breaking recipe loading
            if request.user.is_authenticated:
                try:
                    RecipeView.objects.create(
                        user=request.user,
                        meal=meal,
                        mealid=id
                    )
                except Exception as view_error:
                    # Log the error but don't fail the request
                    print(f"Failed to track recipe view: {str(view_error)}")
                    # Continue without tracking the view

            serializer = MealSerializer(meal)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"RecipeDetail error: {str(e)}")
            return Response(
                {"error": f"Failed to fetch recipe: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RecipeFilter(APIView):
    def get(self, request, name):
        try:
            # Search meals by name (case-insensitive)
            meals = Meal.objects.filter(title__icontains=name)

            if not meals.exists():
                return Response(
                    {"message": f"No recipes found for '{name}'."},
                    status=status.HTTP_404_NOT_FOUND
                )

            serializer = MealSerializer(meals, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Failed to fetch recipes: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class IngredientsFilter(APIView):
    def get(self, request, ingredients):
        try:
            # Split comma-separated ingredients and clean spaces
            ingredient_list = [i.strip()
                               for i in ingredients.split(",") if i.strip()]

            if not ingredient_list:
                return Response(
                    {"message": "No ingredients provided."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Build query dynamically using Q objects for partial, case-insensitive match
            query = Q()
            for ing in ingredient_list:
                query &= Q(ingredients__icontains=ing)

            # Filter meals where all ingredients match (partial match)
            meals = Meal.objects.filter(query).distinct()

            if not meals.exists():
                return Response(
                    {"message": f"No recipes found with ingredients: {', '.join(ingredient_list)}."},
                    status=status.HTTP_404_NOT_FOUND
                )

            serializer = MealSerializer(meals, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Failed to fetch recipes: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GeminiChat(APIView):

    # 2. Define your system instructions
    system_instructions = """
    You are a helpful cooking and recipe assistant.
    RULES:
    1.  **Strictly Cooking-Related:** You MUST only answer questions about food, recipes, and cooking.
    2.  **Off-Topic Queries:** If the user asks about any other topic, politely decline.
    3.  **Be Brief and Concise:** Provide short, summary-style answers.
    """

    def post(self, request):
        messages = request.data.get("messages", [])
        if not messages:
            return Response({"error": "Missing 'messages' list."}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Format messages (this part is still correct)
        api_messages = []
        for msg in messages:
            if "role" not in msg or "content" not in msg:
                return Response(
                    {"error": "Invalid message format. Expected {'role': ..., 'content': ...}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            api_messages.append({
                "role": msg["role"],
                "parts": [msg["content"]]
            })

        try:
            # 4. --- THIS IS THE NEW CODE ---
            # We pass the system instructions when creating the model
            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                system_instruction=self.system_instructions
            )

            # 5. Generate the response using the full history
            response = model.generate_content(
                api_messages  # Pass the list of messages directly
            )

            # 6. Return the text
            return Response({"reply": response.text}, status=status.HTTP_200_OK)

        except Exception as e:
            print("Gemini error:", e)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GeminiRecipeDetail(APIView):
    # System instructions for Gemini
    system_instructions = """
    You are a professional cooking assistant.
    RULES:
    1. You must only return valid JSON following this structure.
    2. Only reply if the query is strictly related to food, recipes, cooking, or culinary topics.
    For any off-topic queries, return an empty 'meals' list.
    3. Structure the response as:
        {
        "meals": [
            {
            "idMeal": "6-character or 6-digit unique ID",
            "strMeal": "...",
            "strMealAlternate": null,
            "strCategory": "...",
            "strArea": "...",
            "strInstructions": "Step-by-step instructions separated by \\r\\n for line breaks.",
            "strMealThumb": "...",
            "strTags": "...",
            "strYoutube": "",
            "strIngredient1": "...",
            "strIngredient2": "...",
            ...
            "strIngredient20": "",
            "strMeasure1": "...",
            ...
            "strMeasure20": "",
            "strSource": "",
            "strImageSource": null,
            "strCreativeCommonsConfirmed": null,
            "dateModified": null
            }
        ]
        }
    4. Ensure `idMeal` is always 6 characters or 6 digits.
    5. Always generate your own recipes; do not copy or reference TheMealDB or any external database.
    6. Include detailed cooking instructions in "strInstructions" with line breaks using \\r\\n.
    7. If any value is unknown, set it to an empty string or null.
    8. Never include extra commentary, markdown, or explanation outside the JSON.
    9. Always output valid JSON that can be parsed directly in Python.
    """

    def post(self, request):
        prompt = request.data.get("prompt", "").strip()
        if not prompt:
            return Response(
                {"error": "Missing 'prompt' in request."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Initialize Gemini model
            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                system_instruction=self.system_instructions
            )

            # Generate response for the single prompt
            response = model.generate_content(
                [{"role": "user", "parts": [prompt]}])

            # Extract JSON from text
            text = response.text.strip()
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if not json_match:
                return Response(
                    {"error": "Gemini did not return valid JSON."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            json_str = json_match.group(0)
            try:
                parsed_json = json.loads(json_str)
            except json.JSONDecodeError:
                return Response(
                    {"error": "Invalid JSON format returned by Gemini."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            return Response(parsed_json, status=status.HTTP_200_OK)

        except Exception as e:
            print("Gemini error:", e)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RecipeAIChat(APIView):
    system_instructions = """
        You are a helpful cooking and recipe assistant.
        You will receive a "Recipe context" with ingredients and steps, followed by a user's question.

        RULES:
        1. Answer all questions based on the provided recipe context.
        2. If the user asks for nutritional information (like protein, calories, fat, etc.), you MUST calculate or estimate it based on the ingredient list provided in the context.
        3. If the question is completely off-topic (e.g., "What is the weather?"), politely decline.
        4. Be brief and concise.
        """

    def post(self, request):
        messages = request.data.get("messages", [])
        if not messages:
            return Response({"error": "Missing 'messages' list."}, status=status.HTTP_400_BAD_REQUEST)

        # Transform to Gemini format
        api_messages = [{"role": m["role"], "parts": [m["content"]]}
                        for m in messages]

        try:
            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                system_instruction=self.system_instructions
            )
            response = model.generate_content(api_messages)
            return Response({"reply": response.text}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GenerateGroceryList(APIView):
    system_instructions = """
        You are an expert in food ingredient classification and grocery organization.

        The user will send a list of ingredients in plain text form.  
        For each ingredient, you must extract the following fields:

        - quantity: The numeric or fractional amount (e.g., "1", "½", "1/4").
        - unit: The measurement unit. IMPORTANT: You must choose ONLY from the following allowed units:
            ["mg", "g", "kg", "oz", "lb", "ml", "l", "tsp", "tbsp", "cup", "pinch", "dash", "pcs", "packet", "can", "bottle"]
        - ingredient_name: The cleaned ingredient name without quantity or unit.
        - shop_type: One of the following categories:
            ["Supermarket", "Spices Store", "Vegetable Market", "Dairy Shop", "Meat Shop", "Bakery", "Others"]

        Rules:
        - If no unit is found, set unit to "pcs" by default.
        - Always normalize units to EXACTLY one of the allowed units above.
        - Do NOT invent new units.
        - Do NOT include extra text in output; return only structured fields.

        Return the final result strictly as a valid JSON array of objects.

        Example:
        Input:
        ["¼ cup Vegetable oil", "2 tsp Cumin seeds"]

        Output:
        [
        {
            "quantity": "¼",
            "unit": "cup",
            "ingredient_name": "Vegetable oil",
            "shop_type": "Supermarket"
        },
        {
            "quantity": "2",
            "unit": "tsp",
            "ingredient_name": "Cumin seeds",
            "shop_type": "Spices Store"
        }
        ]
        """

    def post(self, request):
        ingredients = request.data.get("ingredients", [])

        if not ingredients or not isinstance(ingredients, list):
            return Response({"error": "Missing or invalid 'ingredients' list."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                system_instruction=self.system_instructions
            )

            # Build clean input prompt for the model
            prompt = "Sort and structure these ingredients:\n" + \
                json.dumps(ingredients, ensure_ascii=False)
            response = model.generate_content(prompt)

            # Try to extract valid JSON from response
            try:
                parsed_output = json.loads(response.text)
            except json.JSONDecodeError:
                match = re.search(r'\[.*\]', response.text, re.DOTALL)
                parsed_output = json.loads(match.group(0)) if match else {
                    "error": "Failed to parse AI response"}

            return Response({"ingredients_sorted": parsed_output}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SpoonacularRecipes(APIView):
    def get(self, request):
        ingredients = request.GET.get('ingredients', '')
        url = "https://api.spoonacular.com/recipes/findByIngredients"
        params = {
            "ingredients": ingredients,
            "number": 5,
            "apiKey": settings.SPOONACULAR_API_KEY
        }
        response = requests.get(url, params=params)
        return Response(response.json())


# 🍽 2️⃣ Recipe details by ID
class SpoonacularRecipeDetail(APIView):
    def get(self, request, recipe_id):
        url = f"https://api.spoonacular.com/recipes/{recipe_id}/information"
        params = {"apiKey": settings.SPOONACULAR_API_KEY}
        response = requests.get(url, params=params)
        return Response(response.json())


getcontext().prec = 9


def parse_quantity_to_decimal(q):
    """
    Accepts numbers or strings like: "100", "1.5", "1/2", "1 1/2"
    Returns a Decimal or raises ValueError on invalid input.
    """
    if q is None or (isinstance(q, str) and q.strip() == ""):
        raise ValueError("Quantity is required")

    # if already Decimal or int/float
    if isinstance(q, Decimal):
        return q
    if isinstance(q, (int, float)):
        return Decimal(str(q))

    s = str(q).strip()
    # Mixed number like "1 1/2"
    if " " in s:
        parts = s.split()
        if len(parts) == 2:
            whole, frac = parts
            try:
                f = Fraction(frac)
                total = Fraction(int(whole)) + f
                return Decimal(total.numerator) / Decimal(total.denominator)
            except Exception:
                pass

    # simple fraction like "1/2"
    if "/" in s:
        try:
            f = Fraction(s)
            return Decimal(f.numerator) / Decimal(f.denominator)
        except Exception as e:
            raise ValueError(f"Invalid fraction quantity: {q}") from e

    # decimal or integer string
    try:
        return Decimal(s)
    except (InvalidOperation, ValueError) as e:
        raise ValueError(f"Invalid numeric quantity: {q}") from e


class GroceryListCreate(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        payload = request.data
        # recipe_name is ignored (no meal_name field in your model)
        ingredients = payload.get("ingredients") or []

        if not isinstance(ingredients, (list, tuple)) or len(ingredients) == 0:
            return Response(
                {"detail": "ingredients must be a non-empty list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = []
        updated = []
        errors = []

        with transaction.atomic():
            for idx, item in enumerate(ingredients):
                raw_name = (item.get("ingredient_name") or "").strip()
                raw_unit = (item.get("unit") or "").strip()
                raw_shop = item.get("shop_type") or item.get("shop") or ""
                raw_qty = item.get("quantity")

                # Basic validation
                if not raw_name:
                    errors.append(
                        {"index": idx, "error": "ingredient_name is required", "data": item})
                    continue
                if not raw_unit:
                    errors.append(
                        {"index": idx, "error": "unit is required", "data": item})
                    continue

                # Parse quantity (supports "1/2", "1 1/2", "100", "1.5")
                try:
                    qty_decimal = parse_quantity_to_decimal(raw_qty)
                except ValueError as e:
                    errors.append(
                        {"index": idx, "error": str(e), "data": item})
                    continue

                # Try to find existing item: same user, same ingredient (case-insensitive), same unit
                existing = GroceryList.objects.filter(
                    user=request.user,
                    ingredient_name__iexact=raw_name,
                    unit=raw_unit
                ).first()

                if existing:
                    # add quantities
                    old_qty = existing.quantity or Decimal("0")
                    new_qty = (old_qty + qty_decimal).quantize(Decimal("0.01"))
                    existing.quantity = new_qty
                    # update shop only if provided and non-empty
                    if raw_shop:
                        existing.shop = raw_shop
                        existing.save(update_fields=["quantity", "shop"])
                    else:
                        existing.save(update_fields=["quantity"])
                    updated.append({
                        "id": existing.id,
                        "ingredient_name": existing.ingredient_name,
                        "unit": existing.unit,
                        "old_quantity": str(old_qty),
                        "new_quantity": str(new_qty),
                        "shop": existing.shop,
                    })
                else:
                    # build data for serializer (use Decimal for quantity so serializer's DecimalField accepts it)
                    data = {
                        "ingredient_name": raw_name,
                        "quantity": qty_decimal,
                        "unit": raw_unit,
                        "shop": raw_shop,
                    }
                    serializer = GroceryListSerializer(data=data)
                    if serializer.is_valid():
                        obj = serializer.save(user=request.user)
                        created.append(GroceryListSerializer(obj).data)
                    else:
                        errors.append(
                            {"index": idx, "errors": serializer.errors, "data": data})

            # if any validation errors occurred, rollback and return them
            if errors:
                transaction.set_rollback(True)
                return Response(
                    {"detail": "Some ingredients failed validation", "errors": errors},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response({"created": created, "updated": updated}, status=status.HTTP_201_CREATED)

    def get(self, request):
        items = GroceryList.objects.filter(user=request.user)
        serializer = GroceryListSerializer(items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk=None):
        """
        Delete a single grocery item belonging to the logged-in user.
        Endpoint: DELETE /api/grocery-list-create/<pk>/
        """
        if pk is None:
            return Response(
                {"detail": "Please provide an ingredient ID: /api/grocery-list-create/<id>/"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            item = GroceryList.objects.get(id=pk, user=request.user)
        except GroceryList.DoesNotExist:
            return Response(
                {"detail": "Grocery item not found or not owned by the user."},
                status=status.HTTP_404_NOT_FOUND
            )

        item.delete()
        return Response({"detail": "Item deleted successfully."}, status=status.HTTP_200_OK)


class ListFavorites(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Get all favorites for the authenticated user.
        Returns a list of favorite meals ordered by most recently added.
        """
        try:
            favorites = Favorite.objects.filter(
                user=request.user).order_by('-created_at')
            serializer = FavoriteSerializer(favorites, many=True)
            return Response(
                {
                    "count": favorites.count(),
                    "favorites": serializer.data
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch favorites: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ToggleFavorite(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Toggle favorite status for a meal.
        If meal is favorited, remove it. If not favorited, add it.
        Expected payload: {"mealid": "string"}
        Returns: {"is_favorited": bool, "message": "string", "favorite": object or null}
        """
        mealid = request.data.get("mealid")

        if not mealid:
            return Response(
                {"error": "Missing 'mealid' in request."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Find meal by mealid (string identifier)
            meal = Meal.objects.filter(mealid=mealid).first()

            if not meal:
                return Response(
                    {"error": f"No meal found with mealid '{mealid}'."},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Check if favorite already exists
            favorite = Favorite.objects.filter(
                user=request.user,
                meal=meal
            ).first()

            if favorite:
                # Remove favorite
                favorite.delete()
                return Response(
                    {
                        "is_favorited": False,
                        "message": "Meal removed from favorites.",
                        "favorite": None
                    },
                    status=status.HTTP_200_OK
                )
            else:
                # Add favorite
                favorite = Favorite.objects.create(
                    user=request.user,
                    meal=meal
                )
                serializer = FavoriteSerializer(favorite)
                return Response(
                    {
                        "is_favorited": True,
                        "message": "Meal added to favorites.",
                        "favorite": serializer.data
                    },
                    status=status.HTTP_201_CREATED
                )

        except Exception as e:
            return Response(
                {"error": f"Failed to toggle favorite: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RecentRecipeViews(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Get the 5 most recent recipe views for the authenticated user.
        Returns a list of viewed meals ordered by most recently viewed.
        """
        try:
            # Get 5 most recent views, removing duplicates (latest view per meal)
            views = RecipeView.objects.filter(
                user=request.user).order_by('-viewed_at')

            # Remove duplicates, keeping the most recent view for each mealid
            seen_mealids = set()
            unique_views = []
            for view in views:
                if view.mealid not in seen_mealids:
                    unique_views.append(view)
                    seen_mealids.add(view.mealid)
                if len(unique_views) >= 5:
                    break

            serializer = RecipeViewSerializer(unique_views, many=True)
            return Response(
                {
                    "count": len(unique_views),
                    "views": serializer.data
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch recent views: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SaveAIRecipe(APIView):
    """Save an AI-generated recipe to the database"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Save an AI-generated recipe.
        Expected payload: {
            "idMeal": "string",
            "strMeal": "...",
            "strCategory": "...",
            "strArea": "...",
            "strInstructions": "...",
            "strMealThumb": "...",
            "strYoutube": "",
            "strIngredient1": "...",
            "strMeasure1": "...",
            ... (all ingredient/measure fields)
        }
        """
        try:
            meal_data = request.data

            # Extract ingredients and measures
            ingredients_list = []
            for i in range(1, 21):
                ingredient = meal_data.get(f'strIngredient{i}', '').strip()
                if ingredient:
                    measure = meal_data.get(f'strMeasure{i}', '').strip()
                    ingredients_list.append(f"{measure} {ingredient}".strip())

            # Parse category - can be string or array
            category = meal_data.get('strCategory', 'General')
            if isinstance(category, str):
                category = [category] if category else ['General']

            # Generate unique mealid for user (use AI prefix + timestamp)
            import uuid
            mealid = meal_data.get(
                'idMeal', f"AI{str(uuid.uuid4())[:8].upper()}")

            # Create or update meal
            meal, created = Meal.objects.get_or_create(
                mealid=mealid,
                user=request.user,
                defaults={
                    'title': meal_data.get('strMeal', 'Untitled Recipe'),
                    'category': category,
                    'area': meal_data.get('strArea', ''),
                    'instructions': meal_data.get('strInstructions', ''),
                    'ingredients': ingredients_list,
                    'image': None ,
                    'youtube':None,
                    'source': meal_data.get('strSource', ''),
                    'is_user_added': True,
                    'is_public': False,  # Default to private
                }
            )

            if not created:
                # Update existing recipe
                meal.title = meal_data.get('strMeal', meal.title)
                meal.category = category
                meal.area = meal_data.get('strArea', meal.area)
                meal.instructions = meal_data.get(
                    'strInstructions', meal.instructions)
                meal.ingredients = ingredients_list
                meal.image = meal_data.get('strMealThumb', meal.image)
                meal.youtube = meal_data.get('strYoutube', meal.youtube)
                meal.save()

            serializer = MealSerializer(meal)
            return Response(
                {
                    "message": "Recipe saved successfully" if created else "Recipe updated successfully",
                    "meal": serializer.data
                },
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": f"Failed to save recipe: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ListAIRecipes(APIView):
    """List AI-generated recipes for the authenticated user"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Get all AI-generated recipes for the logged-in user.
        Query params: ?public=true to get public recipes from all users
        """
        try:
            public_only = request.GET.get('public', '').lower() == 'true'

            if public_only:
                # Get all public AI recipes from all users
                meals = Meal.objects.filter(
                    is_user_added=True,
                    is_public=True
                ).select_related('user').order_by('-created_at')
            else:
                # Get user's own AI recipes
                meals = Meal.objects.filter(
                    user=request.user,
                    is_user_added=True
                ).order_by('-created_at')

            serializer = MealSerializer(meals, many=True)
            return Response(
                {
                    "count": meals.count(),
                    "recipes": serializer.data
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch AI recipes: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ShareAIRecipe(APIView):
    """Share an AI-generated recipe (make it public)"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Mark a recipe as public.
        Expected payload: {"meal_id": int} (Django's primary key)
        """
        try:
            meal_id = request.data.get('meal_id')

            if not meal_id:
                return Response(
                    {"error": "Missing 'meal_id' in request."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            meal = Meal.objects.filter(
                id=meal_id,
                user=request.user,
                is_user_added=True
            ).first()

            if not meal:
                return Response(
                    {"error": "Recipe not found or you don't have permission."},
                    status=status.HTTP_404_NOT_FOUND
                )

            meal.is_public = True
            meal.save()

            serializer = MealSerializer(meal)
            return Response(
                {
                    "message": "Recipe shared successfully",
                    "meal": serializer.data
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": f"Failed to share recipe: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UnshareAIRecipe(APIView):
    """Unshare an AI-generated recipe (make it private)"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Mark a recipe as private.
        Expected payload: {"meal_id": int} (Django's primary key)
        """
        try:
            meal_id = request.data.get('meal_id')

            if not meal_id:
                return Response(
                    {"error": "Missing 'meal_id' in request."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            meal = Meal.objects.filter(
                id=meal_id,
                user=request.user,
                is_user_added=True
            ).first()

            if not meal:
                return Response(
                    {"error": "Recipe not found or you don't have permission."},
                    status=status.HTTP_404_NOT_FOUND
                )

            meal.is_public = False
            meal.save()

            serializer = MealSerializer(meal)
            return Response(
                {
                    "message": "Recipe unshared successfully",
                    "meal": serializer.data
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": f"Failed to unshare recipe: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DeleteAIRecipe(APIView):
    """Delete an AI-generated recipe"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, meal_id):
        """
        Delete a recipe.
        URL param: meal_id (Django's primary key)
        """
        try:
            meal = Meal.objects.filter(
                id=meal_id,
                user=request.user,
                is_user_added=True
            ).first()

            if not meal:
                return Response(
                    {"error": "Recipe not found or you don't have permission."},
                    status=status.HTTP_404_NOT_FOUND
                )

            meal.delete()
            return Response(
                {"message": "Recipe deleted successfully"},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": f"Failed to delete recipe: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
