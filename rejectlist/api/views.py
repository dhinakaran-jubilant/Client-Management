from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.utils import timezone
from django.conf import settings
from django.db.models import Q
import logging
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from .models import RejectList
from .serializers import RejectListSerializer

logger = logging.getLogger(__name__)

def is_duplicate(payload):
    return RejectList.objects.filter(
        name__iexact=payload.get("name"),
        contact_no=payload.get("contact_no"),
        proposal_date=payload.get("proposal_date"),
    ).exists()

# Custom permission class
class IsTeamLead(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Check if user is in "Team Lead" group or is staff/superuser
        is_team_lead_group = request.user.groups.filter(name='Team Lead').exists()
        return request.user.is_superuser or request.user.is_staff or is_team_lead_group

class GetCSRFToken(APIView):
    permission_classes = [AllowAny]
    
    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        csrf_token = get_token(request)
        response = Response({'csrfToken': csrf_token})
        response["X-CSRFToken"] = csrf_token
        print(response)
        return response

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('user')
        password = request.data.get('pw')
        
        user = authenticate(username=username, password=password)
        if not user:
            return Response({'error': 'Invalid credentials'}, status=401)

        login(request, user)  # THIS IS ENOUGH
        is_team_lead = (
            user.is_superuser or
            user.is_staff or
            user.groups.filter(name='Team Lead').exists()
        )

        return Response({
            'authenticated': True,
            'username': user.username,
            'user_type': 'team_lead' if is_team_lead else 'user',
            'is_team_lead': is_team_lead,
        }, status=200)



class LogoutView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        # Get session key before logout for logging
        session_key = request.session.session_key if request.session else None
        
        logout(request)
        
        response = Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
        
        # Clear cookies
        response.delete_cookie('sessionid')
        response.delete_cookie('logged_in')
        response.delete_cookie('csrftoken')
        
        logger.info(f"LogoutView: User logged out, session {session_key} cleared")
        return response


class CheckAuthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            user = request.user
            is_team_lead = (
                user.is_superuser or
                user.is_staff or
                user.groups.filter(name='Team Lead').exists()
            )

            return Response({
                'authenticated': True,
                'username': user.username,
                'user_type': 'team_lead' if is_team_lead else 'user',
                'is_team_lead': is_team_lead,
            })

        return Response({'authenticated': False})


class ClientView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, pk=None):
        logger.info(f"ClientView GET: User - {request.user}, Authenticated - {request.user.is_authenticated}")
        logger.info(f"ClientView GET: Session - {request.session.session_key if request.session else 'No session'}")
        
        if pk:
            reject = get_object_or_404(RejectList, id=pk)
            serializer = RejectListSerializer(reject)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            queryset = RejectList.objects.all()
            
            # Search filter
            search = request.query_params.get('search')
            if search:
                queryset = queryset.filter(
                    Q(name__icontains=search) |
                    Q(location__icontains=search) |
                    Q(follow__icontains=search) |
                    Q(status__icontains=search) |
                    Q(reason__icontains=search) |
                    Q(group__icontains=search) |
                    Q(proprietor__icontains=search)
                )
            
            # Status filter
            status_filter = request.query_params.get('status')
            if status_filter and status_filter != 'ALL':
                queryset = queryset.filter(status__iexact=status_filter)
            
            # Name filter (exact match)
            name_filter = request.query_params.get('name')
            if name_filter:
                queryset = queryset.filter(name__icontains=name_filter)
            
            serializer = RejectListSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        data = request.data

        # 🔹 MULTIPLE CLIENTS
        if isinstance(data, list):
            created = []
            skipped = []

            for item in data:
                if is_duplicate(item):
                    skipped.append(item)
                    continue

                serializer = RejectListSerializer(data=item)
                if serializer.is_valid():
                    serializer.save()
                    created.append(serializer.data)
                else:
                    skipped.append(item)

            return Response({
                "created_count": len(created),
                "skipped_count": len(skipped),
                "created": created
            }, status=status.HTTP_201_CREATED)

        # 🔹 SINGLE CLIENT (existing behaviour)
        if is_duplicate(data):
            return Response(
                {"message": "Duplicate client ignored"},
                status=status.HTTP_200_OK
            )
        serializer = RejectListSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Client details added',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, pk):
        reject = get_object_or_404(RejectList, id=pk)
        data = request.data.copy()

        data["updated_at"] = timezone.now()

        serializer = RejectListSerializer(
            reject, data=data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Client details updated successfully", "data": serializer.data},
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
    def delete(self, request, pk):
        
        reject = get_object_or_404(RejectList, id=pk)
        reject.delete()
        return Response(
            {'message': 'Client details deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )
    