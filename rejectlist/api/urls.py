from django.urls import path
from .views import ClientView, LoginView, LogoutView, CheckAuthView, GetCSRFToken

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('check-auth/', CheckAuthView.as_view(), name='check_auth'),
    path('clients/', ClientView.as_view(), name='client'),
    path('clients/<int:pk>/', ClientView.as_view(), name='client_details'),
    path('csrf/', GetCSRFToken.as_view(), name='csrf_token'),
]
