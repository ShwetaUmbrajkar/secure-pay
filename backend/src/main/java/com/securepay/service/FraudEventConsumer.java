package com.securepay.service;

import com.securepay.dto.FraudAlertEvent;
import com.securepay.dto.InvestigationResult;
import com.securepay.model.Transaction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class FraudEventConsumer {

    private final AiAgentClient aiAgentClient;
    private final TransactionService transactionService;

    @KafkaListener(topics = "${app.kafka.fraud-topic}", groupId = "${spring.kafka.consumer.group-id}")
    public void onFraudAlert(FraudAlertEvent event) {
        log.info("Investigating flagged transaction {}", event.getTransactionRef());

        InvestigationResult result = aiAgentClient.investigate(event);

        Transaction.RiskStatus status = "HIGH_RISK".equals(result.getRiskLevel())
                ? Transaction.RiskStatus.HIGH_RISK
                : Transaction.RiskStatus.LOW_RISK;

        transactionService.updateRiskStatus(event.getTransactionRef(), status);
        log.info("Transaction {} resolved as {} — {}", event.getTransactionRef(), status, result.getSummary());
    }
}
