from rest_framework import viewsets
from rest_framework import status
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
import google.generativeai as genai
from django.conf import settings
import json
import re

try:
    genai.configure(api_key=settings.GEMINI_API_KEY)
except AttributeError:
    print("FATAL ERROR: Gemini API key not configured. Check settings.py")
   
    
    
class HomeRecipes(APIView):
    def get(self,request):
        url = 'https://www.themealdb.com/api/json/v1/1/filter.php?a=Indian'
        
        try:
            response = requests.get(url)
            data = response.json()
            
            meals = data.get('meals',[])[1:5]
            return Response(meals,status = status.HTTP_200_OK)
        except requests.exceptions.RequestException as e:
            return Response({
                "error":"Failed to fetch recipes"
            },status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
class RecipeDetail(APIView):
    def get(self,request,id):
        url = f'https://www.themealdb.com/api/json/v1/1/lookup.php?i={id}'
        
        try:
            response = requests.get(url)
            data = response.json()
            meals = data.get('meals',[])
    
            return Response(meals,status = status.HTTP_200_OK)
        except requests.exceptions.RequestException as e:
            return Response({
                "error":"Failed to fetch recipes"
            },status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RecipeFilter(APIView):
    def get(self,request,name):
        url=f"https://www.themealdb.com/api/json/v1/1/search.php?s={name}"
        
        try:
            response = requests.get(url)
            data = response.json()
            meals = data.get('meals',[])
            return Response(meals,status=status.HTTP_200_OK)
        except requests.exceptions.RequestException as e:
            return Response({
                "error":"Failed to fetch recipes"
            },status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
            response = model.generate_content([{"role": "user", "parts": [prompt]}])

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
        api_messages = [{"role": m["role"], "parts": [m["content"]]} for m in messages]

        try:
            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                system_instruction=self.system_instructions
            )
            response = model.generate_content(api_messages)
            return Response({"reply": response.text}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class GroceryList(APIView):
    system_instructions = """
    You are an expert in food ingredient classification and grocery organization.
    The user will send a list of ingredients in plain text form.
    For each ingredient, identify and extract the following fields:
    - quantity: Numeric or fractional part (e.g., "1", "½", "¼").
    - unit: Measurement unit (e.g., "cup", "tsp", "tbsp", "g", "ml").
    - ingredient_name: The actual ingredient name.
    - shop_type: Category of shop to buy from (choose one: "Supermarket", "Spices Store", "Vegetable Market", "Dairy Shop", "Meat Shop", "Bakery", or "Others").

    Return output strictly as a valid JSON array of objects.
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
            prompt = "Sort and structure these ingredients:\n" + json.dumps(ingredients, ensure_ascii=False)
            response = model.generate_content(prompt)

            # Try to extract valid JSON from response
            try:
                parsed_output = json.loads(response.text)
            except json.JSONDecodeError:
                match = re.search(r'\[.*\]', response.text, re.DOTALL)
                parsed_output = json.loads(match.group(0)) if match else {"error": "Failed to parse AI response"}

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