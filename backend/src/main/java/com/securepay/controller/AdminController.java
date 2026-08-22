package com.securepay.controller;

import com.securepay.model.Transaction;
import com.securepay.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** ROLE_ADMIN-only endpoints for the fraud-monitoring dashboard. */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final TransactionRepository transactionRepository;

    @GetMapping("/flagged")
    public ResponseEntity<Page<Transaction>> flagged() {
        Page<Transaction> page = transactionRepository.findAll(PageRequest.of(0, 50));
        return ResponseEntity.ok(page);
    }
}
