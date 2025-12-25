import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { AuthWrapper } from './AuthWrapper';

export default function ShellLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [auth] = useState({ 
    isAuthenticated: true, // Always true - skip auth check
    isTeamLead: localStorage.getItem("is_team_lead") === "true" || false,
    username: localStorage.getItem("username") || ''
  });

  const handleLogout = () => {
    localStorage.clear();
    localStorage.setItem('logout', Date.now().toString());
    navigate('/login');
  };

  return (
      <AuthWrapper>
        <div className="flex h-screen overflow-hidden bg-slate-100">
          <Sidebar 
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
            onLogout={handleLogout} 
            userInfo={auth} 
          />
        {/* Main content area - adjusts width based on sidebar state */}
        <main 
          className={`flex-1 min-w-0 min-h-0 flex flex-col transition-all duration-300`}
          >
        <div className="flex-1 min-h-0 overflow-auto nice-scroll">
          <Outlet />
        </div>
      </main>
    </div>
    </AuthWrapper>
  );
}