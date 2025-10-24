package com.example.backend.Admin;

import com.fasterxml.jackson.annotation.JsonFormat;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "waste_collection_reports")
public class WasteCollectionReport {

    @Id
    private String id;

    @Field("template_type")
    private String templateType; // "Monthly Collection", "Collection by Region"

    @Field("report_title")
    private String reportTitle;

    @Field("parameters")
    private Map<String, Object> parameters;

    @Field("data")
    private Object data; // Report data structure

    @Field("format")
    private String format; // PDF, CSV, Excel

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Field("generated_at")
    private LocalDateTime generatedAt;

    @Field("generated_by")
    private String generatedBy;

    @Field("status")
    private String status = "Generated";

    // Constructors
    public WasteCollectionReport() {
        this.generatedAt = LocalDateTime.now();
    }

    public WasteCollectionReport(String templateType, String reportTitle, Map<String, Object> parameters, Object data,
            String format, String generatedBy) {
        this();
        this.templateType = templateType;
        this.reportTitle = reportTitle;
        this.parameters = parameters;
        this.data = data;
        this.format = format;
        this.generatedBy = generatedBy;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTemplateType() {
        return templateType;
    }

    public void setTemplateType(String templateType) {
        this.templateType = templateType;
    }

    public String getReportTitle() {
        return reportTitle;
    }

    public void setReportTitle(String reportTitle) {
        this.reportTitle = reportTitle;
    }

    public Map<String, Object> getParameters() {
        return parameters;
    }

    public void setParameters(Map<String, Object> parameters) {
        this.parameters = parameters;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    public String getGeneratedBy() {
        return generatedBy;
    }

    public void setGeneratedBy(String generatedBy) {
        this.generatedBy = generatedBy;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}