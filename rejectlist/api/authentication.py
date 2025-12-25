from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.utils import timezone
from api.models import CustomUser

class CustomJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # Try to get the token
        authenticated = super().authenticate(request)
        
        if authenticated is None:
            return None
            
        user, token = authenticated
        
        # Check if token is expired
        from rest_framework_simplejwt.tokens import AccessToken
        try:
            access_token = AccessToken(token.token)
            # Token will be validated by parent class
        except Exception as e:
            raise AuthenticationFailed('Token is invalid or expired')
            
        return user, token