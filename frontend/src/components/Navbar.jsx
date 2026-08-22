import { Link, useNavigate } from "react-router-dom";
import { clearToken } from "../api/client";

export default function Navbar({ isAuthed, isAdmin }) {
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  return (
    <nav className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between">
      <Link to="/dashboard" className="font-bold text-lg tracking-tight">
        SecurePay
      </Link>
      {isAuthed && (
        <div className="flex items-center gap-5 text-sm">
          <Link to="/dashboard" className="hover:text-emerald-400">Dashboard</Link>
          <Link to="/transactions/new" className="hover:text-emerald-400">New Transaction</Link>
          {isAdmin && <Link to="/admin" className="hover:text-emerald-400">Fraud Monitoring</Link>}
          <button onClick={handleLogout} className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded">
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
