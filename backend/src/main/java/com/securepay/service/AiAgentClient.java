package com.securepay.service;

import com.securepay.dto.FraudAlertEvent;
import com.securepay.dto.InvestigationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Talks to the Python Fraud Investigation Agent service over REST.
 * If the AI service is unreachable, we fail safe to a HIGH_RISK
 * classification so a flagged transaction is never silently ignored.
 */
@Service
@Slf4j
public class AiAgentClient {

    private final RestClient restClient;

    public AiAgentClient(@Value("${app.ai-agent.base-url}") String baseUrl) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    public InvestigationResult investigate(FraudAlertEvent event) {
        try {
            return restClient.post()
                    .uri("/investigate")
                    .body(event)
                    .retrieve()
                    .body(InvestigationResult.class);
        } catch (Exception ex) {
            log.error("AI agent call failed for {}: {}", event.getTransactionRef(), ex.getMessage());
            InvestigationResult fallback = new InvestigationResult();
            fallback.setTransactionRef(event.getTransactionRef());
            fallback.setRiskLevel("HIGH_RISK");
            fallback.setSummary("AI agent unavailable — defaulted to HIGH_RISK for manual review.");
            fallback.setRiskScore(1.0);
            return fallback;
        }
    }
}
