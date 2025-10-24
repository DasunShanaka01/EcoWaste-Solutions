package com.example.backend.model.enums;

/**
 * Internal enum for waste categories - used for type safety internally
 * while maintaining string compatibility for external APIs
 */
public enum WasteCategory {
    BULKY("Bulky"),
    HAZARDOUS("Hazardous"),
    ORGANIC("Organic"),
    E_WASTE("E-Waste"),
    RECYCLABLE("Recyclable"),
    OTHER("Other");

    private final String displayName;

    WasteCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * Safely converts string to enum, returns null if invalid
     * This prevents breaking existing code
     */
    public static WasteCategory fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        
        String normalizedValue = value.trim();
        for (WasteCategory category : values()) {
            if (category.displayName.equalsIgnoreCase(normalizedValue) || 
                category.name().equalsIgnoreCase(normalizedValue)) {
                return category;
            }
        }
        return null; // Return null instead of throwing exception
    }

    @Override
    public String toString() {
        return displayName;
    }
}
