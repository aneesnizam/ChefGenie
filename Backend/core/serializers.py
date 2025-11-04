from rest_framework import serializers
from .models import User, Profile 


class ProfileSerializer(serializers.ModelSerializer):
   
    class Meta:
        model = Profile
        fields = ['bio', 'profile_picture', 'dietary_preference']



class UserSerializer(serializers.ModelSerializer):

    password = serializers.CharField(style={'input_type': 'password'}, write_only=True)

    class Meta:
        model = User
        fields = ['password', 'age', 'name','isCook','country','email']
 
    def create(self, validated_data):
   
        user = User.objects.create_user(
            
            password=validated_data['password'],
            age=validated_data.get('age'), #Try to get the value for 'age'. If it's not here, just return None
            name=validated_data.get('name'),
            email=validated_data.get('email'),
            country=validated_data.get('country', ''),
            isCook=validated_data.get('isCook', False)
        )
        return user


# 9. This serializer is for VIEWING/UPDATING user details
class UserDetailSerializer(serializers.ModelSerializer):
    
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = ['id', 'name', 'age', 'country', 'isCook','email', 'profile']
        
    
    def update(self, instance, validated_data):
        
        profile_data = validated_data.pop('profile', {})
        instance = super().update(instance, validated_data)
   
        if profile_data:
            profile = instance.profile
            for key, value in profile_data.items():
                setattr(profile, key, value)
            profile.save()

        return instance