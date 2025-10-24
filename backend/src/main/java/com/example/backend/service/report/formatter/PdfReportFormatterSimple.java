package com.example.backend.service.report.formatter;

import com.example.backend.dto.report.ReportData;
import com.example.backend.dto.report.ChartDataPoint;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * PDF Report Formatter - Clean Simple Version
 * Generates simple text-based content for PDF downloads
 */
@Component
public class PdfReportFormatterSimple implements ReportFormatter {

    @Override
    public byte[] formatReport(ReportData reportData) {
        try {
            String textContent = generateSimpleTextContent(reportData);
            return textContent.getBytes("UTF-8");
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

    private String generateSimpleTextContent(ReportData reportData) {
        StringBuilder content = new StringBuilder();

        // Header
        content.append("WASTE COLLECTION REPORT\n");
        content.append("=======================\n\n");

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

        // Generate ASCII Chart
        content.append(generateAsciiChart(reportData));

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

    private String generateAsciiChart(ReportData reportData) {
        StringBuilder chart = new StringBuilder();

        if (reportData.getChartData() == null || reportData.getChartData().isEmpty()) {
            return "No chart data available\n\n";
        }

        chart.append("VISUAL CHART\n");
        chart.append("============\n\n");

        if ("pie".equalsIgnoreCase(reportData.getChartType())) {
            chart.append(generatePieChart(reportData.getChartData()));
        } else {
            chart.append(generateBarChart(reportData.getChartData()));
        }

        return chart.toString();
    }

    private String generatePieChart(List<ChartDataPoint> data) {
        StringBuilder chart = new StringBuilder();
        double total = data.stream().mapToDouble(ChartDataPoint::getValue).sum();

        chart.append("Pie Chart Distribution:\n");
        for (ChartDataPoint point : data) {
            double percentage = (point.getValue() / total) * 100;
            int bars = (int) (percentage / 5); // Each bar represents 5%
            String bar = "█".repeat(Math.max(0, bars)) + "░".repeat(Math.max(0, 20 - bars));
            chart.append(String.format("%-15s |%s| %5.1f%% (%6.1f kg)\n",
                    point.getLabel(), bar, percentage, point.getValue()));
        }
        chart.append("\n");
        return chart.toString();
    }

    private String generateBarChart(List<ChartDataPoint> data) {
        StringBuilder chart = new StringBuilder();
        double maxValue = data.stream().mapToDouble(ChartDataPoint::getValue).max().orElse(1.0);

        chart.append("Bar Chart:\n");
        for (ChartDataPoint point : data) {
            int bars = (int) ((point.getValue() / maxValue) * 30); // Scale to 30 characters
            String bar = "█".repeat(Math.max(0, bars));
            chart.append(String.format("%-15s |%-30s| %6.1f kg\n",
                    point.getLabel(), bar, point.getValue()));
        }
        chart.append("\n");
        return chart.toString();
    }

    private String formatStatKey(String key) {
        return key.replace("_", " ").toUpperCase();
    }
}