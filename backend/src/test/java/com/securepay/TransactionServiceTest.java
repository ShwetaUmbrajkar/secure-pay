package com.securepay;

import com.securepay.dto.TransactionRequest;
import com.securepay.model.Account;
import com.securepay.repository.AccountRepository;
import com.securepay.repository.TransactionRepository;
import com.securepay.service.FraudEventProducer;
import com.securepay.service.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private AccountRepository accountRepository;
    @Mock
    private FraudEventProducer fraudEventProducer;

    @InjectMocks
    private TransactionService transactionService;

    private Account account;

    @BeforeEach
    void setUp() {
        account = Account.builder()
                .id(1L)
                .accountNumber("ACC-001")
                .ownerName("Test User")
                .balance(new BigDecimal("5000"))
                .build();
        ReflectionTestUtils.setField(transactionService, "amountThreshold", new BigDecimal("100000"));
    }

    @Test
    void smallDebit_doesNotTriggerFraudCheck() {
        when(accountRepository.findByAccountNumber("ACC-001")).thenReturn(Optional.of(account));
        when(transactionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        TransactionRequest request = new TransactionRequest();
        request.setAccountNumber("ACC-001");
        request.setAmount(new BigDecimal("500"));
        request.setType("DEBIT");

        var result = transactionService.create(request);

        assertEquals("LOW_RISK", result.getRiskStatus().name());
        verify(fraudEventProducer, never()).publish(any());
        assertEquals(new BigDecimal("4500"), account.getBalance());
    }

    @Test
    void debitExceedingBalance_throws() {
        when(accountRepository.findByAccountNumber("ACC-001")).thenReturn(Optional.of(account));

        TransactionRequest request = new TransactionRequest();
        request.setAccountNumber("ACC-001");
        request.setAmount(new BigDecimal("10000"));
        request.setType("DEBIT");

        assertThrows(IllegalArgumentException.class, () -> transactionService.create(request));
    }

    @Test
    void largeAmount_triggersFraudEvent() {
        when(accountRepository.findByAccountNumber("ACC-001")).thenReturn(Optional.of(account));
        when(transactionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        TransactionRequest request = new TransactionRequest();
        request.setAccountNumber("ACC-001");
        request.setAmount(new BigDecimal("150000"));
        request.setType("CREDIT");

        transactionService.create(request);

        verify(fraudEventProducer, times(1)).publish(any());
    }
}
