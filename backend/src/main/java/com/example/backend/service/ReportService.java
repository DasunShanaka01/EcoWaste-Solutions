package com.example.backend.service;

import com.example.backend.Admin.Report;
import com.example.backend.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private ReportRepository reportRepository;

    public List<Report> getAllReports() {
        return reportRepository.findAll();
    }

    public Optional<Report> getReportById(String id) {
        return reportRepository.findById(id);
    }

    public Report createReport(Report report) {
        return reportRepository.save(report);
    }

    public Report updateReport(String id, Report reportDetails) {
        return reportRepository.findById(id)
                .map(report -> {
                    report.setTitle(reportDetails.getTitle());
                    report.setDescription(reportDetails.getDescription());
                    report.setCategory(reportDetails.getCategory());
                    report.setSubCategory(reportDetails.getSubCategory());
                    report.setStatus(reportDetails.getStatus());
                    report.setLocation(reportDetails.getLocation());
                    report.setAssignedTo(reportDetails.getAssignedTo());
                    report.setPriorityLevel(reportDetails.getPriorityLevel());
                    report.setContactInfo(reportDetails.getContactInfo());
                    report.setImageUrl(reportDetails.getImageUrl());
                    return reportRepository.save(report);
                })
                .orElse(null);
    }

    public boolean deleteReport(String id) {
        return reportRepository.findById(id)
                .map(report -> {
                    reportRepository.delete(report);
                    return true;
                })
                .orElse(false);
    }

    public List<Report> getReportsByStatus(String status) {
        return reportRepository.findByStatus(status);
    }

    public List<Report> getReportsByCategory(String category) {
        return reportRepository.findByCategory(category);
    }

    public List<Report> getReportsBySubCategory(String subCategory) {
        return reportRepository.findBySubCategory(subCategory);
    }

    public List<Report> getReportsByCategoryAndSubCategory(String category, String subCategory) {
        return reportRepository.findByCategoryAndSubCategory(category, subCategory);
    }

    public Map<String, Object> getReportAnalytics(String range) {
        Map<String, Object> analytics = new HashMap<>();

        // Calculate date range
        LocalDateTime startDate = getStartDateForRange(range);
        List<Report> reports;

        if (startDate != null) {
            reports = reportRepository.findByCreatedAtBetween(startDate, LocalDateTime.now());
        } else {
            reports = reportRepository.findAll();
        }

        // Total counts
        analytics.put("totalReports", reports.size());
        analytics.put("resolvedReports", reports.stream()
                .mapToInt(r -> "Resolved".equalsIgnoreCase(r.getStatus()) ? 1 : 0)
                .sum());
        analytics.put("pendingReports", reports.stream()
                .mapToInt(r -> "Pending".equalsIgnoreCase(r.getStatus()) ? 1 : 0)
                .sum());

        // Monthly breakdown
        analytics.put("monthlyReports", getMonthlyBreakdown(reports));

        // Category breakdown
        analytics.put("categoryBreakdown", getCategoryBreakdown(reports));

        // Recent reports (last 10)
        analytics.put("recentReports", reports.stream()
                .sorted((r1, r2) -> r2.getCreatedAt().compareTo(r1.getCreatedAt()))
                .limit(10)
                .collect(Collectors.toList()));

        return analytics;
    }

    private LocalDateTime getStartDateForRange(String range) {
        LocalDateTime now = LocalDateTime.now();
        switch (range.toLowerCase()) {
            case "week":
                return now.minusWeeks(1);
            case "month":
                return now.minusMonths(1);
            case "year":
                return now.minusYears(1);
            default:
                return now.minusMonths(1); // Default to month
        }
    }

    private List<Map<String, Object>> getMonthlyBreakdown(List<Report> reports) {
        Map<String, Long> monthlyCount = reports.stream()
                .collect(Collectors.groupingBy(
                        report -> report.getCreatedAt().getMonth().name().substring(0, 3),
                        Collectors.counting()));

        return monthlyCount.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> monthData = new HashMap<>();
                    monthData.put("month", entry.getKey());
                    monthData.put("reports", entry.getValue());
                    return monthData;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> getCategoryBreakdown(List<Report> reports) {
        Map<String, Long> categoryCount = reports.stream()
                .collect(Collectors.groupingBy(Report::getCategory, Collectors.counting()));

        long totalReports = reports.size();

        return categoryCount.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> categoryData = new HashMap<>();
                    categoryData.put("category", entry.getKey());
                    categoryData.put("count", entry.getValue());
                    categoryData.put("percentage",
                            totalReports > 0 ? Math.round((entry.getValue() * 100.0) / totalReports * 10.0) / 10.0 : 0);
                    return categoryData;
                })
                .sorted((a, b) -> Long.compare((Long) b.get("count"), (Long) a.get("count")))
                .collect(Collectors.toList());
    }

    public List<Report> getPendingReportsByPriority() {
        return reportRepository.findByStatusOrderByCreatedAtAsc("Pending");
    }

    public Map<String, Long> getStatusCounts() {
        List<Report> allReports = reportRepository.findAll();
        return allReports.stream()
                .collect(Collectors.groupingBy(Report::getStatus, Collectors.counting()));
    }
}