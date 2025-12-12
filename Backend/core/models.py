from django.db import models
from django.contrib.auth.models import (BaseUserManager, AbstractBaseUser, PermissionsMixin)
from django.conf import settings


class UserManager(BaseUserManager):

    def create_user(self, email, password=None, **kwargs):
        if not email:
            raise ValueError('Users must have a valid email address')

        email = self.normalize_email(email)
        user = self.model(email=email, **kwargs)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **kwargs):
        kwargs.setdefault('is_staff', True)
        kwargs.setdefault('is_superuser', True)
        kwargs.setdefault('is_active', True)

        if kwargs.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if kwargs.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **kwargs)


class User(AbstractBaseUser, PermissionsMixin):
    name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(unique=True)
    country = models.CharField(max_length=100, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    isCook = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']  # For creating superuser

    def __str__(self):
        return self.email


class Profile(models.Model):

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(
        upload_to='profiles/', blank=True, null=True)
    dietary_preference = models.CharField(
        max_length=100, blank=True, help_text='e.g., Vegan, Gluten-Free, etc.')

    def __str__(self):
        return f"{self.user.username}'s Profile"


class Meal(models.Model):
    mealid = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=200)
    category = models.JSONField()  # <-- store one or many categories
    area = models.CharField(max_length=200, blank=True, null=True)
    instructions = models.TextField(blank=True, null=True)
    ingredients = models.JSONField()
    image = models.URLField(blank=True, null=True)
    youtube = models.URLField(blank=True, null=True)
    source = models.URLField(blank=True, null=True)
    is_user_added = models.BooleanField(default=False)
    

    def __str__(self):
        return self.title


UNIT_CHOICES = [
    ('mg', 'milligram'),
    ('g', 'gram'),
    ('kg', 'kilogram'),
    ('oz', 'ounce'),
    ('lb', 'pound'),
    ('ml', 'milliliter'),
    ('l', 'liter'),
    ('tsp', 'teaspoon'),
    ('tbsp', 'tablespoon'),
    ('cup', 'cup'),
    ('pinch', 'pinch'),
    ('dash', 'dash'),
    ('pcs', 'pieces'),
    ('packet', 'packet'),
    ('can', 'can'),
    ('bottle', 'bottle'),
]


class GroceryList(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='grocery_items',
    )

    ingredient_name = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=7, decimal_places=2)
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES)
    shop = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"{self.ingredient_name} ({self.quantity} {self.unit})"
    
    
class Favorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorite_entries')
    meal = models.ForeignKey('Meal', on_delete=models.CASCADE, related_name='favorite_entries')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'meal')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} favorited {self.meal.title}"


class RecipeView(models.Model):
    """Track when users view recipes"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recipe_views')
    meal = models.ForeignKey('Meal', on_delete=models.CASCADE, related_name='views')
    mealid = models.CharField(max_length=50)  # Store mealid string for quick lookup
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-viewed_at']
        indexes = [
            models.Index(fields=['user', '-viewed_at']),
        ]

    def __str__(self):
        return f"{self.user.email} viewed {self.mealid} at {self.viewed_at}"