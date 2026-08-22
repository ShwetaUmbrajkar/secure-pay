from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime

from agent import FraudInvestigationAgent

app = FastAPI(title="SecurePay Fraud Investigation Agent", version="0.1.0")
agent = FraudInvestigationAgent()


class FraudAlertEvent(BaseModel):
    transactionRef: str
    accountNumber: str
    amount: float
    type: str
    createdAt: str | None = None


class InvestigationResult(BaseModel):
    transactionRef: str
    riskLevel: str
    riskScore: float
    summary: str


@app.get("/health")
def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}


@app.post("/investigate", response_model=InvestigationResult)
def investigate(event: FraudAlertEvent):
    """
    Called by the Spring Boot backend when a transaction is flagged
    (amount over threshold). Runs the Fraud Investigation Agent's
    tool-calling pipeline and returns a HIGH_RISK / LOW_RISK verdict
    with an explainable summary.
    """
    result = agent.investigate(
        transaction_ref=event.transactionRef,
        account_number=event.accountNumber,
        amount=event.amount,
    )
    return InvestigationResult(
        transactionRef=result["transactionRef"],
        riskLevel=result["riskLevel"],
        riskScore=result["riskScore"],
        summary=result["summary"],
    )


@app.get("/investigate/{transaction_ref}/trace")
def investigate_with_trace(transaction_ref: str, account_number: str, amount: float):
    """Debug/demo endpoint exposing the full tool-call trace, useful for
    showing how the agent reasoned through an investigation."""
    return agent.investigate(transaction_ref, account_number, amount)
