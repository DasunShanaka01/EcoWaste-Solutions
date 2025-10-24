package com.example.backend.service.report;

import com.example.backend.dto.report.ReportParameters;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

/**
 * Demo Service showing how SOLID principles make the system extensible and
 * testable
 * This service demonstrates how easy it is to use the report generation system
 */
@Service
public class ReportDemoService {

    private final ReportGenerationService reportGenerationService;

    @Autowired
    public ReportDemoService(ReportGenerationService reportGenerationService) {
        this.reportGenerationService = reportGenerationService;
    }

    /**
     * Demonstrates generating different types of waste collection reports
     */
    public void demonstrateReportGeneration() {
        // Create sample parameters
        ReportParameters parameters = new ReportParameters();
        parameters.setStartDate(LocalDate.now().minusDays(30));
        parameters.setEndDate(LocalDate.now());
        parameters.setFormat("PDF");
        parameters.setIncludeSampleData(true);
        parameters.setRegion("Downtown");

        try {
            // Generate Bar Chart Report - easily extensible
            var barChartReport = reportGenerationService.generateReport(
                    "Waste Collection Analytics", "bar", parameters);
            System.out.println("Generated Bar Chart: " + barChartReport.getTitle());

            // Generate Pie Chart Report - same interface, different implementation
            var pieChartReport = reportGenerationService.generateReport(
                    "Waste Collection Analytics", "pie", parameters);
            System.out.println("Generated Pie Chart: " + pieChartReport.getTitle());

            // Generate Donut Chart Report - another implementation
            var donutChartReport = reportGenerationService.generateReport(
                    "Waste Collection Analytics", "donut", parameters);
            System.out.println("Generated Donut Chart: " + donutChartReport.getTitle());

            // Format reports in different formats - Open/Closed Principle in action
            byte[] pdfData = reportGenerationService.formatReport(barChartReport, "PDF");
            byte[] jsonData = reportGenerationService.formatReport(barChartReport, "JSON");

            System.out.println("PDF Report Size: " + pdfData.length + " bytes");
            System.out.println("JSON Report Size: " + jsonData.length + " bytes");

            // Export report - Dependency Inversion Principle
            var exportResult = reportGenerationService.exportReport(
                    barChartReport, pdfData, "FILE");
            System.out.println("Export Result: " + exportResult.getMessage());

        } catch (Exception e) {
            System.err.println("Error generating reports: " + e.getMessage());
        }
    }

    /**
     * Shows how easy it is to get available options - Interface Segregation
     */
    public void showAvailableOptions() {
        System.out.println("\n=== Available Report Options ===");
        System.out.println("Categories: " + reportGenerationService.getAvailableCategories());
        System.out.println("Chart Types for Waste Collection: " +
                reportGenerationService.getAvailableChartTypes("Waste Collection Analytics"));
        System.out.println("Available Formats: " + reportGenerationService.getAvailableFormats());
        System.out.println("Available Export Types: " + reportGenerationService.getAvailableExportTypes());
    }
}