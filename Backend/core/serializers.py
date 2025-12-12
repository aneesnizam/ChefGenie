from rest_framework import serializers
from .models import User, Profile, Meal, GroceryList, Favorite, RecipeView


class ProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = Profile
        fields = ['bio', 'profile_picture', 'dietary_preference']


class UserSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        style={'input_type': 'password'}, write_only=True)

    class Meta:
        model = User
        fields = ['password', 'age', 'name', 'isCook', 'country', 'email']

    def create(self, validated_data):

        user = User.objects.create_user(

            password=validated_data['password'],
            # Try to get the value for 'age'. If it's not here, just return None
            age=validated_data.get('age'),
            name=validated_data.get('name'),
            email=validated_data.get('email'),
            country=validated_data.get('country', ''),
            isCook=validated_data.get('isCook', False)
        )
        return user


# 9. This serializer is for VIEWING/UPDATING user details
class UserDetailSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    favorites_count = serializers.SerializerMethodField()
    days_active = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'age', 'country', 'isCook',
                  'email', 'profile', 'favorites_count', 'days_active']

    def get_favorites_count(self, obj):
        """Get the number of favorites for the user"""
        return Favorite.objects.filter(user=obj).count()

    def get_days_active(self, obj):
        """Calculate days active based on earliest favorite or account creation"""
        from django.utils import timezone as django_timezone

        # Try to get the earliest favorite
        earliest_favorite = Favorite.objects.filter(
            user=obj).order_by('created_at').first()

        if earliest_favorite:
            start_date = earliest_favorite.created_at
        else:
            # If no favorites, return 0
            return 0

        # Calculate days between start_date and now
        now = django_timezone.now()
        delta = now - start_date
        return max(1, delta.days)  # At least 1 day

    def update(self, instance, validated_data):

        profile_data = validated_data.pop('profile', None)
        instance = super().update(instance, validated_data)

        if profile_data:
            profile, created = Profile.objects.get_or_create(user=instance)
            for key, value in profile_data.items():
                setattr(profile, key, value)
            profile.save()

        return instance


class MealSerializer(serializers.ModelSerializer):
    # JSONFields automatically handled by DRF, but we can make them more readable
    ingredients = serializers.JSONField()
    category = serializers.JSONField()  # in case you made category JSONField
    user_name = serializers.SerializerMethodField()
    is_public = serializers.BooleanField(read_only=True)

    class Meta:
        model = Meal
        fields = [
            'id',         # Django's default primary key
            'mealid',     # JSON 'id' (unique meal identifier)
            'title',
            'category',
            'area',
            'instructions',
            'ingredients',
            'image',
            'youtube',
            'source',
            'is_user_added',
            'user',
            'user_name',
            'is_public',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_user_name(self, obj):
        """Return user's name if recipe is public and has a user"""
        if obj.is_public and obj.user:
            return obj.user.name or obj.user.email
        return None


class GroceryListSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroceryList
        fields = ['ingredient_name', 'quantity', 'unit', 'shop', 'id']


class FavoriteSerializer(serializers.ModelSerializer):
    meal = MealSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'meal', 'created_at']
        read_only_fields = ['id', 'created_at']


class RecipeViewSerializer(serializers.ModelSerializer):
    meal = MealSerializer(read_only=True)

    class Meta:
        model = RecipeView
        fields = ['id', 'meal', 'mealid', 'viewed_at']
        read_only_fields = ['id', 'viewed_at']
