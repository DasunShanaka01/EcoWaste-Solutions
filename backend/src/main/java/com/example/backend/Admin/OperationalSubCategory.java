package com.example.backend.Admin;

public enum OperationalSubCategory {
    WASTE_COLLECTION("Waste Collection"),
    SPECIAL_WASTE_COLLECTION("Special Waste Collection");

    private final String displayName;

    OperationalSubCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    @Override
    public String toString() {
        return displayName;
    }
}