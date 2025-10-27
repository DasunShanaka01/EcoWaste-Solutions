package com.example.backend.strategy;

import com.example.backend.Waste.Waste;
import java.util.List;

/**
 * Strategy interface for recyclable waste operations
 * 
 * SOLID PRINCIPLES APPLIED:
 * - Single Responsibility Principle (SRP): This interface has a single
 * responsibility - defining operations for recyclable waste processing
 * - Open/Closed Principle (OCP): New waste processing strategies can be added
 * by implementing this interface without modifying existing code
 * - Liskov Substitution Principle (LSP): Any implementation of this interface
 * can be substituted for another without breaking functionality
 * - Interface Segregation Principle (ISP): This interface is focused and
 * cohesive, containing only methods relevant to recyclable waste operations
 * - Dependency Inversion Principle (DIP): High-level modules depend on this
 * abstraction rather than concrete implementations
 */
public interface RecyclableWasteStrategy {

    /**
     * Calculate payback amount for recyclable waste
     * 
     * @param weight   Weight in kg
     * @param category Waste category
     * @return Calculated payback amount
     */
    double calculatePaybackAmount(double weight, String category);

    /**
     * Validate recyclable waste submission
     * 
     * @param waste Waste object to validate
     * @return Validation result
     */
    ValidationResult validateSubmission(Waste waste);

    /**
     * Process recyclable waste submission
     * 
     * @param waste Waste object to process
     * @return Processed waste object
     */
    Waste processSubmission(Waste waste);

    /**
     * Get supported waste categories
     * 
     * @return List of supported categories
     */
    List<String> getSupportedCategories();

    /**
     * Get rate per kg for a specific category
     * 
     * @param category Waste category
     * @return Rate per kg
     */
    double getRatePerKg(String category);

    /**
     * Validation result class
     * 
     * SOLID PRINCIPLES APPLIED:
     * - Single Responsibility Principle (SRP): This class has a single
     * responsibility - representing validation results
     * - Immutable design prevents side effects and ensures thread safety
     */
    class ValidationResult {
        private final boolean valid;
        private final String errorMessage;

        public ValidationResult(boolean valid, String errorMessage) {
            this.valid = valid;
            this.errorMessage = errorMessage;
        }

        public boolean isValid() {
            return valid;
        }

        public String getErrorMessage() {
            return errorMessage;
        }

        public static ValidationResult success() {
            return new ValidationResult(true, null);
        }

        public static ValidationResult error(String message) {
            return new ValidationResult(false, message);
        }
    }
}
