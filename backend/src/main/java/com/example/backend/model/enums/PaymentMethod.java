package com.example.backend.model.enums;

/**
 * Internal enum for payment methods - used for type safety internally
 * while maintaining string compatibility for external APIs
 */
public enum PaymentMethod {
    CARD("Card"),
    BANK("Bank"),
    CASH("Cash");

    private final String displayName;

    PaymentMethod(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * Safely converts string to enum, returns null if invalid
     * This prevents breaking existing code
     */
    public static PaymentMethod fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        
        String normalizedValue = value.trim().toLowerCase();
        for (PaymentMethod method : values()) {
            if (method.displayName.toLowerCase().equals(normalizedValue) || 
                method.name().toLowerCase().equals(normalizedValue)) {
                return method;
            }
        }
        return null; // Return null instead of throwing exception
    }

    @Override
    public String toString() {
        return displayName;
    }
}
