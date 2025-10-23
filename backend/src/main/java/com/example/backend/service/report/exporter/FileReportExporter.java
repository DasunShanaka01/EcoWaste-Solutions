package com.example.backend.service.report.exporter;

import com.example.backend.dto.report.ReportData;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;

/**
 * File Report Exporter following ISP and LSP
 * Exports reports to the local file system
 */
@Component
public class FileReportExporter implements ReportExporter {

    private static final String EXPORT_DIRECTORY = "reports/";

    @Override
    public ExportResult exportReport(ReportData reportData, byte[] formattedData) {
        try {
            // Create export directory if it doesn't exist
            Path exportDir = Paths.get(EXPORT_DIRECTORY);
            if (!Files.exists(exportDir)) {
                Files.createDirectories(exportDir);
            }

            // Generate filename
            String filename = generateFilename(reportData);
            Path filePath = exportDir.resolve(filename);

            // Write file
            Files.write(filePath, formattedData, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

            // Return success result
            ExportResult result = new ExportResult(true, "Report exported successfully");
            result.setExportPath(filePath.toString());
            result.setExportId(reportData.getReportId());
            result.setFileSize(formattedData.length);

            return result;

        } catch (IOException e) {
            return new ExportResult(false, "Failed to export report: " + e.getMessage());
        }
    }

    @Override
    public String getSupportedExportType() {
        return "FILE";
    }

    @Override
    public boolean canExport(ReportData reportData) {
        return reportData != null && reportData.getReportId() != null;
    }

    private String generateFilename(ReportData reportData) {
        String sanitizedTitle = reportData.getTitle()
                .replaceAll("[^a-zA-Z0-9.-]", "_")
                .replaceAll("_{2,}", "_");

        return String.format("%s_%s_%s.%s",
                sanitizedTitle,
                reportData.getChartType(),
                reportData.getReportId().substring(0, 8),
                getFileExtension(reportData));
    }

    private String getFileExtension(ReportData reportData) {
        // This could be enhanced to determine extension based on format metadata
        return "txt"; // Default extension
    }
}