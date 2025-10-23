package com.example.backend.service.report;

import com.example.backend.dto.report.ReportData;
import com.example.backend.dto.report.ReportParameters;

/**
 * Interface for Report Data Generation following OCP
 * This interface is open for extension but closed for modification
 * New report types can be added by implementing this interface
 */
public interface ReportDataGenerator {
    /**
     * Generates report data based on the provided parameters
     * 
     * @param parameters Report generation parameters
     * @return Generated report data
     */
    ReportData generateReportData(ReportParameters parameters);

    /**
     * Gets the supported report category for this generator
     * 
     * @return The category this generator supports
     */
    String getSupportedCategory();

    /**
     * Gets the supported chart type for this generator
     * 
     * @return The chart type this generator supports
     */
    String getSupportedChartType();

    /**
     * Validates if the generator can handle the given parameters
     * 
     * @param parameters Report parameters to validate
     * @return true if parameters are valid for this generator
     */
    boolean canHandle(ReportParameters parameters);
}