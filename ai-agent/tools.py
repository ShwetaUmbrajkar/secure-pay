"""
Tools the Fraud Investigation Agent can call.

In a real deployment these would hit the Spring Boot backend's REST APIs
(account service, transaction history). For local development / demo
purposes they run against a small in-memory fixture so the agent works
without needing the whole stack live.
"""
from datetime import datetime, timedelta
import random


def get_account_info(account_number: str) -> dict:
    """Tool: fetch account profile (owner, account age, historical avg transaction size)."""
    random.seed(account_number)  # deterministic per account for demo purposes
    return {
        "account_number": account_number,
        "account_age_days": random.randint(10, 2000),
        "avg_transaction_amount": round(random.uniform(500, 8000), 2),
        "kyc_verified": random.random() > 0.1,
    }


def get_transaction_history(account_number: str, lookback_days: int = 30) -> list:
    """Tool: fetch recent transaction history for the account."""
    random.seed(account_number + str(lookback_days))
    now = datetime.utcnow()
    count = random.randint(3, 12)
    return [
        {
            "transaction_ref": f"TXN-HIST-{i}",
            "amount": round(random.uniform(100, 6000), 2),
            "type": random.choice(["DEBIT", "CREDIT"]),
            "created_at": (now - timedelta(days=random.randint(0, lookback_days))).isoformat(),
        }
        for i in range(count)
    ]


def run_risk_engine(amount: float, avg_transaction_amount: float, account_age_days: int) -> float:
    """Tool: heuristic anomaly score in [0, 1]. Higher = riskier.

    This is a transparent, rule-based scorer (not a black-box trained model) —
    documented that way deliberately so the agent's reasoning stays explainable.
    Swap in a real trained model (e.g. IsolationForest) behind this same
    function signature without touching the agent orchestration logic.
    """
    score = 0.0

    if avg_transaction_amount > 0:
        deviation_ratio = amount / avg_transaction_amount
        if deviation_ratio > 10:
            score += 0.5
        elif deviation_ratio > 5:
            score += 0.3
        elif deviation_ratio > 2:
            score += 0.15

    if account_age_days < 30:
        score += 0.3
    elif account_age_days < 90:
        score += 0.1

    if amount > 500_000:
        score += 0.2

    return min(score, 1.0)


def apply_rules_engine(amount: float, kyc_verified: bool, history: list) -> dict:
    """Tool: deterministic business rules layered on top of the risk score."""
    triggered = []

    if not kyc_verified:
        triggered.append("KYC_NOT_VERIFIED")

    if amount > 1_000_000:
        triggered.append("AMOUNT_ABOVE_REGULATORY_LIMIT")

    recent_large = [t for t in history if t["amount"] > amount * 0.8]
    if len(recent_large) >= 3:
        triggered.append("REPEATED_LARGE_TRANSACTIONS")

    return {"rules_triggered": triggered, "forces_high_risk": len(triggered) > 0}
