package com.example.backend.controller;

import com.example.backend.dto.report.ReportData;
import com.example.backend.dto.report.ReportParameters;
import com.example.backend.service.report.ReportGenerationService;
import com.example.backend.service.report.exporter.ExportResult;
import com.example.backend.service.EmailService;
import com.example.backend.repository.SpecialCollectionRepository;
import com.example.backend.model.SpecialCollection;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * SOLID Principles-based Report Controller
 * This controller follows SRP by handling only HTTP concerns
 * and delegates business logic to the ReportGenerationService
 */
@RestController
@RequestMapping("/api/reports/solid")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class SolidReportController {

    private final ReportGenerationService reportGenerationService;
    private final EmailService emailService;
    private final SpecialCollectionRepository specialCollectionRepository;

    @Autowired
    public SolidReportController(ReportGenerationService reportGenerationService,
            EmailService emailService,
            SpecialCollectionRepository specialCollectionRepository) {
        this.reportGenerationService = reportGenerationService;
        this.emailService = emailService;
        this.specialCollectionRepository = specialCollectionRepository;
    }

    /**
     * Generate report data only (no formatting)
     */
    @PostMapping("/generate/{category}/{chartType}")
    public ResponseEntity<ReportData> generateReport(
            @PathVariable String category,
            @PathVariable String chartType,
            @RequestBody ReportParameters parameters) {
        try {
            ReportData reportData = reportGenerationService.generateReport(category, chartType, parameters);
            return ResponseEntity.ok(reportData);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Generate and format report for download
     */
    @PostMapping("/download/{category}/{chartType}/{format}")
    public ResponseEntity<byte[]> downloadReport(
            @PathVariable String category,
            @PathVariable String chartType,
            @PathVariable String format,
            @RequestBody ReportParameters parameters) {
        try {
            // Generate report data
            ReportData reportData = reportGenerationService.generateReport(category, chartType, parameters);

            // Format report
            byte[] formattedData = reportGenerationService.formatReport(reportData, format);

            // Prepare response headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(getMediaType(format));
            headers.setContentDispositionFormData("attachment",
                    generateFilename(reportData, format));

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(formattedData);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Generate, format, and export report
     */
    @PostMapping("/export/{category}/{chartType}/{format}/{exportType}")
    public ResponseEntity<ExportResult> exportReport(
            @PathVariable String category,
            @PathVariable String chartType,
            @PathVariable String format,
            @PathVariable String exportType,
            @RequestBody ReportParameters parameters) {
        try {
            ExportResult result = reportGenerationService.generateAndExportReport(
                    category, chartType, parameters, format, exportType);

            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get available report categories
     */
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getAvailableCategories() {
        try {
            List<String> categories = reportGenerationService.getAvailableCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get available chart types for a category
     */
    @GetMapping("/categories/{category}/chart-types")
    public ResponseEntity<List<String>> getAvailableChartTypes(@PathVariable String category) {
        try {
            List<String> chartTypes = reportGenerationService.getAvailableChartTypes(category);
            return ResponseEntity.ok(chartTypes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get available output formats
     */
    @GetMapping("/formats")
    public ResponseEntity<List<String>> getAvailableFormats() {
        try {
            List<String> formats = reportGenerationService.getAvailableFormats();
            return ResponseEntity.ok(formats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get available export types
     */
    @GetMapping("/export-types")
    public ResponseEntity<List<String>> getAvailableExportTypes() {
        try {
            List<String> exportTypes = reportGenerationService.getAvailableExportTypes();
            return ResponseEntity.ok(exportTypes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all available options in one request
     */
    @GetMapping("/options")
    public ResponseEntity<Map<String, Object>> getAllOptions() {
        try {
            Map<String, Object> options = Map.of(
                    "categories", reportGenerationService.getAvailableCategories(),
                    "formats", reportGenerationService.getAvailableFormats(),
                    "exportTypes", reportGenerationService.getAvailableExportTypes());
            return ResponseEntity.ok(options);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Simple special waste test with hardcoded parameters
     */
    @GetMapping("/special-waste/test/{chartType}")
    public ResponseEntity<Map<String, Object>> testSpecialWasteReport(@PathVariable String chartType) {
        try {
            System.out.println("=== TESTING SPECIAL WASTE REPORT ===");
            System.out.println("Chart Type: " + chartType);

            // Create simple parameters - try with sample data first
            ReportParameters parameters = new ReportParameters();
            parameters.setIncludeSampleData(true); // Changed to true to avoid DB issues
            parameters.setStartDate(java.time.LocalDate.of(2024, 1, 1));
            parameters.setEndDate(java.time.LocalDate.of(2024, 12, 31));
            parameters.setFormat("JSON");

            System.out.println("Parameters created successfully");

            ReportData reportData = reportGenerationService.generateReport(
                    "Special Waste Analytics", chartType, parameters);

            System.out.println("Report generated successfully");

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("reportId", reportData.getReportId());
            response.put("title", reportData.getTitle());
            response.put("chartDataSize", reportData.getChartData() != null ? reportData.getChartData().size() : 0);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("=== ERROR IN TEST ENDPOINT ===");
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            System.err.println("===============================");

            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            response.put("type", e.getClass().getSimpleName());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/special-waste/sample/{chartType}")
    public ResponseEntity<ReportData> getSpecialWasteSampleReport(@PathVariable String chartType) {
        try {
            ReportParameters parameters = new ReportParameters();
            parameters.setIncludeSampleData(true);
            parameters.setStartDate(java.time.LocalDate.now().minusDays(30));
            parameters.setEndDate(java.time.LocalDate.now());

            ReportData reportData = reportGenerationService.generateReport(
                    "Special Waste Analytics", chartType, parameters);

            return ResponseEntity.ok(reportData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Special endpoint for Special Waste Analytics with actual database data
     */
    @PostMapping("/special-waste/actual/{chartType}")
    public ResponseEntity<ReportData> getSpecialWasteActualReport(
            @PathVariable String chartType,
            @RequestBody ReportParameters parameters) {
        try {
            System.out.println("=== SPECIAL WASTE REQUEST RECEIVED ===");
            System.out.println("Chart Type: " + chartType);
            System.out.println("Parameters: " + parameters);
            System.out.println("=====================================");

            parameters.setIncludeSampleData(false);

            ReportData reportData = reportGenerationService.generateReport(
                    "Special Waste Analytics", chartType, parameters);

            System.out.println("=== REPORT GENERATION SUCCESSFUL ===");
            return ResponseEntity.ok(reportData);
        } catch (IllegalArgumentException e) {
            System.err.println("=== ILLEGAL ARGUMENT EXCEPTION ===");
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            System.err.println("================================");
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("=== GENERAL EXCEPTION ===");
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            System.err.println("========================");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Test endpoint to verify controller is working
     */
    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("SOLID Report Controller is working!");
    }

    /**
     * Very simple test without any dependencies
     */
    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> pingEndpoint() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Backend is running");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }

    /**
     * Test database connectivity specifically
     */
    @GetMapping("/test-database")
    public ResponseEntity<Map<String, Object>> testDatabaseConnectivity() {
        Map<String, Object> response = new HashMap<>();
        try {
            System.out.println("=== TESTING DATABASE CONNECTIVITY ===");

            // Test if repository is injected
            if (specialCollectionRepository == null) {
                response.put("status", "error");
                response.put("message", "SpecialCollectionRepository is null - injection failed");
                return ResponseEntity.status(500).body(response);
            }

            System.out.println("Repository injected successfully");

            // Test basic database operation
            long count = specialCollectionRepository.count();
            System.out.println("Database count operation successful: " + count + " records");

            // Test find all
            java.util.List<SpecialCollection> collections = specialCollectionRepository.findAll();
            System.out.println("Find all operation successful: " + collections.size() + " records retrieved");

            response.put("status", "success");
            response.put("repositoryInjected", true);
            response.put("recordCount", count);
            response.put("findAllSize", collections.size());
            response.put("message", "Database connectivity test passed");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Database connectivity test failed: " + e.getMessage());
            e.printStackTrace();

            response.put("status", "error");
            response.put("message", "Database connectivity failed: " + e.getMessage());
            response.put("errorType", e.getClass().getSimpleName());

            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Test actual special waste generation with database data
     */
    @GetMapping("/test-actual-generation/{chartType}")
    public ResponseEntity<Map<String, Object>> testActualSpecialWasteGeneration(@PathVariable String chartType) {
        Map<String, Object> response = new HashMap<>();
        try {
            System.out.println("=== TESTING ACTUAL SPECIAL WASTE GENERATION WITH DATABASE DATA ===");
            System.out.println("Chart Type: " + chartType);

            // Create parameters for actual database access (no sample data)
            ReportParameters parameters = new ReportParameters();
            parameters.setIncludeSampleData(false); // Force database access
            parameters.setStartDate(java.time.LocalDate.of(2024, 1, 1));
            parameters.setEndDate(java.time.LocalDate.of(2024, 12, 31));
            parameters.setFormat("JSON");
            parameters.setWasteType(""); // Empty means all types
            parameters.setGroupByDate(true);

            System.out.println("Parameters created: " + parameters);
            System.out.println("Attempting to generate report with actual database data...");

            ReportData reportData = reportGenerationService.generateReport(
                    "Special Waste Analytics", chartType, parameters);

            System.out.println("Report generated successfully with database data!");
            System.out.println("Report ID: " + reportData.getReportId());
            System.out.println(
                    "Chart data size: " + (reportData.getChartData() != null ? reportData.getChartData().size() : 0));

            response.put("status", "success");
            response.put("reportId", reportData.getReportId());
            response.put("title", reportData.getTitle());
            response.put("description", reportData.getDescription());
            response.put("chartDataSize", reportData.getChartData() != null ? reportData.getChartData().size() : 0);
            response.put("usedDatabaseData", true);
            response.put("parameters", parameters.toString());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("=== ERROR IN ACTUAL SPECIAL WASTE GENERATION TEST ===");
            System.err.println("Exception Type: " + e.getClass().getSimpleName());
            System.err.println("Message: " + e.getMessage());
            System.err.println("Cause: " + (e.getCause() != null ? e.getCause().getMessage() : "No cause"));
            System.err.println("Stack trace:");
            e.printStackTrace();
            System.err.println("===============================");

            response.put("status", "error");
            response.put("message", "Actual generation failed: " + e.getMessage());
            response.put("errorType", e.getClass().getSimpleName());
            response.put("cause", e.getCause() != null ? e.getCause().getMessage() : null);

            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Pure sample data test - no database access
     */
    @GetMapping("/special-waste/sample-only/{chartType}")
    public ResponseEntity<Map<String, Object>> testSampleOnlyReport(@PathVariable String chartType) {
        try {
            System.out.println("=== TESTING SAMPLE-ONLY SPECIAL WASTE REPORT ===");
            System.out.println("Chart Type: " + chartType);

            // Create parameters that force sample data usage
            ReportParameters parameters = new ReportParameters();
            parameters.setIncludeSampleData(true);
            parameters.setStartDate(java.time.LocalDate.of(2024, 1, 1));
            parameters.setEndDate(java.time.LocalDate.of(2024, 12, 31));
            parameters.setFormat("JSON");

            System.out.println("Calling report generation service...");

            ReportData reportData = reportGenerationService.generateReport(
                    "Special Waste Analytics", chartType, parameters);

            System.out.println("Report generated successfully!");

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("reportId", reportData.getReportId());
            response.put("title", reportData.getTitle());
            response.put("description", reportData.getDescription());
            response.put("chartDataSize", reportData.getChartData() != null ? reportData.getChartData().size() : 0);
            response.put("usedSampleData", true);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("=== ERROR IN SAMPLE-ONLY TEST ===");
            System.err.println("Exception Type: " + e.getClass().getSimpleName());
            System.err.println("Message: " + e.getMessage());
            System.err.println("Stack trace:");
            e.printStackTrace();
            System.err.println("===============================");

            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            response.put("type", e.getClass().getSimpleName());
            response.put("stackTrace", java.util.Arrays.toString(e.getStackTrace()));

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/test-generators")
    public ResponseEntity<Map<String, Object>> testGenerators() {
        try {
            List<String> categories = reportGenerationService.getAvailableCategories();
            Map<String, Object> result = new HashMap<>();
            result.put("status", "success");
            result.put("availableCategories", categories);
            result.put("message", "Generators loaded successfully");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("status", "error");
            result.put("message", "Error loading generators: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }

    // Helper methods following SRP
    private MediaType getMediaType(String format) {
        return switch (format.toUpperCase()) {
            case "PDF" -> MediaType.APPLICATION_PDF;
            case "JSON" -> MediaType.APPLICATION_JSON;
            case "EXCEL" -> MediaType.valueOf("application/vnd.ms-excel");
            default -> MediaType.TEXT_PLAIN;
        };
    }

    private String generateFilename(ReportData reportData, String format) {
        String sanitizedTitle = reportData.getTitle()
                .replaceAll("[^a-zA-Z0-9.-]", "_");

        String extension = switch (format.toUpperCase()) {
            case "PDF" -> ".pdf";
            case "JSON" -> ".json";
            case "EXCEL" -> ".xlsx";
            default -> ".txt";
        };

        return sanitizedTitle + "_" + reportData.getChartType() + extension;
    }

    /**
     * Test repository injection without generators
     */
    @GetMapping("/test-service")
    public ResponseEntity<Map<String, Object>> testReportService() {
        try {
            System.out.println("=== TESTING REPORT SERVICE ===");

            // Test if the service is injected
            if (reportGenerationService == null) {
                throw new RuntimeException("ReportGenerationService is null");
            }

            // Test getting available categories (this doesn't generate reports)
            List<String> categories = reportGenerationService.getAvailableCategories();

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Report service is working");
            response.put("availableCategories", categories);
            response.put("categoriesCount", categories.size());

            System.out.println("Available categories: " + categories);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("=== ERROR IN SERVICE TEST ===");
            System.err.println("Exception Type: " + e.getClass().getSimpleName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            System.err.println("=============================");

            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            response.put("type", e.getClass().getSimpleName());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Send report via email
     */
    @PostMapping("/email")
    public ResponseEntity<Map<String, String>> emailReport(@RequestBody Map<String, Object> requestBody) {
        try {
            String email = (String) requestBody.get("email");
            String reportId = (String) requestBody.get("reportId");
            String reportTitle = (String) requestBody.get("reportTitle");
            String reportContent = (String) requestBody.get("reportContent");

            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Email address is required"));
            }

            if (reportTitle == null || reportTitle.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Report title is required"));
            }

            // Generate report URL if reportId is provided
            String reportUrl = reportId != null ? "http://localhost:3000/reports/solid/" + reportId : null;

            // Send email
            emailService.sendReportEmail(email, reportTitle,
                    reportContent != null ? reportContent : "SOLID Principles-based report with detailed analytics.",
                    reportUrl);

            return ResponseEntity.ok(Map.of("message", "Report sent successfully to " + email));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send email: " + e.getMessage()));
        }
    }

    /**
     * Test email functionality
     */
    @PostMapping("/test-email")
    public ResponseEntity<Map<String, String>> testEmail(@RequestBody Map<String, String> requestBody) {
        try {
            String email = requestBody.get("email");
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Email address is required"));
            }

            emailService.sendReportEmail(email, "Test Report Email",
                    "This is a test email to verify the email functionality is working correctly.",
                    "http://localhost:3000/test");

            return ResponseEntity.ok(Map.of("message", "Test email sent successfully to " + email));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send test email: " + e.getMessage()));
        }
    }

    /**
     * Test database connection by getting special collections count
     */
    @GetMapping("/test-db")
    public ResponseEntity<Map<String, Object>> testDatabaseConnection() {
        try {
            // This will test if we can access the repo
            List<String> categories = reportGenerationService.getAvailableCategories();

            Map<String, Object> result = new HashMap<>();
            result.put("status", "success");
            result.put("message", "Database connection working");
            result.put("availableCategories", categories);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("status", "error");
            result.put("message", "Database connection failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }
}