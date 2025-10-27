package com.example.backend.strategy.impl;

import com.example.backend.Waste.Waste;
import com.example.backend.strategy.PaybackStrategy;
import com.example.backend.service.DigitalWalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Digital Wallet payback strategy implementation
 * 
 * SOLID PRINCIPLES APPLIED:
 * - Single Responsibility Principle (SRP): This class has a single
 * responsibility - handling digital wallet payback processing
 * - Open/Closed Principle (OCP): Extends functionality through interface
 * implementation without modifying existing code
 * - Liskov Substitution Principle (LSP): Can be substituted for any
 * PaybackStrategy implementation
 * - Dependency Inversion Principle (DIP): Depends on abstractions
 * (DigitalWalletService) rather than concrete implementations
 */
@Component
public class DigitalWalletPaybackStrategy implements PaybackStrategy {

    // SOLID PRINCIPLE: Dependency Inversion Principle (DIP)
    // Depends on abstraction (service interface) rather than concrete
    // implementation
    @Autowired
    private DigitalWalletService digitalWalletService;

    @Override
    public PaybackResult processPayback(Waste waste) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - processing digital wallet payback
        try {
            if (!validatePaybackMethod(waste)) {
                return PaybackResult.error("Invalid digital wallet payback method");
            }

            // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
            // Calculate points based on actual payback amount if available, otherwise
            // estimated
            double paybackAmount = waste.getActualPaybackAmount() != null
                    ? waste.getActualPaybackAmount()
                    : waste.getTotalPaybackAmount();

            int pointsToAdd = (int) Math.round(paybackAmount);

            if (pointsToAdd > 0) {
                String description = waste.getActualPaybackAmount() != null
                        ? "Points earned from recyclable waste collection (actual weight) - " + waste.getId().toString()
                        : "Points earned from recyclable waste collection (estimated weight) - "
                                + waste.getId().toString();

                // SOLID PRINCIPLE: Dependency Inversion Principle (DIP)
                // Uses injected service rather than creating dependencies directly
                digitalWalletService.addPoints(waste.getUserId(), pointsToAdd, description);

                return PaybackResult.success(
                        "Successfully added " + pointsToAdd + " points to digital wallet",
                        pointsToAdd);
            } else {
                return PaybackResult.error("No points to add - payback amount is zero or negative");
            }

        } catch (Exception e) {
            return PaybackResult.error("Failed to process digital wallet payback: " + e.getMessage());
        }
    }

    @Override
    public boolean validatePaybackMethod(Waste waste) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - validating digital wallet payback
        // method
        return waste != null
                && "Digital Wallet".equals(waste.getPaybackMethod())
                && waste.getUserId() != null
                && !waste.getUserId().trim().isEmpty();
    }

    @Override
    public String getPaybackMethod() {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - returning the payback method name
        return "Digital Wallet";
    }
}
