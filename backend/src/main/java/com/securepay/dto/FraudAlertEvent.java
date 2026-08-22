package com.securepay.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FraudAlertEvent {
    private String transactionRef;
    private String accountNumber;
    private BigDecimal amount;
    private String type;
    private Instant createdAt;
}
