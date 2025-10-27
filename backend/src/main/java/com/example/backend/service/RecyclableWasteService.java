package com.example.backend.service;

import com.example.backend.Waste.Waste;
import com.example.backend.strategy.PaybackStrategy;
import com.example.backend.strategy.RecyclableWasteStrategy;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Service for managing recyclable waste operations
 * 
 * SOLID PRINCIPLES APPLIED:
 * - Single Responsibility Principle (SRP): This class has a single
 * responsibility - orchestrating recyclable waste business logic
 * - Open/Closed Principle (OCP): Extends functionality through strategy pattern
 * without modifying existing code
 * - Liskov Substitution Principle (LSP): Can work with any
 * RecyclableWasteStrategy and PaybackStrategy implementations
 * - Interface Segregation Principle (ISP): Uses focused interfaces rather than
 * large, monolithic ones
 * - Dependency Inversion Principle (DIP): Depends on abstractions (strategies)
 * rather than concrete implementations
 */
@Service
public class RecyclableWasteService {

    // SOLID PRINCIPLE: Dependency Inversion Principle (DIP)
    // Depends on abstractions (interfaces) rather than concrete implementations
    private final RecyclableWasteStrategy recyclableWasteStrategy;
    private final Map<String, PaybackStrategy> paybackStrategies;

    // SOLID PRINCIPLE: Dependency Inversion Principle (DIP)
    // Constructor injection ensures dependencies are provided by Spring container
    public RecyclableWasteService(RecyclableWasteStrategy recyclableWasteStrategy,
            List<PaybackStrategy> paybackStrategyList) {
        this.recyclableWasteStrategy = recyclableWasteStrategy;
        // SOLID PRINCIPLE: Open/Closed Principle (OCP)
        // Strategy pattern allows adding new payback methods without modifying this
        // code
        this.paybackStrategies = paybackStrategyList.stream()
                .collect(Collectors.toMap(
                        PaybackStrategy::getPaybackMethod,
                        Function.identity()));
    }

    /**
     * Calculate payback amount for recyclable waste
     * 
     * @param weight   Weight in kg
     * @param category Waste category
     * @return Calculated payback amount
     */
    public double calculatePaybackAmount(double weight, String category) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - delegating payback calculation
        return recyclableWasteStrategy.calculatePaybackAmount(weight, category);
    }

    /**
     * Validate recyclable waste submission
     * 
     * @param waste Waste object to validate
     * @return Validation result
     */
    public RecyclableWasteStrategy.ValidationResult validateSubmission(Waste waste) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - delegating validation
        return recyclableWasteStrategy.validateSubmission(waste);
    }

    /**
     * Process recyclable waste submission
     * 
     * @param waste Waste object to process
     * @return Processed waste object
     */
    public Waste processSubmission(Waste waste) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - delegating waste processing
        return recyclableWasteStrategy.processSubmission(waste);
    }

    /**
     * Get supported waste categories
     * 
     * @return List of supported categories
     */
    public List<String> getSupportedCategories() {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - delegating category retrieval
        return recyclableWasteStrategy.getSupportedCategories();
    }

    /**
     * Get rate per kg for a specific category
     * 
     * @param category Waste category
     * @return Rate per kg
     */
    public double getRatePerKg(String category) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - delegating rate retrieval
        return recyclableWasteStrategy.getRatePerKg(category);
    }

    /**
     * Process payback for waste submission
     * 
     * @param waste Waste object containing payback information
     * @return Payback processing result
     */
    public PaybackStrategy.PaybackResult processPayback(Waste waste) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - orchestrating payback processing

        String paybackMethod = waste.getPaybackMethod();
        PaybackStrategy strategy = paybackStrategies.get(paybackMethod);

        if (strategy == null) {
            return PaybackStrategy.PaybackResult.error("Unsupported payback method: " + paybackMethod);
        }

        // SOLID PRINCIPLE: Dependency Inversion Principle (DIP)
        // Uses strategy pattern to delegate to appropriate implementation
        return strategy.processPayback(waste);
    }

    /**
     * Validate payback method for waste submission
     * 
     * @param waste Waste object to validate
     * @return True if valid, false otherwise
     */
    public boolean validatePaybackMethod(Waste waste) {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - orchestrating payback validation

        String paybackMethod = waste.getPaybackMethod();
        PaybackStrategy strategy = paybackStrategies.get(paybackMethod);

        if (strategy == null) {
            return false;
        }

        // SOLID PRINCIPLE: Dependency Inversion Principle (DIP)
        // Uses strategy pattern to delegate to appropriate implementation
        return strategy.validatePaybackMethod(waste);
    }

    /**
     * Get all supported payback methods
     * 
     * @return List of supported payback methods
     */
    public List<String> getSupportedPaybackMethods() {
        // SOLID PRINCIPLE: Single Responsibility Principle (SRP)
        // This method has a single responsibility - returning supported payback methods
        return paybackStrategies.keySet().stream().collect(Collectors.toList());
    }
}
