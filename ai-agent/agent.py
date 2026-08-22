"""
Fraud Investigation Agent.

Given a flagged transaction, the agent orchestrates a sequence of tool
calls (account lookup -> transaction history -> risk engine -> rules
engine), then compiles a structured, explainable investigation summary
ending in a HIGH_RISK / LOW_RISK verdict.

This is deliberately built as a transparent, deterministic tool-calling
pipeline first (so it always works offline, with no API key required).
An optional LLM narration step can be enabled by setting GROQ_API_KEY —
see `_narrate_with_llm` below — to turn the structured findings into a
natural-language explanation, without changing the decision logic itself.
"""
import os
import requests

from tools import get_account_info, get_transaction_history, run_risk_engine, apply_rules_engine

RISK_SCORE_HIGH_THRESHOLD = 0.5
GROQ_API_KEY = os.getenv("GROQ_API_KEY")  # optional — agent works fully without it
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")


class FraudInvestigationAgent:
    """Tool-calling agent: each `investigate` call is a small planned
    sequence of tool invocations, not a single hardcoded function — this
    makes it straightforward to add new tools (e.g. a device-fingerprint
    check) without changing the calling contract."""

    def __init__(self):
        self.tools = {
            "get_account_info": get_account_info,
            "get_transaction_history": get_transaction_history,
            "run_risk_engine": run_risk_engine,
            "apply_rules_engine": apply_rules_engine,
        }

    def investigate(self, transaction_ref: str, account_number: str, amount: float) -> dict:
        trace = []

        account_info = self.tools["get_account_info"](account_number)
        trace.append({"tool": "get_account_info", "output": account_info})

        history = self.tools["get_transaction_history"](account_number)
        trace.append({"tool": "get_transaction_history", "output": f"{len(history)} records"})

        risk_score = self.tools["run_risk_engine"](
            amount=amount,
            avg_transaction_amount=account_info["avg_transaction_amount"],
            account_age_days=account_info["account_age_days"],
        )
        trace.append({"tool": "run_risk_engine", "output": {"risk_score": risk_score}})

        rules_result = self.tools["apply_rules_engine"](
            amount=amount,
            kyc_verified=account_info["kyc_verified"],
            history=history,
        )
        trace.append({"tool": "apply_rules_engine", "output": rules_result})

        is_high_risk = risk_score >= RISK_SCORE_HIGH_THRESHOLD or rules_result["forces_high_risk"]
        risk_level = "HIGH_RISK" if is_high_risk else "LOW_RISK"

        summary = self._build_summary(
            transaction_ref, account_number, amount, account_info, risk_score, rules_result, risk_level
        )

        if GROQ_API_KEY:
            llm_summary = self._narrate_with_llm(summary)
            if llm_summary:
                summary = llm_summary

        return {
            "transactionRef": transaction_ref,
            "riskLevel": risk_level,
            "riskScore": round(risk_score, 3),
            "summary": summary,
            "trace": trace,
        }

    @staticmethod
    def _build_summary(ref, account_number, amount, account_info, risk_score, rules_result, risk_level) -> str:
        parts = [
            f"Transaction {ref} on account {account_number} for amount {amount}.",
            f"Account age: {account_info['account_age_days']} days, "
            f"avg transaction size: {account_info['avg_transaction_amount']}.",
            f"Heuristic risk score: {round(risk_score, 3)}.",
        ]
        if rules_result["rules_triggered"]:
            parts.append("Rules triggered: " + ", ".join(rules_result["rules_triggered"]) + ".")
        else:
            parts.append("No hard business rules triggered.")
        parts.append(f"Verdict: {risk_level}.")
        return " ".join(parts)

    @staticmethod
    def _narrate_with_llm(structured_summary: str) -> str | None:
        """Optional: rewrite the structured summary in natural language via
        Groq's OpenAI-compatible chat completions API. Returns None (and the
        caller keeps the deterministic summary) if the call fails for any
        reason — the agent's verdict never depends on the LLM being up."""
        try:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": "You are a fraud analyst. Rewrite the "
                                                       "following structured finding as a concise, "
                                                       "professional 2-3 sentence explanation. Do not "
                                                       "invent facts not present in the input."},
                        {"role": "user", "content": structured_summary},
                    ],
                    "temperature": 0.2,
                },
                timeout=5,
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"].strip()
        except Exception:
            return None
