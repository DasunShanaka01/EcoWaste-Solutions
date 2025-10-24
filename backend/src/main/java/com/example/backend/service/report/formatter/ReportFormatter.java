package com.example.backend.service.report.formatter;

import com.example.backend.dto.report.ReportData;

/**
 * Interface for Report Formatting following OCP
 * This interface allows adding new formatting types without modifying existing
 * code
 */
public interface ReportFormatter {
    /**
     * Formats the report data into the desired output format
     * 
     * @param reportData The report data to format
     * @return Formatted report as byte array
     */
    byte[] formatReport(ReportData reportData);

    /**
     * Gets the supported format type
     * 
     * @return The format type this formatter supports (e.g., "PDF", "EXCEL",
     *         "JSON")
     */
    String getSupportedFormat();

    /**
     * Gets the content type for HTTP responses
     * 
     * @return The content type (e.g., "application/pdf",
     *         "application/vnd.ms-excel")
     */
    String getContentType();

    /**
     * Gets the file extension for the formatted report
     * 
     * @return The file extension (e.g., ".pdf", ".xlsx", ".json")
     */
    String getFileExtension();
}