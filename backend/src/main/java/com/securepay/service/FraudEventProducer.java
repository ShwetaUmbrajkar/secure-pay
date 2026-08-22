package com.securepay.service;

import com.securepay.dto.FraudAlertEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FraudEventProducer {

    private final KafkaTemplate<String, FraudAlertEvent> kafkaTemplate;

    @Value("${app.kafka.fraud-topic}")
    private String fraudTopic;

    public void publish(FraudAlertEvent event) {
        kafkaTemplate.send(fraudTopic, event.getTransactionRef(), event);
    }
}
