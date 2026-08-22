import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import FraudRiskBadge from "../components/FraudRiskBadge";

const DEFAULT_ACCOUNT = "ACC-001"; // demo: single-account view. Swap for a real account picker once multi-account support lands.

export default function Dashboard() {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [acc, txPage] = await Promise.all([
          api.getAccount(DEFAULT_ACCOUNT),
          api.getTransactionHistory(DEFAULT_ACCOUNT),
        ]);
        setAccount(acc);
        setTransactions(txPage.content || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch = t.transactionRef.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "ALL" || t.type === typeFilter;
      const matchesRisk = riskFilter === "ALL" || t.riskStatus === riskFilter;
      return matchesSearch && matchesType && matchesRisk;
    });
  }, [transactions, search, typeFilter, riskFilter]);

  if (loading) return <div className="p-8 text-slate-500">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4 border border-red-200">
          {error}
        </div>
      )}

      {account && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Account {account.accountNumber}</p>
            <p className="text-3xl font-bold text-slate-900">₹{Number(account.balance).toLocaleString()}</p>
          </div>
          <Link
            to="/transactions/new"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded font-medium"
          >
            Make Transaction
          </Link>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-3">
        <input
          placeholder="Search by transaction ref…"
          className="border border-slate-300 rounded px-3 py-2 text-sm flex-1 min-w-[180px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border border-slate-300 rounded px-3 py-2 text-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">All types</option>
          <option value="DEBIT">Debit</option>
          <option value="CREDIT">Credit</option>
        </select>
        <select
          className="border border-slate-300 rounded px-3 py-2 text-sm"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
        >
          <option value="ALL">All risk levels</option>
          <option value="LOW_RISK">Low risk</option>
          <option value="HIGH_RISK">High risk</option>
          <option value="PENDING">Reviewing</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow divide-y">
        {filtered.length === 0 && (
          <p className="p-6 text-sm text-slate-500">No transactions match your filters.</p>
        )}
        {filtered.map((t) => (
          <Link
            key={t.transactionRef}
            to={`/transactions/${t.transactionRef}`}
            className="flex items-center justify-between px-6 py-4 hover:bg-slate-50"
          >
            <div>
              <p className="font-medium text-slate-800">{t.transactionRef}</p>
              <p className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className={t.type === "DEBIT" ? "text-red-600" : "text-emerald-600"}>
                {t.type === "DEBIT" ? "-" : "+"}₹{Number(t.amount).toLocaleString()}
              </span>
              <FraudRiskBadge status={t.riskStatus} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
