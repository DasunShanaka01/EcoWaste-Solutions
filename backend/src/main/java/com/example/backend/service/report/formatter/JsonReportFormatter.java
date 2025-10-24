package com.example.backend.service.report.formatter;

import com.example.backend.dto.report.ReportData;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

/**
 * JSON Report Formatter following ISP and LSP
 * Implements only the formatting interface it needs
 */
@Component
public class JsonReportFormatter implements ReportFormatter {

    private final ObjectMapper objectMapper;

    public JsonReportFormatter() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    @Override
    public byte[] formatReport(ReportData reportData) {
        try {
            String jsonContent = objectMapper.writeValueAsString(reportData);
            return jsonContent.getBytes();
        } catch (Exception e) {
            throw new RuntimeException("Failed to format report as JSON", e);
        }
    }

    @Override
    public String getSupportedFormat() {
        return "JSON";
    }

    @Override
    public String getContentType() {
        return "application/json";
    }

    @Override
    public String getFileExtension() {
        return ".json";
    }
}