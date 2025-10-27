package com.example.backend.strategy.impl;

import com.example.backend.Waste.Waste;
import com.example.backend.strategy.RecyclableWasteStrategy;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Default implementation of RecyclableWasteStrategy
 * 
 * SOLID PRINCIPLES APPLIED:
 * - Single Responsibility Principle (SRP): This class has a single
 * responsibility - handling recyclable waste calculations and validation
 * - Open/Closed Principle (OCP): Extends functionality through interface
 * implementation without modifying existing code
 * - Liskov Substitution Principle (LSP): Can be substituted for any
 * RecyclableWasteStrategy implementation
 * - Dependency Inversion Principle (DIP): Depends on abstractions (interface)
 * rather than concrete implementations
 */
@Component
public class DefaultRecyclableWasteStrategy implements RecyclableWasteStrategy {

    // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
    // Centralized configuration - all rates are managed in one place
    // Category rates per kg in LKR - centralized configuration
    private static final double E_WASTE_RATE = 15.00;
    private static final double PLASTIC_RATE = 8.00;
    private static final double GLASS_RATE = 6.00;
    private static final double ALUMINUM_RATE = 12.00;
    private static final double PAPER_CARDBOARD_RATE = 4.00;
    private static final double DEFAULT_RATE = 5.00;

    // SOLID PRINCIPLE: Open/Closed Principle (OCP)
    // Easy to extend by adding new categories to this list
    private static final List<String> SUPPORTED_CATEGORIES = Arrays.asList(
            "E-waste", "Plastic", "Glass", "Aluminum", "Paper/Cardboard");

    @Override
    public double calculatePaybackAmount(double weight, String category) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - calculating payback amount
        if (weight <= 0) {
            return 0.0;
        }

        double ratePerKg = getRatePerKg(category);
        return weight * ratePerKg;
    }

    @Override
    public ValidationResult validateSubmission(Waste waste) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - validating waste submissions

        if (waste == null) {
            return ValidationResult.error("Waste object cannot be null");
        }

        if (waste.getUserId() == null || waste.getUserId().trim().isEmpty()) {
            return ValidationResult.error("User ID is required");
        }

        if (waste.getTotalWeightKg() <= 0) {
            return ValidationResult.error("Weight must be greater than 0");
        }

        if (waste.getItems() == null || waste.getItems().isEmpty()) {
            return ValidationResult.error("At least one item is required");
        }

        // SOLID PRINCIPLE: Open/Closed Principle (OCP)
        // Validation logic is extensible - new validation rules can be added without
        // modifying existing code
        // Validate category
        String category = waste.getItems().get(0).getCategory();
        if (category == null || !SUPPORTED_CATEGORIES.contains(category)) {
            return ValidationResult.error("Invalid or unsupported waste category: " + category);
        }

        return ValidationResult.success();
    }

    @Override
    public Waste processSubmission(Waste waste) {
        // SOLID PRINCIPLE: Open/Closed Principle (OCP)
        // This method can be extended to add new processing logic without modifying
        // existing code
        // Apply any business logic specific to recyclable waste processing
        // For now, just return the waste as-is
        // This can be extended to add processing logic like categorization,
        // environmental impact calculation, etc.
        return waste;
    }

    @Override
    public List<String> getSupportedCategories() {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - returning supported categories
        return SUPPORTED_CATEGORIES;
    }

    @Override
    public double getRatePerKg(String category) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - returning rate per kg for a
        // category

        if (category == null) {
            return DEFAULT_RATE;
        }

        // SOLID PRINCIPLE: Open/Closed Principle (OCP)
        // Easy to extend by adding new cases without modifying existing logic
        switch (category.toLowerCase()) {
            case "e-waste":
                return E_WASTE_RATE;
            case "plastic":
                return PLASTIC_RATE;
            case "glass":
                return GLASS_RATE;
            case "aluminum":
                return ALUMINUM_RATE;
            case "paper/cardboard":
                return PAPER_CARDBOARD_RATE;
            default:
                return DEFAULT_RATE;
        }
    }
}
