package com.example.backend.service.report.formatter;

import com.example.backend.dto.report.ChartDataPoint;
import com.example.backend.dto.report.ReportData;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Excel Report Formatter following ISP and LSP
 * Generates Excel format reports
 * Note: This is a simplified implementation that generates tab-separated values
 * For full Excel support, you would need Apache POI library
 */
@Component
public class ExcelReportFormatter implements ReportFormatter {

    @Override
    public byte[] formatReport(ReportData reportData) {
        try {
            String excelContent = generateExcelContent(reportData);
            return excelContent.getBytes("UTF-8");
        } catch (Exception e) {
            throw new RuntimeException("Failed to format report as Excel", e);
        }
    }

    @Override
    public String getSupportedFormat() {
        return "EXCEL";
    }

    @Override
    public String getContentType() {
        return "application/vnd.ms-excel";
    }

    @Override
    public String getFileExtension() {
        return ".xls";
    }

    private String generateExcelContent(ReportData reportData) {
        StringBuilder excel = new StringBuilder();

        // Report header information
        excel.append("Report Information\t\t\n");
        excel.append("Title\t").append(reportData.getTitle()).append("\n");
        excel.append("Category\t").append(reportData.getCategory()).append("\n");
        excel.append("Chart Type\t").append(reportData.getChartType()).append("\n");
        excel.append("Generated At\t")
                .append(reportData.getGeneratedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                .append("\n");

        if (reportData.getDescription() != null) {
            excel.append("Description\t").append(reportData.getDescription()).append("\n");
        }
        excel.append("\n");

        // Visual Chart Representation
        if (reportData.getChartData() != null && !reportData.getChartData().isEmpty()) {
            excel.append(generateExcelChart(reportData));
        }

        // Chart Data
        if (reportData.getChartData() != null && !reportData.getChartData().isEmpty()) {
            excel.append("Chart Data\t\t\n");
            excel.append("Label\tValue (kg)\tPercentage\tColor\n");

            double total = reportData.getChartData().stream()
                    .mapToDouble(ChartDataPoint::getValue)
                    .sum();

            for (ChartDataPoint point : reportData.getChartData()) {
                double percentage = (point.getValue() / total) * 100;
                excel.append(point.getLabel()).append("\t")
                        .append(String.format("%.1f", point.getValue())).append("\t")
                        .append(String.format("%.1f%%", percentage)).append("\t")
                        .append(point.getColor() != null ? point.getColor() : "").append("\n");
            }
            excel.append("\n");
        }

        // Statistics
        if (reportData.getStatistics() != null && !reportData.getStatistics().isEmpty()) {
            excel.append("Statistics\t\n");
            excel.append("Statistic\tValue\n");
            for (Map.Entry<String, Object> stat : reportData.getStatistics().entrySet()) {
                excel.append(formatStatKey(stat.getKey())).append("\t")
                        .append(stat.getValue().toString()).append("\n");
            }
            excel.append("\n");
        }

        // Metadata
        if (reportData.getMetadata() != null && !reportData.getMetadata().isEmpty()) {
            excel.append("Metadata\t\n");
            excel.append("Property\tValue\n");
            for (Map.Entry<String, Object> meta : reportData.getMetadata().entrySet()) {
                excel.append(formatStatKey(meta.getKey())).append("\t")
                        .append(meta.getValue().toString()).append("\n");
            }
        }

        return excel.toString();
    }

    private String generateExcelChart(ReportData reportData) {
        StringBuilder chart = new StringBuilder();

        chart.append("Visual Chart Representation\t\t\n");
        chart.append("===========================\t\t\n\n");

        if ("pie".equalsIgnoreCase(reportData.getChartType())) {
            chart.append(generateExcelPieChart(reportData));
        } else {
            chart.append(generateExcelBarChart(reportData));
        }

        chart.append("\n");
        return chart.toString();
    }

    private String generateExcelPieChart(ReportData reportData) {
        StringBuilder pie = new StringBuilder();

        double total = reportData.getChartData().stream()
                .mapToDouble(ChartDataPoint::getValue)
                .sum();

        pie.append("Pie Chart Distribution:\t\t\n");
        pie.append("Category\tValue\tPercentage\tVisual\n");

        for (ChartDataPoint point : reportData.getChartData()) {
            double percentage = (point.getValue() / total) * 100;
            String visual = generateExcelProgressBar(percentage, 20);
            pie.append(String.format("%s\t%.1f kg\t%.1f%%\t%s\n",
                    point.getLabel(), point.getValue(), percentage, visual));
        }

        return pie.toString();
    }

    private String generateExcelBarChart(ReportData reportData) {
        StringBuilder bar = new StringBuilder();

        double maxValue = reportData.getChartData().stream()
                .mapToDouble(ChartDataPoint::getValue)
                .max()
                .orElse(1.0);

        bar.append("Bar Chart Analysis:\t\t\n");
        bar.append("Category\tValue\tRelative Size\tVisual Bar\n");

        for (ChartDataPoint point : reportData.getChartData()) {
            double percentage = (point.getValue() / maxValue) * 100;
            String visual = generateExcelProgressBar(percentage, 25);
            bar.append(String.format("%s\t%.1f kg\t%.0f%%\t%s\n",
                    point.getLabel(), point.getValue(), percentage, visual));
        }

        return bar.toString();
    }

    private String generateExcelProgressBar(double percentage, int length) {
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