import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import FraudRiskBadge from "../components/FraudRiskBadge";

export default function AdminDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const page = await api.getFlaggedTransactions();
        setTransactions(page.content || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const highRiskCount = transactions.filter((t) => t.riskStatus === "HIGH_RISK").length;
  const pendingCount = transactions.filter((t) => t.riskStatus === "PENDING").length;

  if (loading) return <div className="p-8 text-slate-500">Loading…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-bold text-slate-800 mb-4">Fraud Monitoring — Admin</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Transactions" value={transactions.length} />
        <StatCard label="High Risk" value={highRiskCount} accent="text-red-600" />
        <StatCard label="Under Review" value={pendingCount} accent="text-amber-600" />
      </div>

      <div className="bg-white rounded-lg shadow divide-y">
        {transactions.map((t) => (
          <Link
            key={t.transactionRef}
            to={`/transactions/${t.transactionRef}`}
            className="flex items-center justify-between px-6 py-4 hover:bg-slate-50"
          >
            <div>
              <p className="font-medium text-slate-800">{t.transactionRef}</p>
              <p className="text-xs text-slate-500">
                {t.account?.accountNumber} · {new Date(t.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span>₹{Number(t.amount).toLocaleString()}</span>
              <FraudRiskBadge status={t.riskStatus} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent = "text-slate-800" }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}
