import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

/* lightweight inline icons (no extra deps) */
const Icon = {
  Home: (p) => (<svg viewBox="0 0 24 24" className={p.className}><path fill="none" stroke="currentColor" strokeWidth="1.8" d="M3 10.5L12 3l9 7.5v9.5a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20V10.5z"/><path fill="none" stroke="currentColor" strokeWidth="1.8" d="M9 22V12h6v10"/></svg>),
  Users: (p) => (<svg viewBox="0 0 24 24" className={p.className}><circle cx="9" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M2 21a7 7 0 0 1 14 0M16 21a5 5 0 0 1 6 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  Chevron: (p) => (<svg viewBox="0 0 24 24" className={p.className}><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  Logout: (p) => (<svg viewBox="0 0 24 24" className={p.className}><path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>),
  User: (p) => (<svg viewBox="0 0 24 24" className={p.className}><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.8"/><path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M5.5 19.5a7 7 0 0113 0"/></svg>),
  ChevronLeft: (p) => (<svg viewBox="0 0 24 24" className={p.className}><path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  ChevronRight: (p) => (<svg viewBox="0 0 24 24" className={p.className}><path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
};

const baseLink =
 "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition";

const inactive =
  "text-slate-600 hover:bg-slate-100 hover:text-slate-900";

const active =
  "bg-slate-100 text-slate-900 ring-1 ring-slate-200";

const childLink = "ml-9 px-3 py-1.5 text-[13px] rounded-md block";

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const location = useLocation();

  // 🔐 Read auth info ONLY from localStorage (set by ShellLayout)
  const [userInfo] = useState({
    username: localStorage.getItem("username") || "",
    isTeamLead: localStorage.getItem("is_team_lead") === "true",
    isAuthenticated: true, // ShellLayout already guards this
  });

  const [open, setOpen] = useState({
    clients: false,
  });

  // auto-open Clients when on /clients
  useEffect(() => {
    if (location.pathname.startsWith("/clients")) {
      setOpen((s) => ({ ...s, clients: true }));
    }
  }, [location.pathname]);

  // Logout handled cleanly (ShellLayout will redirect)
  const handleLogout = () => {
  localStorage.clear();
  localStorage.setItem('logout', Date.now().toString());
  navigate('/login');
};

  const SectionBtn = ({ id, icon: Ico, label }) => (
    <button
      type="button"
      onClick={() => setOpen((s) => ({ ...s, [id]: !s[id] }))}
      className={`${baseLink} ${inactive} w-full justify-between`}
    >
      <span className="flex items-center gap-3">
        <Ico className="h-5 w-5 text-slate-500" />
        {!isCollapsed && <span>{label}</span>}
      </span>
      {!isCollapsed && (
        <Icon.Chevron
          className={`h-4 w-4 text-slate-400 transition-transform ${open[id] ? "rotate-90" : ""}`}
        />
      )}
    </button>
  );

  const ItemLink = ({ to, children, teamLeadOnly = false }) => {
    if (teamLeadOnly && !userInfo.isTeamLead) return null;

    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          `${childLink} ${isActive ? active : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"} ${isCollapsed ? 'ml-0 px-2 py-2 text-center' : ''}`
        }
        end
        title={isCollapsed ? children : undefined}
      >
        <span className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'}`}>
          {isCollapsed ? (
            // Show only icon when collapsed
            children.props.children[0] || children
          ) : (
            children
          )}
        </span>
      </NavLink>
    );
  };

  // Collapsed view item (icon only)
  const CollapsedItem = ({ to, icon: Ico, label, teamLeadOnly = false }) => {
    if (teamLeadOnly && !userInfo.isTeamLead) return null;
    
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          `${baseLink} ${isActive ? active : inactive} justify-center`
        }
        title={label}
      >
        <Ico className="h-5 w-5 text-slate-500" />
      </NavLink>
    );
  };

  return (
    <>
      {/* Toggle Button - Middle right position */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="fixed z-50 h-7 w-7 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
        style={{
          left: isCollapsed ? '54px' : '244px',
          top: '50%',
          transform: 'translateY(-50%)',
        }}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <Icon.ChevronRight className="h-5 w-5 text-slate-600" />
        ) : (
          <Icon.ChevronLeft className="h-5 w-5 text-slate-600" />
        )}
      </button>

      <aside className={`h-screen ${isCollapsed ? 'w-[70px]' : 'w-[260px]'} shrink-0 border-r border-slate-200 bg-white sticky top-0 nice-scroll overflow-y-auto transition-all duration-200`}>
        {/* User Profile Section */}
        <div className={`px-4 py-4 border-b border-slate-100 ${isCollapsed ? 'text-center' : ''}`}>
          {isCollapsed ? (
            <div className="flex flex-col items-center">
              <div className="h-9 w-9 grid place-items-center rounded-full bg-slate-800 text-white text-sm font-semibold mb-2">
                {userInfo.username ? userInfo.username.charAt(0).toUpperCase() : "JE"}
              </div>
              <div className="text-xs text-slate-500 truncate w-full text-center">
                {userInfo.isTeamLead ? "Lead" : "User"}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 grid place-items-center rounded-full bg-slate-800 text-white text-sm font-semibold">
                {userInfo.username ? userInfo.username.charAt(0).toUpperCase() : "JE"}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-slate-800 truncate capitalize">
                  {userInfo.username || "Jubilant Group"}
                </div>
                <div className="text-xs text-slate-500">
                  {userInfo.isTeamLead ? "Team Lead Account" : "User Account"}
                </div>
              </div>
            </div>
          )}
        </div>

        <nav className="px-2 py-3 space-y-1">
          {isCollapsed ? (
            <>
              {/* Collapsed View - Icons Only */}
              <CollapsedItem to="/" icon={Icon.Home} label="Home" />
              
              {/* Clients Section - Collapsed */}
              <div className="space-y-1">
                <CollapsedItem to="/clients" icon={Icon.Users} label="View Clients" />
                {userInfo.isTeamLead && (
                  <CollapsedItem 
                    to="/clients/new" 
                    icon={() => (
                      <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-500">
                        <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    )} 
                    label="Add Client" 
                    teamLeadOnly 
                  />
                )}
              </div>
            </>
          ) : (
            <>
              {/* Expanded View */}
              <NavLink to="/" className={({ isActive }) => `${baseLink} ${isActive ? active : inactive}`}>
                <Icon.Home className="h-5 w-5 text-slate-500" />
                Home
              </NavLink>

              <SectionBtn id="clients" icon={Icon.Users} label="Clients" />
              {open.clients && (
                <div className="mt-1 space-y-1">
                  <ItemLink to="/clients">
                    <Icon.Users className="h-4 w-4" />
                    View clients
                  </ItemLink>
                  <ItemLink to="/clients/new" teamLeadOnly>
                    <svg viewBox="0 0 24 24" className="h-4 w-4">
                      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Add
                  </ItemLink>
                </div>
              )}
            </>
          )}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-4">
          {isCollapsed ? (
            <button
              onClick={handleLogout}
              className={`${baseLink} ${inactive} w-full justify-center`}
              title="Logout"
            >
              <Icon.Logout className="h-5 w-5 text-slate-500" />
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className={`${baseLink} ${inactive} w-full`}
            >
              <Icon.Logout className="h-5 w-5 text-slate-500" />
              Logout
            </button>
          )}
        </div>
      </aside>
    </>
  );
}