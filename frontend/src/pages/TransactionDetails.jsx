import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import FraudRiskBadge from "../components/FraudRiskBadge";

export default function TransactionDetails() {
  const { ref } = useParams();
  const [tx, setTx] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let interval;
    async function load() {
      try {
        const data = await api.getTransaction(ref);
        setTx(data);
        // Poll while the fraud agent is still reviewing (PENDING), so the
        // risk badge updates automatically once the Kafka consumer resolves it.
        if (data.riskStatus === "PENDING") {
          interval = setTimeout(load, 2000);
        }
      } catch (err) {
        setError(err.message);
      }
    }
    load();
    return () => clearTimeout(interval);
  }, [ref]);

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!tx) return <div className="p-6 text-slate-500">Loading…</div>;

  return (
    <div className="max-w-md mx-auto p-6">
      <Link to="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">&larr; Back</Link>
      <div className="bg-white shadow rounded-lg p-6 mt-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-slate-800">{tx.transactionRef}</h1>
          <FraudRiskBadge status={tx.riskStatus} />
        </div>
        <dl className="text-sm divide-y">
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Amount</dt>
            <dd className="font-medium">₹{Number(tx.amount).toLocaleString()}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Type</dt>
            <dd className="font-medium">{tx.type}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Date</dt>
            <dd className="font-medium">{new Date(tx.createdAt).toLocaleString()}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Account</dt>
            <dd className="font-medium">{tx.account?.accountNumber}</dd>
          </div>
        </dl>
        {tx.riskStatus === "PENDING" && (
          <p className="text-xs text-amber-600 mt-4">
            The Fraud Investigation Agent is reviewing this transaction — this page will update automatically.
          </p>
        )}
      </div>
    </div>
  );
}
