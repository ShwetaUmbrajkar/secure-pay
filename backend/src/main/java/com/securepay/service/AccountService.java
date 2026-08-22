package com.securepay.service;

import com.securepay.exception.ResourceNotFoundException;
import com.securepay.model.Account;
import com.securepay.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;

    public Account getByAccountNumber(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountNumber));
    }

    public Account create(Account account) {
        return accountRepository.save(account);
    }
}
