package com.example.backend.dto.report;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

/**
 * Report Parameters DTO following SRP
 * This class is responsible only for holding report generation parameters
 */
public class ReportParameters {
    private String dateRange;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;
    private String region;
    private String department;
    private String wasteType;
    private String format;
    private boolean includeSampleData;
    private Boolean groupByDate;

    // Constructors
    public ReportParameters() {
    }

    public ReportParameters(LocalDate startDate, LocalDate endDate, String format) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.format = format;
    }

    // Getters and Setters
    public String getDateRange() {
        return dateRange;
    }

    public void setDateRange(String dateRange) {
        this.dateRange = dateRange;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getWasteType() {
        return wasteType;
    }

    public void setWasteType(String wasteType) {
        this.wasteType = wasteType;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public boolean isIncludeSampleData() {
        return includeSampleData;
    }

    public void setIncludeSampleData(boolean includeSampleData) {
        this.includeSampleData = includeSampleData;
    }

    public Boolean getGroupByDate() {
        return groupByDate;
    }

    public void setGroupByDate(Boolean groupByDate) {
        this.groupByDate = groupByDate;
    }

    @Override
    public String toString() {
        return "ReportParameters{" +
                "dateRange='" + dateRange + '\'' +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                ", region='" + region + '\'' +
                ", department='" + department + '\'' +
                ", wasteType='" + wasteType + '\'' +
                ", format='" + format + '\'' +
                ", includeSampleData=" + includeSampleData +
                ", groupByDate=" + groupByDate +
                '}';
    }
}