package com.example.backend.service.report.exporter;

/**
 * Export Result DTO following SRP
 * This class is responsible only for holding export operation results
 */
public class ExportResult {
    private boolean success;
    private String message;
    private String exportPath;
    private String exportId;
    private long fileSize;

    // Constructors
    public ExportResult() {
    }

    public ExportResult(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public ExportResult(boolean success, String message, String exportPath) {
        this.success = success;
        this.message = message;
        this.exportPath = exportPath;
    }

    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getExportPath() {
        return exportPath;
    }

    public void setExportPath(String exportPath) {
        this.exportPath = exportPath;
    }

    public String getExportId() {
        return exportId;
    }

    public void setExportId(String exportId) {
        this.exportId = exportId;
    }

    public long getFileSize() {
        return fileSize;
    }

    public void setFileSize(long fileSize) {
        this.fileSize = fileSize;
    }
}