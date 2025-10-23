package com.example.backend.service.report.formatter;

import com.example.backend.dto.report.ChartDataPoint;
import com.example.backend.dto.report.ReportData;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * PDF Report Formatter following ISP and LSP
 * Implements only the formatting interface it needs
 * Note: In a real implementation, you would use a PDF library like iText or
 * Apache PDFBox
 */
@Component
public class PdfReportFormatter implements ReportFormatter {

    @Override
    public byte[] formatReport(ReportData reportData) {
        try {
            // In a real implementation, this would use a PDF library
            // For demonstration, we'll create a simple text-based PDF content
            String pdfContent = generatePdfContent(reportData);
            return pdfContent.getBytes();
        } catch (Exception e) {
            throw new RuntimeException("Failed to format report as PDF", e);
        }
    }

    @Override
    public String getSupportedFormat() {
        return "PDF";
    }

    @Override
    public String getContentType() {
        return "application/pdf";
    }

    @Override
    public String getFileExtension() {
        return ".pdf";
    }

    private String generatePdfContent(ReportData reportData) {
        StringBuilder content = new StringBuilder();

        // Header
        content.append("WASTE COLLECTION REPORT\n");
        content.append("======================\n\n");

        // Report Information
        content.append("Report Title: ").append(reportData.getTitle()).append("\n");
        content.append("Category: ").append(reportData.getCategory()).append("\n");
        content.append("Chart Type: ").append(reportData.getChartType()).append("\n");
        content.append("Generated At: ").append(
                reportData.getGeneratedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("\n\n");

        // Description
        if (reportData.getDescription() != null) {
            content.append("Description: ").append(reportData.getDescription()).append("\n\n");
        }

        // Chart Data
        if (reportData.getChartData() != null && !reportData.getChartData().isEmpty()) {
            content.append("CHART DATA\n");
            content.append("----------\n");
            for (ChartDataPoint point : reportData.getChartData()) {
                content.append(String.format("%-20s: %8.1f kg",
                        point.getLabel(), point.getValue())).append("\n");
            }
            content.append("\n");
        }

        // Statistics
        if (reportData.getStatistics() != null && !reportData.getStatistics().isEmpty()) {
            content.append("STATISTICS\n");
            content.append("----------\n");
            for (Map.Entry<String, Object> stat : reportData.getStatistics().entrySet()) {
                content.append(String.format("%-20s: %s",
                        formatStatKey(stat.getKey()), stat.getValue())).append("\n");
            }
            content.append("\n");
        }

        // Metadata
        if (reportData.getMetadata() != null && !reportData.getMetadata().isEmpty()) {
            content.append("METADATA\n");
            content.append("--------\n");
            for (Map.Entry<String, Object> meta : reportData.getMetadata().entrySet()) {
                content.append(String.format("%-20s: %s",
                        formatStatKey(meta.getKey()), meta.getValue())).append("\n");
            }
        }

        return content.toString();
    }

    private String formatStatKey(String key) {
        // Convert camelCase to Title Case
        return key.replaceAll("([A-Z])", " $1")
                .trim()
                .substring(0, 1).toUpperCase() +
                key.replaceAll("([A-Z])", " $1")
                        .trim()
                        .substring(1);
    }
}