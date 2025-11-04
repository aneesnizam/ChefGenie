from django.shortcuts import render
from rest_framework.views import APIView
from .serializers import ProfileSerializer,UserSerializer,UserDetailSerializer
from rest_framework import status
from rest_framework.response import Response

# Create your views here.
class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'User Created Successfully'}, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# class AddGrocery(APIView):
#     def post(self,request):
        
