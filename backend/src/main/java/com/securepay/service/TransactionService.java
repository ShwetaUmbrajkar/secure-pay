package com.securepay.service;

import com.securepay.dto.FraudAlertEvent;
import com.securepay.dto.TransactionRequest;
import com.securepay.exception.ResourceNotFoundException;
import com.securepay.model.Account;
import com.securepay.model.Transaction;
import com.securepay.repository.AccountRepository;
import com.securepay.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final FraudEventProducer fraudEventProducer;

    @Value("${app.fraud.amount-threshold}")
    private BigDecimal amountThreshold;

    @Transactional
    public Transaction create(TransactionRequest request) {
        Account account = accountRepository.findByAccountNumber(request.getAccountNumber())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Account not found: " + request.getAccountNumber()));

        if ("DEBIT".equals(request.getType()) && account.getBalance().compareTo(request.getAmount()) < 0) {
            throw new IllegalArgumentException("Insufficient balance");
        }

        BigDecimal newBalance = "DEBIT".equals(request.getType())
                ? account.getBalance().subtract(request.getAmount())
                : account.getBalance().add(request.getAmount());
        account.setBalance(newBalance);
        accountRepository.save(account);

        Transaction transaction = Transaction.builder()
                .transactionRef("TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .account(account)
                .amount(request.getAmount())
                .type(request.getType())
                .createdAt(Instant.now())
                .riskStatus(Transaction.RiskStatus.PENDING)
                .build();
        transaction = transactionRepository.save(transaction);

        if (request.getAmount().compareTo(amountThreshold) >= 0) {
            fraudEventProducer.publish(new FraudAlertEvent(
                    transaction.getTransactionRef(),
                    account.getAccountNumber(),
                    transaction.getAmount(),
                    transaction.getType(),
                    transaction.getCreatedAt()
            ));
        } else {
            transaction.setRiskStatus(Transaction.RiskStatus.LOW_RISK);
            transactionRepository.save(transaction);
        }

        return transaction;
    }

    public Page<Transaction> getHistory(Long accountId, Pageable pageable) {
        return transactionRepository.findByAccountId(accountId, pageable);
    }

    public Transaction getByRef(String ref) {
        return transactionRepository.findByTransactionRef(ref)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + ref));
    }

    public void updateRiskStatus(String transactionRef, Transaction.RiskStatus status) {
        Transaction t = getByRef(transactionRef);
        t.setRiskStatus(status);
        transactionRepository.save(t);
    }
}
