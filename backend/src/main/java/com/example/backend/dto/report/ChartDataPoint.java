package com.example.backend.dto.report;

/**
 * Chart Data Point DTO following SRP
 * This class is responsible only for holding individual chart data points
 */
public class ChartDataPoint {
    private String label;
    private Double value;
    private String color;
    private String category;
    private String period;

    // Constructors
    public ChartDataPoint() {
    }

    public ChartDataPoint(String label, Double value) {
        this.label = label;
        this.value = value;
    }

    public ChartDataPoint(String label, Double value, String color) {
        this.label = label;
        this.value = value;
        this.color = color;
    }

    public ChartDataPoint(String label, Double value, String color, String category) {
        this.label = label;
        this.value = value;
        this.color = color;
        this.category = category;
    }

    // Getters and Setters
    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public Double getValue() {
        return value;
    }

    public void setValue(Double value) {
        this.value = value;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }
}