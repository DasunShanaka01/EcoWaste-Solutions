package com.example.backend.service.report.formatter;

import com.example.backend.dto.report.ReportData;
import com.example.backend.dto.report.ChartDataPoint;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

/**
 * Plain Text Report Formatter
 * Generates simple text-based reports that can be opened in any text editor
 */
@Component
public class TxtReportFormatter implements ReportFormatter {

    @Override
    public byte[] formatReport(ReportData reportData) {
        try {
            StringBuilder content = new StringBuilder();

            // Header
            content.append("WASTE COLLECTION REPORT\r\n");
            content.append("======================\r\n\r\n");

            // Report Info
            if (reportData.getTitle() != null) {
                content.append("Report Title: ").append(reportData.getTitle()).append("\r\n");
            }
            if (reportData.getDescription() != null) {
                content.append("Description: ").append(reportData.getDescription()).append("\r\n");
            }
            content.append("Generated on: ")
                    .append(java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                    .append("\r\n\r\n");

            // Data Section
            if (reportData.getChartData() != null && !reportData.getChartData().isEmpty()) {
                content.append("DATA SUMMARY\r\n");
                content.append("============\r\n\r\n");

                for (ChartDataPoint dataPoint : reportData.getChartData()) {
                    content.append(String.format("%-20s: %d units\r\n",
                            dataPoint.getLabel(),
                            dataPoint.getValue().intValue()));
                }
                content.append("\r\n");

                // Simple ASCII progress bars
                content.append("VISUAL REPRESENTATION\r\n");
                content.append("====================\r\n\r\n");

                // Find max value for scaling
                double maxValue = reportData.getChartData().stream()
                        .mapToDouble(ChartDataPoint::getValue)
                        .max()
                        .orElse(1.0);

                for (ChartDataPoint dataPoint : reportData.getChartData()) {
                    int barLength = (int) ((dataPoint.getValue() / maxValue) * 20);
                    String bar = "█".repeat(Math.max(0, barLength)) +
                            "░".repeat(Math.max(0, 20 - barLength));
                    content.append(String.format("%-15s |%s| %d\r\n",
                            dataPoint.getLabel(), bar, dataPoint.getValue().intValue()));
                }
            } else {
                content.append("No data available for this report.\r\n");
            }

            content.append("\r\n");
            content.append("End of report.\r\n");

            return content.toString().getBytes("UTF-8");
        } catch (Exception e) {
            // Simple fallback
            String fallback = "WASTE COLLECTION REPORT\r\n" +
                    "======================\r\n\r\n" +
                    "Error generating detailed report.\r\n" +
                    "Report generated on: " + java.time.LocalDateTime.now() + "\r\n";
            return fallback.getBytes();
        }
    }

    @Override
    public String getSupportedFormat() {
        return "TXT";
    }

    @Override
    public String getContentType() {
        return "text/plain";
    }

    @Override
    public String getFileExtension() {
        return ".txt";
    }
}