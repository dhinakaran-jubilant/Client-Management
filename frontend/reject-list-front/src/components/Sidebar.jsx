import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");

/* lightweight inline icons (no extra deps) */
const Icon = {
  Home: (p) => (<svg viewBox="0 0 24 24" className={p.className}><path fill="none" stroke="currentColor" strokeWidth="1.8" d="M3 10.5L12 3l9 7.5v9.5a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20V10.5z"/><path fill="none" stroke="currentColor" strokeWidth="1.8" d="M9 22V12h6v10"/></svg>),
  Users: (p) => (<svg viewBox="0 0 24 24" className={p.className}><circle cx="9" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M2 21a7 7 0 0 1 14 0M16 21a5 5 0 0 1 6 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  Chevron: (p) => (<svg viewBox="0 0 24 24" className={p.className}><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  Logout: (p) => (<svg viewBox="0 0 24 24" className={p.className}><path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>),
  User: (p) => (<svg viewBox="0 0 24 24" className={p.className}><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.8"/><path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M5.5 19.5a7 7 0 0113 0"/></svg>),
};

const baseLink =
 "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition";

const inactive =
  "text-slate-600 hover:bg-slate-100 hover:text-slate-900";

const active =
  "bg-slate-100 text-slate-900 ring-1 ring-slate-200";

const childLink = "ml-9 px-3 py-1.5 text-[13px] rounded-md block";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Authentication state
  const [userInfo, setUserInfo] = useState({
    username: '',
    isTeamLead: false,
    isAuthenticated: false,
    loading: true
  });

  // State only includes the 'clients' section
  const [open, setOpen] = useState({
    clients: false,
  });

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // auto-open Clients when on /clients
  useEffect(() => {
    if (location.pathname.startsWith("/clients")) {
      setOpen((s) => ({ ...s, clients: true }));
    }
  }, [location.pathname]);

  // Function to check authentication
  async function checkAuth() {
    try {
      const res = await fetch(`${API_BASE}/check-auth/`, {
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });
      const data = await res.json();
      
      if (data.authenticated) {
        console.log("Auth data received:", data); // Debug log
        setUserInfo({
          username: data.username,
          isTeamLead: data.is_team_lead || false,
          isAuthenticated: true,
          loading: false
        });
        
        // Store in localStorage for quick access
        localStorage.setItem('username', data.username);
        localStorage.setItem('is_team_lead', data.is_team_lead);
        localStorage.setItem('user_type', data.user_type);
      } else {
        // Not authenticated, redirect to login
        setUserInfo({
          username: '',
          isTeamLead: false,
          isAuthenticated: false,
          loading: false
        });
        navigate('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUserInfo({
        username: '',
        isTeamLead: false,
        isAuthenticated: false,
        loading: false
      });
      navigate('/login');
    }
  }

  // Function to handle logout
  async function handleLogout() {
    try {
      await fetch(`${API_BASE}/logout/`, {
        method: "POST",
        credentials: "include"
      });
      localStorage.clear();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  const SectionBtn = ({ id, icon: Ico, label }) => (
    <button
      type="button"
      onClick={() => setOpen((s) => ({ ...s, [id]: !s[id] }))}
      className={`${baseLink} ${inactive} w-full justify-between`}
    >
      <span className="flex items-center gap-3">
        <Ico className="h-5 w-5 text-slate-500" />
        <span>{label}</span>
      </span>
      <Icon.Chevron
        className={`h-4 w-4 text-slate-400 transition-transform ${open[id] ? "rotate-90" : ""}`}
      />
    </button>
  );

  const ItemLink = ({ to, children, teamLeadOnly = false }) => {
    // Hide link if teamLeadOnly and user is not a Team Lead
    if (teamLeadOnly && !userInfo.isTeamLead) {
      return null;
    }
    
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          `${childLink} ${isActive ? active : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`
        }
        end
      >
        {children}
      </NavLink>
    );
  };

  // Show loading while checking auth
  if (userInfo.loading) {
    return (
      <aside className="h-screen w-[260px] shrink-0 border-r border-slate-200 bg-white sticky top-0">
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 grid place-items-center rounded-full bg-slate-800 text-white text-sm font-semibold">JE</div>
            <div className="font-semibold text-slate-800">Jubilant Group</div>
          </div>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="h-screen w-[260px] shrink-0 border-r border-slate-200 bg-white sticky top-0 nice-scroll overflow-y-auto">
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 grid place-items-center rounded-full bg-slate-800 text-white text-sm font-semibold">
            {userInfo.username ? userInfo.username.charAt(0).toUpperCase() : 'JE'}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-800 truncate">
              {userInfo.username || 'Jubilant Group'}
            </div>
            <div className="text-xs text-slate-500">
              {userInfo.isTeamLead ? 'Team Lead Account' : 'User Account'}
            </div>
          </div>
        </div>
      </div>

      <nav className="px-2 py-3 space-y-1">
        {/* Home Link */}
        <NavLink to="/" className={({ isActive }) => `${baseLink} ${isActive ? active : inactive}`}>
          <Icon.Home className="h-5 w-5 text-slate-500" />
          Home
        </NavLink>
        
        {/* Clients Group */}
        <SectionBtn id="clients" icon={Icon.Users} label="Clients" />
        {open.clients && (
          <div className="mt-1 space-y-1">
            {/* View clients - available for all authenticated users */}
            <ItemLink to="/clients">View clients</ItemLink>
            
            {/* Add button - only for Team Lead */}
            <ItemLink to="/clients/new" teamLeadOnly={true}>Add</ItemLink>
          </div>
        )}
      </nav>

      {/* User info and logout at bottom */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-4">
        {/* User info */}
        {userInfo.isAuthenticated && (
          <div className="mb-3 rounded-lg bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Icon.User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {userInfo.username}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`inline-block h-2 w-2 rounded-full ${userInfo.isTeamLead ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                  <span className="text-xs text-slate-500">
                    {userInfo.isTeamLead ? 'Team Lead' : 'User'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Logout button */}
        <button
          onClick={handleLogout}
          className={`${baseLink} ${inactive} w-full text-slate-600 hover:text-slate-900`}
        >
          <Icon.Logout className="h-5 w-5 text-slate-500" />
          Logout
        </button>
      </div>
    </aside>
  );
}