package com.example.backend.Admin;

public enum ReportCategory {
    OPERATIONAL("Operational"),
    FINANCIAL("Financial"),
    CUSTOM("Custom");

    private final String displayName;

    ReportCategory(String displayName) {
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