package com.example.backend.dto.report;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Data Transfer Object for Report Data following SRP
 * This class is responsible only for holding report data structure
 */
public class ReportData {
    private String reportId;
    private String title;
    private String description;
    private String category;
    private String chartType;
    private LocalDateTime generatedAt;
    private List<ChartDataPoint> chartData;
    private Map<String, Object> statistics;
    private Map<String, Object> metadata;

    // Constructors
    public ReportData() {
    }

    public ReportData(String reportId, String title, String category, String chartType) {
        this.reportId = reportId;
        this.title = title;
        this.category = category;
        this.chartType = chartType;
        this.generatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getReportId() {
        return reportId;
    }

    public void setReportId(String reportId) {
        this.reportId = reportId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getChartType() {
        return chartType;
    }

    public void setChartType(String chartType) {
        this.chartType = chartType;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    public List<ChartDataPoint> getChartData() {
        return chartData;
    }

    public void setChartData(List<ChartDataPoint> chartData) {
        this.chartData = chartData;
    }

    public Map<String, Object> getStatistics() {
        return statistics;
    }

    public void setStatistics(Map<String, Object> statistics) {
        this.statistics = statistics;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}