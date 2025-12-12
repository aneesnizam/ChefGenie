from django.shortcuts import render
from rest_framework.views import APIView
from .serializers import ProfileSerializer,UserSerializer,UserDetailSerializer
from rest_framework import status, permissions
from rest_framework.response import Response
from .models import Profile

# Create your views here.
class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Create profile for new user
            Profile.objects.get_or_create(user=user)
            return Response({'message': 'User Created Successfully'}, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """Get and update current user's profile"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get current user's profile"""
        try:
            serializer = UserDetailSerializer(request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch profile: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def patch(self, request):
        """Update current user's profile (partial update)"""
        try:
            serializer = UserDetailSerializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": f"Failed to update profile: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request):
        """Update current user's profile (full update)"""
        return self.patch(request)

# class AddGrocery(APIView):
#     def post(self,request):
        
