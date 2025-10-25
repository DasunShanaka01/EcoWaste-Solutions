package com.example.backend.strategy.impl;

import com.example.backend.dto.SpecialCollectionDTOs.FeeRequest;
import com.example.backend.strategy.FeeCalculationStrategy;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Default implementation of FeeCalculationStrategy.
 */
@Component
public class DefaultFeeCalculationStrategy implements FeeCalculationStrategy {
    
    private static final Map<String, Double> RATE_MAP;
    private static final double DEFAULT_RATE = 120.0;
    
    static {
        Map<String, Double> rateMap = new HashMap<>();
        rateMap.put("bulky", 120.0);
        rateMap.put("hazardous", 140.0);
        rateMap.put("organic", 80.0);
        rateMap.put("e-waste", 130.0);
        rateMap.put("recyclable", 40.0);
        rateMap.put("other", 100.0);
        
        RATE_MAP = Collections.unmodifiableMap(rateMap);
    }

    @Override
    public double calculateFee(FeeRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Fee request cannot be null");
        }
        
        double kg = Math.max(1, request.quantity);
        String category = request.category == null ? "" : request.category.toLowerCase();
        
        return getRateForCategory(category) * kg;
    }
    
    @Override
    public double getRateForCategory(String category) {
        if (category == null) {
            return DEFAULT_RATE;
        }
        
        return RATE_MAP.getOrDefault(category.toLowerCase(), DEFAULT_RATE);
    }
}
