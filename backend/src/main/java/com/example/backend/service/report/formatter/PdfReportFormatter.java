package com.example.backend.service.report.formatter;

import com.example.backend.dto.report.ReportData;
import com.example.backend.dto.report.ChartDataPoint;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

/**
 * PDF Report Formatter
 * Generates HTML content that browsers can display or convert to PDF
 */
@Component
public class PdfReportFormatter implements ReportFormatter {

    @Override
    public byte[] formatReport(ReportData reportData) {
        try {
            StringBuilder html = new StringBuilder();

            // Simple HTML structure
            html.append("<!DOCTYPE html>\n")
                    .append("<html>\n")
                    .append("<head>\n")
                    .append("<meta charset='UTF-8'>\n")
                    .append("<title>Waste Collection Report</title>\n")
                    .append("<style>\n")
                    .append("body { font-family: Arial, sans-serif; margin: 20px; }\n")
                    .append("h1 { color: #2e7d32; border-bottom: 2px solid #4caf50; }\n")
                    .append("h2 { color: #388e3c; margin-top: 30px; }\n")
                    .append(".data-table { border-collapse: collapse; width: 100%; margin: 20px 0; }\n")
                    .append(".data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }\n")
                    .append(".data-table th { background-color: #4caf50; color: white; }\n")
                    .append(".progress-bar { display: inline-block; width: 200px; height: 20px; background: #f0f0f0; border: 1px solid #ccc; }\n")
                    .append(".progress-fill { height: 100%; background: #4caf50; }\n")
                    .append(".info { background: #e8f5e8; padding: 10px; margin: 10px 0; border-left: 4px solid #4caf50; }\n")
                    .append("</style>\n")
                    .append("</head>\n")
                    .append("<body>\n");

            // Header
            html.append("<h1>Waste Collection Report</h1>\n");

            // Report Info
            html.append("<div class='info'>\n");
            if (reportData.getTitle() != null) {
                html.append("<strong>Report:</strong> ").append(escapeHtml(reportData.getTitle())).append("<br>\n");
            }
            if (reportData.getDescription() != null) {
                html.append("<strong>Description:</strong> ").append(escapeHtml(reportData.getDescription()))
                        .append("<br>\n");
            }
            html.append("<strong>Generated on:</strong> ")
                    .append(java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                    .append("\n");
            html.append("</div>\n");

            // Data Section
            if (reportData.getChartData() != null && !reportData.getChartData().isEmpty()) {
                html.append("<h2>Data Summary</h2>\n");
                html.append("<table class='data-table'>\n");
                html.append("<tr><th>Category</th><th>Quantity</th><th>Visual</th></tr>\n");

                // Find max value for scaling
                double maxValue = reportData.getChartData().stream()
                        .mapToDouble(ChartDataPoint::getValue)
                        .max()
                        .orElse(1.0);

                for (ChartDataPoint dataPoint : reportData.getChartData()) {
                    double percentage = (dataPoint.getValue() / maxValue) * 100;
                    html.append("<tr>\n")
                            .append("<td>").append(escapeHtml(dataPoint.getLabel())).append("</td>\n")
                            .append("<td>").append(dataPoint.getValue().intValue()).append(" units</td>\n")
                            .append("<td><div class='progress-bar'><div class='progress-fill' style='width: ")
                            .append(String.format("%.1f", percentage)).append("%'></div></div></td>\n")
                            .append("</tr>\n");
                }
                html.append("</table>\n");
            } else {
                html.append("<h2>No Data Available</h2>\n");
                html.append("<p>No data is available for this report at the moment.</p>\n");
            }

            html.append("<p style='margin-top: 40px; color: #666; font-size: 0.9em;'>End of report</p>\n");
            html.append("</body>\n</html>");

            return html.toString().getBytes("UTF-8");

        } catch (Exception e) {
            // Simple HTML fallback
            String fallbackHtml = "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Report Error</title></head>"
                    +
                    "<body><h1>Waste Collection Report</h1><p>Error generating report content.</p>" +
                    "<p>Generated on: " + java.time.LocalDateTime.now() + "</p></body></html>";
            try {
                return fallbackHtml.getBytes("UTF-8");
            } catch (Exception ex) {
                return fallbackHtml.getBytes();
            }
        }
    }

    private String escapeHtml(String input) {
        if (input == null)
            return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;");
    }

    @Override
    public String getSupportedFormat() {
        return "PDF";
    }

    @Override
    public String getContentType() {
        return "application/octet-stream";
    }

    @Override
    public String getFileExtension() {
        return ".html";
    }

}