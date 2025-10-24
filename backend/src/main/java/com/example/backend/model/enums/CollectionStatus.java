package com.example.backend.model.enums;

/**
 * Internal enum for collection status - used for type safety internally
 * while maintaining string compatibility for external APIs
 */
public enum CollectionStatus {
    PENDING("Pending"),
    SCHEDULED("Scheduled"),
    COLLECTED("Collected"),
    COMPLETED("Completed"),
    CANCELLED("Cancelled");

    private final String displayName;

    CollectionStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * Safely converts string to enum, returns null if invalid
     * This prevents breaking existing code
     */
    public static CollectionStatus fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        
        String normalizedValue = value.trim();
        for (CollectionStatus status : values()) {
            if (status.displayName.equalsIgnoreCase(normalizedValue) || 
                status.name().equalsIgnoreCase(normalizedValue)) {
                return status;
            }
        }
        return null; // Return null instead of throwing exception
    }

    @Override
    public String toString() {
        return displayName;
    }
}
