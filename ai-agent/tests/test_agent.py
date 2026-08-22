import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from tools import run_risk_engine, apply_rules_engine
from agent import FraudInvestigationAgent


def test_risk_engine_flags_large_deviation():
    score = run_risk_engine(amount=50000, avg_transaction_amount=1000, account_age_days=500)
    assert score >= 0.5


def test_risk_engine_low_for_typical_transaction():
    score = run_risk_engine(amount=1000, avg_transaction_amount=1000, account_age_days=500)
    assert score < 0.3


def test_rules_engine_flags_unverified_kyc():
    result = apply_rules_engine(amount=1000, kyc_verified=False, history=[])
    assert "KYC_NOT_VERIFIED" in result["rules_triggered"]
    assert result["forces_high_risk"] is True


def test_agent_returns_verdict_and_trace():
    agent = FraudInvestigationAgent()
    result = agent.investigate("TXN-TEST-1", "ACC-999", 200000)
    assert result["riskLevel"] in ("HIGH_RISK", "LOW_RISK")
    assert len(result["trace"]) == 4
    assert "TXN-TEST-1" in result["summary"]
