package com.securepay.controller;

import com.securepay.dto.TransactionRequest;
import com.securepay.model.Transaction;
import com.securepay.service.AccountService;
import com.securepay.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final AccountService accountService;

    @PostMapping
    public ResponseEntity<Transaction> create(@Valid @RequestBody TransactionRequest request) {
        return ResponseEntity.ok(transactionService.create(request));
    }

    @GetMapping("/{transactionRef}")
    public ResponseEntity<Transaction> getOne(@PathVariable String transactionRef) {
        return ResponseEntity.ok(transactionService.getByRef(transactionRef));
    }

    @GetMapping("/account/{accountNumber}")
    public ResponseEntity<Page<Transaction>> history(@PathVariable String accountNumber, Pageable pageable) {
        Long accountId = accountService.getByAccountNumber(accountNumber).getId();
        return ResponseEntity.ok(transactionService.getHistory(accountId, pageable));
    }
}
