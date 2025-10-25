package com.example.backend.service;

import com.example.backend.dto.SpecialCollectionDTOs.FeeRequest;

//Interface for fee calculation operations.
public interface SpecialCollectionFeeService {
    
    /**
     * Calculates the fee for a special waste collection request.
     * 
     * @param request The fee calculation request
     * @return The calculated fee in LKR
     */
    double calculateFee(FeeRequest request);
}
