export default function FraudRiskBadge({ status }) {
  const styles = {
    HIGH_RISK: "bg-red-100 text-red-700 border-red-300",
    LOW_RISK: "bg-emerald-100 text-emerald-700 border-emerald-300",
    PENDING: "bg-amber-100 text-amber-700 border-amber-300",
  };
  const labels = {
    HIGH_RISK: "High Risk",
    LOW_RISK: "Low Risk",
    PENDING: "Reviewing…",
  };
  const cls = styles[status] || styles.PENDING;
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${cls}`}>
      {labels[status] || status}
    </span>
  );
}
