package com.example.backend.service;

import org.springframework.stereotype.Service;
import java.util.UUID;

/**
 * Service responsible for generating unique account IDs
 * Single Responsibility: Account ID generation logic
 */
@Service
public class AccountIdGenerator {
    
    private static final String ACCOUNT_PREFIX = "WA";
    
    /**
     * Generates a unique account ID with prefix "WA" (Waste Account)
     */
    public String generateAccountId() {
        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        return ACCOUNT_PREFIX + uuid;
    }
}
