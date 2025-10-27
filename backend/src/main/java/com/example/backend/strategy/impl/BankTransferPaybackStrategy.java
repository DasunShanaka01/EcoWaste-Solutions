package com.example.backend.strategy.impl;

import com.example.backend.Waste.Waste;
import com.example.backend.strategy.PaybackStrategy;
import org.springframework.stereotype.Component;

/**
 * Bank Transfer payback strategy implementation
 * 
 * SOLID PRINCIPLES APPLIED:
 * - Single Responsibility Principle (SRP): This class has a single
 * responsibility - handling bank transfer payback processing
 * - Open/Closed Principle (OCP): Extends functionality through interface
 * implementation without modifying existing code
 * - Liskov Substitution Principle (LSP): Can be substituted for any
 * PaybackStrategy implementation
 * - Dependency Inversion Principle (DIP): No direct dependencies on concrete
 * implementations
 */
@Component
public class BankTransferPaybackStrategy implements PaybackStrategy {

    @Override
    public PaybackResult processPayback(Waste waste) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - processing bank transfer payback
        try {
            if (!validatePaybackMethod(waste)) {
                return PaybackResult.error("Invalid bank transfer payback method");
            }

            // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
            // For bank transfer, we just validate the details
            // Actual transfer would be handled by a separate banking service
            double paybackAmount = waste.getActualPaybackAmount() != null
                    ? waste.getActualPaybackAmount()
                    : waste.getTotalPaybackAmount();

            return PaybackResult.success(
                    "Bank transfer initiated for LKR " + String.format("%.2f", paybackAmount),
                    waste.getBankTransferDetails());

        } catch (Exception e) {
            return PaybackResult.error("Failed to process bank transfer payback: " + e.getMessage());
        }
    }

    @Override
    public boolean validatePaybackMethod(Waste waste) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - validating bank transfer payback
        // method
        return waste != null
                && "Bank Transfer".equals(waste.getPaybackMethod())
                && waste.getBankTransferDetails() != null
                && waste.getBankTransferDetails().getBankName() != null
                && !waste.getBankTransferDetails().getBankName().trim().isEmpty()
                && waste.getBankTransferDetails().getAccountNumber() != null
                && !waste.getBankTransferDetails().getAccountNumber().trim().isEmpty()
                && waste.getBankTransferDetails().getAccountHolderName() != null
                && !waste.getBankTransferDetails().getAccountHolderName().trim().isEmpty();
    }

    @Override
    public String getPaybackMethod() {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - returning the payback method name
        return "Bank Transfer";
    }
}
