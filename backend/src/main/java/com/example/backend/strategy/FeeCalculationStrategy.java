package com.example.backend.strategy;

import com.example.backend.dto.SpecialCollectionDTOs.FeeRequest;

//Interface for fee calculation operations.
public interface FeeCalculationStrategy {
    
    /**
     * Calculates the fee for a special waste collection request.
     * 
     * @param request The fee calculation request
     * @return The calculated fee in LKR
     */
    double calculateFee(FeeRequest request);
    
    /**
     * Gets the rate per kg for a specific waste category.
     * 
     * @param category The waste category
     * @return The rate per kg in LKR
     */
    double getRateForCategory(String category);
}
