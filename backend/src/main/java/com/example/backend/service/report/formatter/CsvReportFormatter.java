package com.example.backend.service.report.formatter;

import com.example.backend.dto.report.ChartDataPoint;
import com.example.backend.dto.report.ReportData;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * CSV Report Formatter following ISP and LSP
 * Generates CSV format reports
 */
@Component
public class CsvReportFormatter implements ReportFormatter {

    @Override
    public byte[] formatReport(ReportData reportData) {
        try {
            String csvContent = generateCsvContent(reportData);
            return csvContent.getBytes("UTF-8");
        } catch (Exception e) {
            throw new RuntimeException("Failed to format report as CSV", e);
        }
    }

    @Override
    public String getSupportedFormat() {
        return "CSV";
    }

    @Override
    public String getContentType() {
        return "text/csv";
    }

    @Override
    public String getFileExtension() {
        return ".csv";
    }

    private String generateCsvContent(ReportData reportData) {
        StringBuilder csv = new StringBuilder();

        // Report header information
        csv.append("Report Information\n");
        csv.append("Title,").append(escapeCommas(reportData.getTitle())).append("\n");
        csv.append("Category,").append(escapeCommas(reportData.getCategory())).append("\n");
        csv.append("Chart Type,").append(escapeCommas(reportData.getChartType())).append("\n");
        csv.append("Generated At,")
                .append(reportData.getGeneratedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                .append("\n");

        if (reportData.getDescription() != null) {
            csv.append("Description,").append(escapeCommas(reportData.getDescription())).append("\n");
        }
        csv.append("\n");

        // Visual Chart Representation
        if (reportData.getChartData() != null && !reportData.getChartData().isEmpty()) {
            csv.append(generateCsvChart(reportData));
        }

        // Chart Data
        if (reportData.getChartData() != null && !reportData.getChartData().isEmpty()) {
            csv.append("Chart Data\n");
            csv.append("Label,Value (kg),Percentage,Color,Visual Bar\n");

            double total = reportData.getChartData().stream()
                    .mapToDouble(ChartDataPoint::getValue)
                    .sum();

            for (ChartDataPoint point : reportData.getChartData()) {
                double percentage = (point.getValue() / total) * 100;
                String visualBar = generateCsvProgressBar(percentage, 15);
                csv.append(escapeCommas(point.getLabel())).append(",")
                        .append(String.format("%.1f", point.getValue())).append(",")
                        .append(String.format("%.1f%%", percentage)).append(",")
                        .append(escapeCommas(point.getColor() != null ? point.getColor() : "")).append(",")
                        .append(escapeCommas(visualBar)).append("\n");
            }
            csv.append("\n");
        }

        // Statistics
        if (reportData.getStatistics() != null && !reportData.getStatistics().isEmpty()) {
            csv.append("Statistics\n");
            csv.append("Statistic,Value\n");
            for (Map.Entry<String, Object> stat : reportData.getStatistics().entrySet()) {
                csv.append(escapeCommas(formatStatKey(stat.getKey()))).append(",")
                        .append(escapeCommas(stat.getValue().toString())).append("\n");
            }
            csv.append("\n");
        }

        // Metadata
        if (reportData.getMetadata() != null && !reportData.getMetadata().isEmpty()) {
            csv.append("Metadata\n");
            csv.append("Property,Value\n");
            for (Map.Entry<String, Object> meta : reportData.getMetadata().entrySet()) {
                csv.append(escapeCommas(formatStatKey(meta.getKey()))).append(",")
                        .append(escapeCommas(meta.getValue().toString())).append("\n");
            }
        }

        return csv.toString();
    }

    private String escapeCommas(String value) {
        if (value == null)
            return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private String generateCsvChart(ReportData reportData) {
        StringBuilder chart = new StringBuilder();

        chart.append("Visual Chart Representation\n");
        chart.append("===========================\n\n");

        if ("pie".equalsIgnoreCase(reportData.getChartType())) {
            chart.append(generateCsvPieChart(reportData));
        } else {
            chart.append(generateCsvBarChart(reportData));
        }

        chart.append("\n");
        return chart.toString();
    }

    private String generateCsvPieChart(ReportData reportData) {
        StringBuilder pie = new StringBuilder();

        double total = reportData.getChartData().stream()
                .mapToDouble(ChartDataPoint::getValue)
                .sum();

        pie.append("Pie Chart Distribution\n");
        pie.append("Category,Value,Percentage,Visual Distribution\n");

        for (ChartDataPoint point : reportData.getChartData()) {
            double percentage = (point.getValue() / total) * 100;
            String visual = generateCsvProgressBar(percentage, 20);
            pie.append(String.format("%s,%.1f kg,%.1f%%,%s\n",
                    escapeCommas(point.getLabel()), point.getValue(), percentage, escapeCommas(visual)));
        }

        return pie.toString();
    }

    private String generateCsvBarChart(ReportData reportData) {
        StringBuilder bar = new StringBuilder();

        double maxValue = reportData.getChartData().stream()
                .mapToDouble(ChartDataPoint::getValue)
                .max()
                .orElse(1.0);

        bar.append("Bar Chart Analysis\n");
        bar.append("Category,Value,Relative Size,Visual Bar\n");

        for (ChartDataPoint point : reportData.getChartData()) {
            double percentage = (point.getValue() / maxValue) * 100;
            String visual = generateCsvProgressBar(percentage, 25);
            bar.append(String.format("%s,%.1f kg,%.0f%%,%s\n",
                    escapeCommas(point.getLabel()), point.getValue(), percentage, escapeCommas(visual)));
        }

        return bar.toString();
    }

    private String generateCsvProgressBar(double percentage, int length) {
        int filledLength = (int) ((percentage / 100.0) * length);
        return "█".repeat(Math.max(0, filledLength)) + "░".repeat(Math.max(0, length - filledLength));
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