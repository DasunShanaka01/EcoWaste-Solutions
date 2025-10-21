package com.example.backend.controller;

import com.example.backend.Admin.WasteCollectionReport;
import com.example.backend.service.WasteCollectionReportService;
import com.example.backend.service.ReportExportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/waste-collection-reports")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class WasteCollectionReportController {

    @Autowired
    private WasteCollectionReportService reportService;

    @Autowired
    private ReportExportService exportService;

    // Generate Monthly Collection Report
    @PostMapping("/generate/monthly-collection")
    public ResponseEntity<WasteCollectionReport> generateMonthlyCollectionReport(
            @RequestBody Map<String, Object> requestBody) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> parameters = (Map<String, Object>) requestBody.get("parameters");
            String format = (String) requestBody.get("format");
            String generatedBy = (String) requestBody.get("generatedBy");

            WasteCollectionReport report = reportService.generateMonthlyCollectionReport(parameters, format,
                    generatedBy);
            return ResponseEntity.status(HttpStatus.CREATED).body(report);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Generate Collection by Region Report
    @PostMapping("/generate/collection-by-region")
    public ResponseEntity<WasteCollectionReport> generateCollectionByRegionReport(
            @RequestBody Map<String, Object> requestBody) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> parameters = (Map<String, Object>) requestBody.get("parameters");
            String format = (String) requestBody.get("format");
            String generatedBy = (String) requestBody.get("generatedBy");

            WasteCollectionReport report = reportService.generateCollectionByRegionReport(parameters, format,
                    generatedBy);
            return ResponseEntity.status(HttpStatus.CREATED).body(report);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get all reports
    @GetMapping
    public ResponseEntity<List<WasteCollectionReport>> getAllReports() {
        try {
            List<WasteCollectionReport> reports = reportService.getAllReports();
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get report by ID
    @GetMapping("/{id}")
    public ResponseEntity<WasteCollectionReport> getReportById(@PathVariable String id) {
        try {
            Optional<WasteCollectionReport> report = reportService.getReportById(id);
            return report.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get reports by template type
    @GetMapping("/template/{templateType}")
    public ResponseEntity<List<WasteCollectionReport>> getReportsByTemplateType(@PathVariable String templateType) {
        try {
            List<WasteCollectionReport> reports = reportService.getReportsByTemplateType(templateType);
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Delete report
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable String id) {
        try {
            reportService.deleteReport(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get available templates
    @GetMapping("/templates")
    public ResponseEntity<Map<String, Object>> getAvailableTemplates() {
        try {
            Map<String, Object> templates = Map.of(
                    "Waste Collection Analytics", Map.of(
                            "icon", "📊",
                            "templates", List.of(
                                    Map.of(
                                            "name", "Monthly Collection",
                                            "description", "Monthly waste collection analytics",
                                            "icon", "📈",
                                            "endpoint", "/api/waste-collection-reports/generate/monthly-collection"),
                                    Map.of(
                                            "name", "Collection by Region",
                                            "description", "Collection metrics by region",
                                            "icon", "🏭",
                                            "endpoint",
                                            "/api/waste-collection-reports/generate/collection-by-region"))));
            return ResponseEntity.ok(templates);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Preview report data without saving
    @PostMapping("/preview/monthly-collection")
    public ResponseEntity<Map<String, Object>> previewMonthlyCollectionReport(
            @RequestBody Map<String, Object> parameters) {
        try {
            // Generate report data without saving
            WasteCollectionReport tempReport = reportService.generateMonthlyCollectionReport(parameters, "preview",
                    "preview");

            Map<String, Object> preview = Map.of(
                    "title", tempReport.getReportTitle(),
                    "data", tempReport.getData(),
                    "parameters", tempReport.getParameters(),
                    "generatedAt", tempReport.getGeneratedAt().toString());

            // Don't save preview report, just return data
            reportService.deleteReport(tempReport.getId());

            return ResponseEntity.ok(preview);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Preview report data without saving
    @PostMapping("/preview/collection-by-region")
    public ResponseEntity<Map<String, Object>> previewCollectionByRegionReport(
            @RequestBody Map<String, Object> parameters) {
        try {
            // Generate report data without saving
            WasteCollectionReport tempReport = reportService.generateCollectionByRegionReport(parameters, "preview",
                    "preview");

            Map<String, Object> preview = Map.of(
                    "title", tempReport.getReportTitle(),
                    "data", tempReport.getData(),
                    "parameters", tempReport.getParameters(),
                    "generatedAt", tempReport.getGeneratedAt().toString());

            // Don't save preview report, just return data
            reportService.deleteReport(tempReport.getId());

            return ResponseEntity.ok(preview);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Download report in specified format
    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> downloadReport(@PathVariable String id,
            @RequestParam(defaultValue = "PDF") String format) {
        try {
            Optional<WasteCollectionReport> reportOpt = reportService.getReportById(id);
            if (!reportOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            WasteCollectionReport report = reportOpt.get();
            byte[] fileContent;
            String filename;
            String contentType;

            switch (format.toUpperCase()) {
                case "CSV":
                    fileContent = exportService.generateCsvReport(report);
                    filename = "report_" + id + ".csv";
                    contentType = "text/csv";
                    break;
                case "EXCEL":
                    fileContent = exportService.generateExcelReport(report);
                    filename = "report_" + id + ".xlsx";
                    contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    break;
                case "PDF":
                default:
                    fileContent = exportService.generatePdfReport(report);
                    filename = "report_" + id + ".pdf";
                    contentType = "application/pdf";
                    break;
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(fileContent.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(fileContent);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Generate and immediately download report
    @PostMapping("/generate-and-download/monthly-collection")
    public ResponseEntity<byte[]> generateAndDownloadMonthlyReport(
            @RequestBody Map<String, Object> requestBody,
            @RequestParam(defaultValue = "PDF") String format) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> parameters = (Map<String, Object>) requestBody.get("parameters");
            String generatedBy = (String) requestBody.get("generatedBy");

            WasteCollectionReport report = reportService.generateMonthlyCollectionReport(parameters, format,
                    generatedBy);

            byte[] fileContent;
            String filename;
            String contentType;

            switch (format.toUpperCase()) {
                case "CSV":
                    fileContent = exportService.generateCsvReport(report);
                    filename = "monthly_collection_report.csv";
                    contentType = "text/csv";
                    break;
                case "EXCEL":
                    fileContent = exportService.generateExcelReport(report);
                    filename = "monthly_collection_report.xlsx";
                    contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    break;
                case "PDF":
                default:
                    fileContent = exportService.generatePdfReport(report);
                    filename = "monthly_collection_report.pdf";
                    contentType = "application/pdf";
                    break;
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(fileContent.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(fileContent);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Generate and immediately download region report
    @PostMapping("/generate-and-download/collection-by-region")
    public ResponseEntity<byte[]> generateAndDownloadRegionReport(
            @RequestBody Map<String, Object> requestBody,
            @RequestParam(defaultValue = "PDF") String format) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> parameters = (Map<String, Object>) requestBody.get("parameters");
            String generatedBy = (String) requestBody.get("generatedBy");

            WasteCollectionReport report = reportService.generateCollectionByRegionReport(parameters, format,
                    generatedBy);

            byte[] fileContent;
            String filename;
            String contentType;

            switch (format.toUpperCase()) {
                case "CSV":
                    fileContent = exportService.generateCsvReport(report);
                    filename = "collection_by_region_report.csv";
                    contentType = "text/csv";
                    break;
                case "EXCEL":
                    fileContent = exportService.generateExcelReport(report);
                    filename = "collection_by_region_report.xlsx";
                    contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    break;
                case "PDF":
                default:
                    fileContent = exportService.generatePdfReport(report);
                    filename = "collection_by_region_report.pdf";
                    contentType = "application/pdf";
                    break;
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(fileContent.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(fileContent);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}