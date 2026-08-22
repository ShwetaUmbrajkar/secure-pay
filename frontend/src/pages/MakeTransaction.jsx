import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

const DEFAULT_ACCOUNT = "ACC-001";

export default function MakeTransaction() {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("DEBIT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const tx = await api.createTransaction({
        accountNumber: DEFAULT_ACCOUNT,
        amount: Number(amount),
        type,
      });
      navigate(`/transactions/${tx.transactionRef}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-bold text-slate-800 mb-4">New Transaction</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4 border border-red-200">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
        <select
          className="w-full border border-slate-300 rounded px-3 py-2 mb-4"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="DEBIT">Debit (money out)</option>
          <option value="CREDIT">Credit (money in)</option>
        </select>

        <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          className="w-full border border-slate-300 rounded px-3 py-2 mb-6"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <p className="text-xs text-slate-500 mb-4">
          Large transactions are automatically routed to the Fraud Investigation Agent
          for review before the risk status is finalized.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white rounded py-2 font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit Transaction"}
        </button>
      </form>
    </div>
  );
}
