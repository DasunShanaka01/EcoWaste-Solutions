package com.example.backend.validator;

import com.example.backend.dto.CollectionRequestDTO;
import org.springframework.stereotype.Component;

/**
 * Service responsible for validating collection data
 * Single Responsibility: Data validation
 */
@Component
public class CollectionValidator {
    
    /**
     * Validates collection request data
     */
    public ValidationResult validate(CollectionRequestDTO request) {
        if (request == null) {
            return ValidationResult.error("Collection request cannot be null");
        }
        
        if (request.getAccountId() == null || request.getAccountId().trim().isEmpty()) {
            return ValidationResult.error("Account ID is required");
        }
        
        if (request.getAccountHolder() == null || request.getAccountHolder().trim().isEmpty()) {
            return ValidationResult.error("Account holder is required");
        }
        
        // Address is now optional - no validation needed
        
        if (request.getWeight() <= 0) {
            return ValidationResult.error("Weight must be greater than 0");
        }
        
        if (request.getWasteType() == null || request.getWasteType().trim().isEmpty()) {
            return ValidationResult.error("Waste type is required");
        }
        
        if (request.getCollectorId() == null || request.getCollectorId().trim().isEmpty()) {
            return ValidationResult.error("Collector ID is required");
        }
        
        return ValidationResult.success();
    }
    
    /**
     * Inner class for validation results
     */
    public static class ValidationResult {
        private final boolean valid;
        private final String errorMessage;
        
        private ValidationResult(boolean valid, String errorMessage) {
            this.valid = valid;
            this.errorMessage = errorMessage;
        }
        
        public static ValidationResult success() {
            return new ValidationResult(true, null);
        }
        
        public static ValidationResult error(String message) {
            return new ValidationResult(false, message);
        }
        
        public boolean isValid() { return valid; }
        public String getErrorMessage() { return errorMessage; }
    }
}
