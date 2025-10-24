package com.example.backend.service.report;

import com.example.backend.dto.report.ReportData;
import com.example.backend.dto.report.ReportParameters;
import com.example.backend.service.report.formatter.ReportFormatter;
import com.example.backend.service.report.exporter.ExportResult;
import com.example.backend.service.report.exporter.ReportExporter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Main Report Generation Service following DIP
 * This class depends on abstractions (interfaces) rather than concrete
 * implementations
 * This allows for easy extension and testing through dependency injection
 */
@Service
public class ReportGenerationService {

    private final List<ReportDataGenerator> dataGenerators;
    private final List<ReportFormatter> formatters;
    private final List<ReportExporter> exporters;

    @Autowired
    public ReportGenerationService(
            List<ReportDataGenerator> dataGenerators,
            List<ReportFormatter> formatters,
            List<ReportExporter> exporters) {
        this.dataGenerators = dataGenerators;
        this.formatters = formatters;
        this.exporters = exporters;
    }

    /**
     * Generates a complete report with the specified parameters
     * 
     * @param category   Report category (e.g., "Waste Collection Analytics")
     * @param chartType  Chart type (e.g., "bar", "pie", "donut")
     * @param parameters Report generation parameters
     * @return Generated report data
     */
    public ReportData generateReport(String category, String chartType, ReportParameters parameters) {
        System.out.println("Looking for generator with category: '" + category + "', chartType: '" + chartType + "'");
        System.out.println("Available generators:");
        for (ReportDataGenerator gen : dataGenerators) {
            System.out.println("  - Category: '" + gen.getSupportedCategory() + "', ChartType: '"
                    + gen.getSupportedChartType() + "', Class: " + gen.getClass().getSimpleName());
        }

        ReportDataGenerator generator = findDataGenerator(category, chartType);

        if (generator == null) {
            throw new IllegalArgumentException(
                    String.format("No generator found for category: %s, chartType: %s", category, chartType));
        }

        if (!generator.canHandle(parameters)) {
            throw new IllegalArgumentException("Invalid parameters for the selected report type");
        }

        return generator.generateReportData(parameters);
    }

    /**
     * Formats a report in the specified format
     * 
     * @param reportData The report data to format
     * @param format     The desired format (e.g., "PDF", "JSON", "EXCEL")
     * @return Formatted report as byte array
     */
    public byte[] formatReport(ReportData reportData, String format) {
        ReportFormatter formatter = findFormatter(format);

        if (formatter == null) {
            throw new IllegalArgumentException("No formatter found for format: " + format);
        }

        return formatter.formatReport(reportData);
    }

    /**
     * Gets the formatter for the specified format
     * 
     * @param format The desired format (e.g., "PDF", "JSON", "EXCEL")
     * @return ReportFormatter instance or null if not found
     */
    public ReportFormatter getFormatter(String format) {
        return findFormatter(format);
    }

    /**
     * Exports a formatted report using the specified export type
     * 
     * @param reportData    The report data
     * @param formattedData The formatted report
     * @param exportType    The export type (e.g., "FILE", "EMAIL", "CLOUD")
     * @return Export result
     */
    public ExportResult exportReport(ReportData reportData, byte[] formattedData, String exportType) {
        ReportExporter exporter = findExporter(exportType);

        if (exporter == null) {
            throw new IllegalArgumentException("No exporter found for export type: " + exportType);
        }

        if (!exporter.canExport(reportData)) {
            throw new IllegalArgumentException("Cannot export this report with the selected exporter");
        }

        return exporter.exportReport(reportData, formattedData);
    }

    /**
     * Complete report generation, formatting, and export in one method
     * 
     * @param category   Report category
     * @param chartType  Chart type
     * @param parameters Report parameters
     * @param format     Output format
     * @param exportType Export type
     * @return Export result
     */
    public ExportResult generateAndExportReport(
            String category,
            String chartType,
            ReportParameters parameters,
            String format,
            String exportType) {

        // Generate report data
        ReportData reportData = generateReport(category, chartType, parameters);

        // Format report
        byte[] formattedData = formatReport(reportData, format);

        // Export report
        return exportReport(reportData, formattedData, exportType);
    }

    /**
     * Get available report categories and chart types
     * 
     * @return Map of available generators
     */
    public List<String> getAvailableCategories() {
        return dataGenerators.stream()
                .map(ReportDataGenerator::getSupportedCategory)
                .distinct()
                .toList();
    }

    /**
     * Get available chart types for a category
     * 
     * @param category The report category
     * @return List of available chart types
     */
    public List<String> getAvailableChartTypes(String category) {
        return dataGenerators.stream()
                .filter(generator -> generator.getSupportedCategory().equals(category))
                .map(ReportDataGenerator::getSupportedChartType)
                .toList();
    }

    /**
     * Get available output formats
     * 
     * @return List of available formats
     */
    public List<String> getAvailableFormats() {
        return formatters.stream()
                .map(ReportFormatter::getSupportedFormat)
                .toList();
    }

    /**
     * Get available export types
     * 
     * @return List of available export types
     */
    public List<String> getAvailableExportTypes() {
        return exporters.stream()
                .map(ReportExporter::getSupportedExportType)
                .toList();
    }

    // Private helper methods following SRP
    private ReportDataGenerator findDataGenerator(String category, String chartType) {
        return dataGenerators.stream()
                .filter(generator -> generator.getSupportedCategory().equals(category) &&
                        generator.getSupportedChartType().equals(chartType))
                .findFirst()
                .orElse(null);
    }

    private ReportFormatter findFormatter(String format) {
        return formatters.stream()
                .filter(formatter -> formatter.getSupportedFormat().equalsIgnoreCase(format))
                .findFirst()
                .orElse(null);
    }

    private ReportExporter findExporter(String exportType) {
        return exporters.stream()
                .filter(exporter -> exporter.getSupportedExportType().equalsIgnoreCase(exportType))
                .findFirst()
                .orElse(null);
    }
}