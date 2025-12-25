import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");

export const AuthWrapper = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      const loginTime = parseInt(localStorage.getItem('login_time') || '0');
      const currentTime = Date.now();
      
      // Check if token exists and is not expired (1 hour)
      if (!token || (currentTime - loginTime) > (60 * 60 * 1000)) {
        // Token expired, try to refresh
        const refresh = localStorage.getItem('refresh_token');
        if (refresh) {
          try {
            const res = await fetch(`${API_BASE}/token/refresh/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refresh }),
            });
            
            if (res.ok) {
              const data = await res.json();
              localStorage.setItem('access_token', data.access);
              localStorage.setItem('login_time', Date.now().toString());
              setIsAuthenticated(true);
              setLoading(false);
              return;
            }
          } catch (error) {
            // Refresh failed
          }
        }
        
        // Not authenticated or refresh failed
        localStorage.clear();
        navigate('/login');
        return;
      }
      
      setIsAuthenticated(true);
      setLoading(false);
    };

    checkAuth();

    // Set up visibility change listener for computer lock
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Page became hidden (computer locked or minimized)
        // We'll check auth again when page becomes visible
      } else if (document.visibilityState === 'visible') {
        // Page became visible again, check if session is still valid
        checkAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up storage event listener for cross-tab logout
    const handleStorageChange = (e) => {
      if (e.key === 'logout') {
        localStorage.clear();
        navigate('/login');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : null;
};