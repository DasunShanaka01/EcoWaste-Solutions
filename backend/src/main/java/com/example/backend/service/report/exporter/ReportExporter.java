package com.example.backend.service.report.exporter;

import com.example.backend.dto.report.ReportData;

/**
 * Interface for Report Export following OCP
 * This interface allows adding new export destinations without modifying
 * existing code
 */
public interface ReportExporter {
    /**
     * Exports the formatted report to the destination
     * 
     * @param reportData    The report data to export
     * @param formattedData The formatted report data
     * @return Export result information
     */
    ExportResult exportReport(ReportData reportData, byte[] formattedData);

    /**
     * Gets the supported export type
     * 
     * @return The export type this exporter supports (e.g., "FILE", "EMAIL",
     *         "CLOUD")
     */
    String getSupportedExportType();

    /**
     * Validates if the exporter can handle the export request
     * 
     * @param reportData The report data to validate
     * @return true if the export can be handled
     */
    boolean canExport(ReportData reportData);
}