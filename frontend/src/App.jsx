import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MakeTransaction from "./pages/MakeTransaction";
import TransactionDetails from "./pages/TransactionDetails";
import AdminDashboard from "./pages/AdminDashboard";

function getIsAuthed() {
  return !!localStorage.getItem("securepay_token");
}

// Demo note: role is not decoded from the JWT here to keep the frontend
// simple — wire this up to decode the `roles` claim once you're ready,
// or expose a GET /api/auth/me endpoint that returns the current user.
function getIsAdmin() {
  return localStorage.getItem("securepay_is_admin") === "true";
}

function RequireAuth({ children }) {
  return getIsAuthed() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [isAuthed, setIsAuthed] = useState(getIsAuthed());

  useEffect(() => {
    const onAuthChange = () => setIsAuthed(getIsAuthed());
    window.addEventListener("storage", onAuthChange); // cross-tab
    window.addEventListener("securepay-auth-changed", onAuthChange); // same-tab
    return () => {
      window.removeEventListener("storage", onAuthChange);
      window.removeEventListener("securepay-auth-changed", onAuthChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar isAuthed={isAuthed} isAdmin={getIsAdmin()} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/transactions/new" element={<RequireAuth><MakeTransaction /></RequireAuth>} />
        <Route path="/transactions/:ref" element={<RequireAuth><TransactionDetails /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}
