package com.securepay.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvestigationResult {
    private String transactionRef;
    private String riskLevel; // HIGH_RISK / LOW_RISK
    private String summary;
    private double riskScore;
}
