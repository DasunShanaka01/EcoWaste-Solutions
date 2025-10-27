package com.example.backend.strategy.impl;

import com.example.backend.Waste.Waste;
import com.example.backend.strategy.PaybackStrategy;
import org.springframework.stereotype.Component;

/**
 * Donation payback strategy implementation
 * 
 * SOLID PRINCIPLES APPLIED:
 * - Single Responsibility Principle (SRP): This class has a single
 * responsibility - handling donation payback processing
 * - Open/Closed Principle (OCP): Extends functionality through interface
 * implementation without modifying existing code
 * - Liskov Substitution Principle (LSP): Can be substituted for any
 * PaybackStrategy implementation
 * - Dependency Inversion Principle (DIP): No direct dependencies on concrete
 * implementations
 */
@Component
public class DonationPaybackStrategy implements PaybackStrategy {

    @Override
    public PaybackResult processPayback(Waste waste) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - processing donation payback
        try {
            if (!validatePaybackMethod(waste)) {
                return PaybackResult.error("Invalid donation payback method");
            }

            // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
            // For donation, we just validate the charity organization
            // Actual donation would be handled by a separate charity service
            double paybackAmount = waste.getActualPaybackAmount() != null
                    ? waste.getActualPaybackAmount()
                    : waste.getTotalPaybackAmount();

            return PaybackResult.success(
                    "Donation of LKR " + String.format("%.2f", paybackAmount) +
                            " initiated to " + waste.getCharityOrganization(),
                    waste.getCharityOrganization());

        } catch (Exception e) {
            return PaybackResult.error("Failed to process donation payback: " + e.getMessage());
        }
    }

    @Override
    public boolean validatePaybackMethod(Waste waste) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - validating donation payback method
        return waste != null
                && "Donation".equals(waste.getPaybackMethod())
                && waste.getCharityOrganization() != null
                && !waste.getCharityOrganization().trim().isEmpty();
    }

    @Override
    public String getPaybackMethod() {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - returning the payback method name
        return "Donation";
    }
}
