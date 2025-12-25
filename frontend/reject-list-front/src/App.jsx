import { Routes, Route, Navigate } from 'react-router-dom';
import ShellLayout from "./layouts/ShellLayout.jsx";
import CasesDashboard from "./pages/CasesDashboard.jsx";
import AddClientsPage from "./pages/AddClientsPage.jsx";
import Login from "./pages/Login.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route element={<ShellLayout />}>
        <Route path="/dashboard" element={<CasesDashboard />} />
        <Route path="/clients" element={<CasesDashboard />} />
        <Route path="/clients/new" element={<AddClientsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}