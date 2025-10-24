package com.example.backend.model.enums;

/**
 * Internal enum for time slots - used for type safety internally
 * while maintaining string compatibility for external APIs
 */
public enum TimeSlot {
    MORNING("Morning"),
    AFTERNOON("Afternoon");

    private final String displayName;

    TimeSlot(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * Safely converts string to enum, returns null if invalid
     * This prevents breaking existing code
     */
    public static TimeSlot fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        
        String normalizedValue = value.trim();
        for (TimeSlot slot : values()) {
            if (slot.displayName.equalsIgnoreCase(normalizedValue) || 
                slot.name().equalsIgnoreCase(normalizedValue)) {
                return slot;
            }
        }
        return null; // Return null instead of throwing exception
    }

    @Override
    public String toString() {
        return displayName;
    }
}
