package com.example.backend.controller;

import com.example.backend.Admin.Report;
import com.example.backend.Admin.ReportCategory;
import com.example.backend.Admin.OperationalSubCategory;
import com.example.backend.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ReportController {

    @Autowired
    private ReportService reportService;

    // Get all reports
    @GetMapping
    public ResponseEntity<List<Report>> getAllReports() {
        try {
            List<Report> reports = reportService.getAllReports();
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get report by ID
    @GetMapping("/{id}")
    public ResponseEntity<Report> getReportById(@PathVariable String id) {
        try {
            Optional<Report> report = reportService.getReportById(id);
            return report.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Create new report
    @PostMapping
    public ResponseEntity<Report> createReport(@RequestBody Report report) {
        try {
            Report createdReport = reportService.createReport(report);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdReport);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Update report
    @PutMapping("/{id}")
    public ResponseEntity<Report> updateReport(@PathVariable String id, @RequestBody Report reportDetails) {
        try {
            Report updatedReport = reportService.updateReport(id, reportDetails);
            if (updatedReport != null) {
                return ResponseEntity.ok(updatedReport);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Delete report
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable String id) {
        try {
            boolean deleted = reportService.deleteReport(id);
            if (deleted) {
                return ResponseEntity.noContent().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get reports by status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Report>> getReportsByStatus(@PathVariable String status) {
        try {
            List<Report> reports = reportService.getReportsByStatus(status);
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get reports by category
    @GetMapping("/category/{category}")
    public ResponseEntity<List<Report>> getReportsByCategory(@PathVariable String category) {
        try {
            List<Report> reports = reportService.getReportsByCategory(category);
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get reports by sub-category
    @GetMapping("/subcategory/{subCategory}")
    public ResponseEntity<List<Report>> getReportsBySubCategory(@PathVariable String subCategory) {
        try {
            List<Report> reports = reportService.getReportsBySubCategory(subCategory);
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get reports by category and sub-category
    @GetMapping("/category/{category}/subcategory/{subCategory}")
    public ResponseEntity<List<Report>> getReportsByCategoryAndSubCategory(
            @PathVariable String category,
            @PathVariable String subCategory) {
        try {
            List<Report> reports = reportService.getReportsByCategoryAndSubCategory(category, subCategory);
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get report analytics
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getReportAnalytics(@RequestParam(defaultValue = "month") String range) {
        try {
            Map<String, Object> analytics = reportService.getReportAnalytics(range);
            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get pending reports by priority
    @GetMapping("/pending")
    public ResponseEntity<List<Report>> getPendingReportsByPriority() {
        try {
            List<Report> reports = reportService.getPendingReportsByPriority();
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get status counts
    @GetMapping("/status-counts")
    public ResponseEntity<Map<String, Long>> getStatusCounts() {
        try {
            Map<String, Long> statusCounts = reportService.getStatusCounts();
            return ResponseEntity.ok(statusCounts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Update report status
    @PatchMapping("/{id}/status")
    public ResponseEntity<Report> updateReportStatus(@PathVariable String id, @RequestParam String status) {
        try {
            Optional<Report> reportOpt = reportService.getReportById(id);
            if (reportOpt.isPresent()) {
                Report report = reportOpt.get();
                report.setStatus(status);
                Report updatedReport = reportService.createReport(report);
                return ResponseEntity.ok(updatedReport);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get available report categories
    @GetMapping("/categories")
    public ResponseEntity<ReportCategory[]> getReportCategories() {
        return ResponseEntity.ok(ReportCategory.values());
    }

    // Get available operational sub-categories
    @GetMapping("/operational-subcategories")
    public ResponseEntity<OperationalSubCategory[]> getOperationalSubCategories() {
        return ResponseEntity.ok(OperationalSubCategory.values());
    }
}