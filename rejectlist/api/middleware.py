from django.utils import timezone
from django.conf import settings
from django.contrib.auth import logout
from django.utils.deprecation import MiddlewareMixin


class AutoLogoutMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.user.is_authenticated:
            # Skip for API endpoints that don't need activity tracking
            path = request.path
            if any(path.startswith(api_path) for api_path in ['/api/login', '/api/logout', '/static/']):
                return None
                
            current_time = timezone.now()
            last_activity_str = request.session.get('last_activity')
            
            if last_activity_str:
                from django.utils.dateparse import parse_datetime
                last_activity = parse_datetime(last_activity_str)
                
                if (current_time - last_activity).seconds > settings.SESSION_COOKIE_AGE:
                    # Logout user
                    logout(request)
                    request.session.flush()
                    # Optionally add a message
                    request.session['session_expired'] = True
            else:
                request.session['last_activity'] = current_time.isoformat()
        
        return None
    
    def process_response(self, request, response):
        if request.user.is_authenticated:
            # Update last activity time on successful requests
            if response.status_code < 400:
                request.session['last_activity'] = timezone.now().isoformat()
        return response