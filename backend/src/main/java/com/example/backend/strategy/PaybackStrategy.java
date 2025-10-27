package com.example.backend.strategy;

import com.example.backend.Waste.Waste;

/**
 * Strategy interface for payback processing
 * 
 * SOLID PRINCIPLES APPLIED:
 * - Single Responsibility Principle (SRP): This interface has a single
 * responsibility - defining payback processing operations
 * - Open/Closed Principle (OCP): New payback methods can be added by
 * implementing this interface without modifying existing code
 * - Liskov Substitution Principle (LSP): Any implementation of this interface
 * can be substituted for another without breaking functionality
 * - Interface Segregation Principle (ISP): This interface is focused and
 * cohesive, containing only methods relevant to payback operations
 * - Dependency Inversion Principle (DIP): High-level modules depend on this
 * abstraction rather than concrete implementations
 */
public interface PaybackStrategy {

    /**
     * Process payback for waste submission
     * 
     * @param waste Waste object containing payback information
     * @return Processing result
     */
    PaybackResult processPayback(Waste waste);

    /**
     * Validate payback method
     * 
     * @param waste Waste object to validate
     * @return Validation result
     */
    boolean validatePaybackMethod(Waste waste);

    /**
     * Get supported payback method
     * 
     * @return Payback method name
     */
    String getPaybackMethod();

    /**
     * Payback processing result
     * 
     * SOLID PRINCIPLES APPLIED:
     * - Single Responsibility Principle (SRP): This class has a single
     * responsibility - representing payback processing results
     * - Immutable design prevents side effects and ensures thread safety
     */
    class PaybackResult {
        private final boolean success;
        private final String message;
        private final Object data;

        public PaybackResult(boolean success, String message, Object data) {
            this.success = success;
            this.message = message;
            this.data = data;
        }

        public boolean isSuccess() {
            return success;
        }

        public String getMessage() {
            return message;
        }

        public Object getData() {
            return data;
        }

        public static PaybackResult success(String message, Object data) {
            return new PaybackResult(true, message, data);
        }

        public static PaybackResult error(String message) {
            return new PaybackResult(false, message, null);
        }
    }
}
