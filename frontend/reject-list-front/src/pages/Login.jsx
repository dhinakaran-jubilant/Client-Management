import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");

export default function Login() {
  const [user, setUser] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setError] = useState("");
  const navigate = useNavigate();
  
  // Clear any existing tokens on mount
  useEffect(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('login_time');
    localStorage.removeItem('username');
    localStorage.removeItem('is_team_lead');
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ user, pw }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.error || data?.detail || `Login failed with status ${res.status}`);
      }
      
      // Save tokens and user info
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("login_time", Date.now().toString()); // Store login timestamp
      localStorage.setItem("username", data.username);
      localStorage.setItem("is_team_lead", data.is_team_lead);
      localStorage.setItem("user_type", data.user_type);
      
      // Start token refresh interval
      startTokenRefresh();
      
      // Redirect to clients page
      navigate("/clients", { replace: true });

    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login error");
    } finally {
      setLoading(false);
    }
  }

  // Function to refresh token
  const refreshToken = async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) return null;
    
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
        return data.access;
      } else {
        // Refresh failed, logout
        logout();
        return null;
      }
    } catch (error) {
      logout();
      return null;
    }
  };

  // Start token refresh interval
  const startTokenRefresh = () => {
    // Refresh token every 50 minutes (before 1 hour expiry)
    setInterval(async () => {
      const loginTime = parseInt(localStorage.getItem('login_time') || '0');
      const currentTime = Date.now();
      const hoursSinceLogin = (currentTime - loginTime) / (1000 * 60 * 60);
      
      if (hoursSinceLogin >= 1) {
        // Token expired, try to refresh
        const newToken = await refreshToken();
        if (!newToken) {
          // Couldn't refresh, logout
          logout();
        }
      }
    }, 50 * 60 * 1000); // Check every 50 minutes
  };

  // Logout function
  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen w-screen bg-[#f7f7f7] flex items-center justify-center p-4">
      {/* background doodles */}
      <svg
        className="pointer-events-none fixed inset-0 h-full w-full opacity-[0.08]"
        viewBox="0 0 800 600"
        aria-hidden="true"
      >
        <circle cx="60" cy="80" r="6" fill="#000" />
        <rect x="680" y="120" width="22" height="22" rx="3" fill="#000" />
        <path
          d="M40 520c40-40 100-40 140 0"
          stroke="#000"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      {/* card */}
      <div className="relative z-10 w-full max-w-md rounded-[28px] bg-white shadow-xl ring-1 ring-black/5 mx-auto">
        <div className="px-10 pb-10 pt-8 sm:px-12 sm:pb-12 sm:pt-10">
          <h1 className="text-center text-2xl font-bold text-slate-900">
            Login
          </h1>
          <p className="mt-2 text-center text-sm text-slate-500">
            Hey, enter your details to get sign in
            <br />
            to your account
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {/* Username */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Username
              </label>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-16 text-slate-900 outline-none focus:border-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error */}
            {err && (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
                {err}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[#f6b66a] px-4 py-3 text-sm font-semibold text-black hover:brightness-95 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}