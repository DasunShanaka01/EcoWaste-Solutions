package com.example.backend.service;

import com.example.backend.Admin.WasteCollectionReport;
import com.example.backend.Waste.Waste;
import com.example.backend.repository.WasteCollectionReportRepository;
import com.example.backend.Waste.WasteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WasteCollectionReportService {

    @Autowired
    private WasteCollectionReportRepository reportRepository;

    @Autowired
    private WasteRepository wasteRepository;

    public WasteCollectionReport generateMonthlyCollectionReport(Map<String, Object> parameters, String format,
            String generatedBy) {
        String region = (String) parameters.get("region");
        String department = (String) parameters.get("department");

        // Get date range - use the new method that handles custom dates
        LocalDateTime[] dateRangeArray = parseDateRange(parameters);
        LocalDateTime startDate = dateRangeArray[0];
        LocalDateTime endDate = dateRangeArray[1];

        // Fetch waste data based on parameters
        List<Waste> wasteData = getWasteDataByParameters(startDate, endDate, region, department);

        // Generate monthly collection analytics
        Map<String, Object> reportData = generateMonthlyAnalytics(wasteData, startDate, endDate);

        // Create report title
        String reportTitle = "Monthly Collection Report - " + formatDateRange(startDate, endDate);
        if (region != null && !region.isEmpty()) {
            reportTitle += " (" + region + " Region)";
        }

        // Save report
        WasteCollectionReport report = new WasteCollectionReport(
                "Monthly Collection",
                reportTitle,
                parameters,
                reportData,
                format,
                generatedBy);

        return reportRepository.save(report);
    }

    public WasteCollectionReport generateCollectionByRegionReport(Map<String, Object> parameters, String format,
            String generatedBy) {
        String department = (String) parameters.get("department");

        // Get date range - use the new method that handles custom dates
        LocalDateTime[] dateRangeArray = parseDateRange(parameters);
        LocalDateTime startDate = dateRangeArray[0];
        LocalDateTime endDate = dateRangeArray[1];

        // Fetch waste data for all regions
        List<Waste> wasteData = getWasteDataByParameters(startDate, endDate, null, department);

        // Generate region-wise analytics
        Map<String, Object> reportData = generateRegionAnalytics(wasteData, startDate, endDate);

        // Create report title
        String reportTitle = "Collection by Region Report - " + formatDateRange(startDate, endDate);
        if (department != null && !department.isEmpty()) {
            reportTitle += " (" + department + " Department)";
        }

        // Save report
        WasteCollectionReport report = new WasteCollectionReport(
                "Collection by Region",
                reportTitle,
                parameters,
                reportData,
                format,
                generatedBy);

        return reportRepository.save(report);
    }

    private LocalDateTime[] parseDateRange(String dateRange) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate, endDate;

        switch (dateRange != null ? dateRange : "last-month") {
            case "last-week":
                startDate = now.minusWeeks(1);
                endDate = now;
                break;
            case "last-quarter":
                startDate = now.minusMonths(3);
                endDate = now;
                break;
            case "last-year":
                startDate = now.minusYears(1);
                endDate = now;
                break;
            case "last-month":
            default:
                startDate = now.minusMonths(1);
                endDate = now;
                break;
        }

        return new LocalDateTime[] { startDate, endDate };
    }

    private LocalDateTime[] parseDateRange(Map<String, Object> parameters) {
        String dateRange = (String) parameters.get("dateRange");
        String startDateStr = (String) parameters.get("startDate");
        String endDateStr = (String) parameters.get("endDate");

        // If custom dates are provided, use them
        if (("custom".equals(dateRange) || dateRange == null) && startDateStr != null && endDateStr != null) {
            try {
                LocalDate startLocalDate = LocalDate.parse(startDateStr);
                LocalDate endLocalDate = LocalDate.parse(endDateStr);

                LocalDateTime startDate = startLocalDate.atStartOfDay();
                LocalDateTime endDate = endLocalDate.atTime(23, 59, 59);

                return new LocalDateTime[] { startDate, endDate };
            } catch (Exception e) {
                // If parsing fails, fall back to default range
                System.err.println("Error parsing custom dates: " + e.getMessage());
            }
        }

        // Fall back to predefined ranges
        return parseDateRange(dateRange);
    }

    private List<Waste> getWasteDataByParameters(LocalDateTime startDate, LocalDateTime endDate, String region,
            String department) {
        // Get all waste data within date range
        List<Waste> allWaste = wasteRepository.findAll();

        return allWaste.stream()
                .filter(waste -> waste.getSubmissionDate() != null)
                .filter(waste -> waste.getSubmissionDate().isAfter(startDate)
                        && waste.getSubmissionDate().isBefore(endDate))
                .filter(waste -> region == null || region.isEmpty() || matchesRegion(waste, region))
                .filter(waste -> department == null || department.isEmpty() || matchesDepartment(waste, department))
                .collect(Collectors.toList());
    }

    private boolean matchesRegion(Waste waste, String district) {
        // Implement district matching logic based on address data
        if (waste.getPickup() != null && waste.getPickup().getAddress() != null) {
            String address = waste.getPickup().getAddress().toLowerCase();
            String districtName = district.toLowerCase();

            // Check if the address contains the district name
            // Handle common variations and district names
            switch (districtName) {
                case "colombo":
                    return address.contains("colombo") || address.contains("kotte");
                case "gampaha":
                    return address.contains("gampaha") || address.contains("negombo") || address.contains("kelaniya");
                case "kalutara":
                    return address.contains("kalutara") || address.contains("panadura") || address.contains("horana");
                case "kandy":
                    return address.contains("kandy") || address.contains("peradeniya");
                case "matale":
                    return address.contains("matale") || address.contains("dambulla");
                case "nuwara-eliya":
                    return address.contains("nuwara eliya") || address.contains("nuwara-eliya")
                            || address.contains("hatton");
                case "galle":
                    return address.contains("galle") || address.contains("hikkaduwa");
                case "matara":
                    return address.contains("matara") || address.contains("weligama");
                case "hambantota":
                    return address.contains("hambantota") || address.contains("tangalle");
                case "jaffna":
                    return address.contains("jaffna") || address.contains("jaffna");
                case "batticaloa":
                    return address.contains("batticaloa") || address.contains("kalmunai");
                case "trincomalee":
                    return address.contains("trincomalee") || address.contains("trinco");
                case "kurunegala":
                    return address.contains("kurunegala") || address.contains("kuliyapitiya");
                case "anuradhapura":
                    return address.contains("anuradhapura") || address.contains("kekirawa");
                case "polonnaruwa":
                    return address.contains("polonnaruwa") || address.contains("kaduruwela");
                case "badulla":
                    return address.contains("badulla") || address.contains("bandarawela");
                case "ratnapura":
                    return address.contains("ratnapura") || address.contains("embilipitiya");
                case "kegalle":
                    return address.contains("kegalle") || address.contains("mawanella");
                default:
                    return address.contains(districtName);
            }
        }
        return false;
    }

    private boolean matchesDepartment(Waste waste, String wasteCategory) {
        // Implement waste category matching logic
        if (wasteCategory == null || wasteCategory.isEmpty()) {
            return true;
        }

        // Check waste items for category matching
        if (waste.getItems() == null || waste.getItems().isEmpty()) {
            return false;
        }

        String category = wasteCategory.toLowerCase();

        // Check if any item in the waste matches the category
        return waste.getItems().stream().anyMatch(item -> {
            if (item.getCategory() == null) {
                return false;
            }

            String itemCategory = item.getCategory().toLowerCase();
            String itemType = item.getItemType() != null ? item.getItemType().toLowerCase() : "";

            switch (category) {
                case "general-waste":
                    return itemCategory.contains("general") || itemCategory.contains("household") ||
                            itemCategory.contains("commercial") || itemCategory.contains("mixed") ||
                            itemType.contains("general") || itemType.contains("household");
                case "recyclable":
                    return itemCategory.contains("paper") || itemCategory.contains("plastic") ||
                            itemCategory.contains("metal") || itemCategory.contains("glass") ||
                            itemCategory.contains("cardboard") || itemCategory.contains("aluminum") ||
                            itemCategory.contains("recyclable") || itemType.contains("paper") ||
                            itemType.contains("plastic") || itemType.contains("metal") ||
                            itemType.contains("glass") || itemType.contains("recyclable");
                case "organic":
                    return itemCategory.contains("organic") || itemCategory.contains("food") ||
                            itemCategory.contains("garden") || itemCategory.contains("compost") ||
                            itemCategory.contains("biodegradable") || itemType.contains("organic") ||
                            itemType.contains("food") || itemType.contains("garden");
                case "hazardous":
                    return itemCategory.contains("hazardous") || itemCategory.contains("battery") ||
                            itemCategory.contains("chemical") || itemCategory.contains("electronic") ||
                            itemCategory.contains("toxic") || itemCategory.contains("dangerous") ||
                            itemType.contains("hazardous") || itemType.contains("battery") ||
                            itemType.contains("chemical") || itemType.contains("electronic");
                default:
                    return true;
            }
        });
    }

    private Map<String, Object> generateMonthlyAnalytics(List<Waste> wasteData, LocalDateTime startDate,
            LocalDateTime endDate) {
        Map<String, Object> analytics = new HashMap<>();

        // Basic metrics
        analytics.put("totalCollections", wasteData.size());
        analytics.put("totalWeight", wasteData.stream().mapToDouble(Waste::getTotalWeightKg).sum());
        analytics.put("totalPayback", wasteData.stream().mapToDouble(Waste::getTotalPaybackAmount).sum());

        // Monthly breakdown
        Map<String, Integer> monthlyCollections = wasteData.stream()
                .collect(Collectors.groupingBy(
                        waste -> YearMonth.from(waste.getSubmissionDate()).toString(),
                        Collectors.collectingAndThen(Collectors.counting(), Math::toIntExact)));
        analytics.put("monthlyBreakdown", monthlyCollections);

        // Status breakdown
        Map<String, Long> statusBreakdown = wasteData.stream()
                .collect(Collectors.groupingBy(Waste::getStatus, Collectors.counting()));
        analytics.put("statusBreakdown", statusBreakdown);

        // Submission method breakdown
        Map<String, Long> submissionMethodBreakdown = wasteData.stream()
                .collect(Collectors.groupingBy(Waste::getSubmissionMethod, Collectors.counting()));
        analytics.put("submissionMethodBreakdown", submissionMethodBreakdown);

        // Weight distribution
        Map<String, Object> weightAnalytics = new HashMap<>();
        weightAnalytics.put("averageWeight",
                wasteData.stream().mapToDouble(Waste::getTotalWeightKg).average().orElse(0.0));
        weightAnalytics.put("maxWeight", wasteData.stream().mapToDouble(Waste::getTotalWeightKg).max().orElse(0.0));
        weightAnalytics.put("minWeight", wasteData.stream().mapToDouble(Waste::getTotalWeightKg).min().orElse(0.0));
        analytics.put("weightAnalytics", weightAnalytics);

        // Recent collections (last 10)
        List<Map<String, Object>> recentCollections = wasteData.stream()
                .sorted((w1, w2) -> w2.getSubmissionDate().compareTo(w1.getSubmissionDate()))
                .limit(10)
                .map(this::wasteToMap)
                .collect(Collectors.toList());
        analytics.put("recentCollections", recentCollections);

        return analytics;
    }

    private Map<String, Object> generateRegionAnalytics(List<Waste> wasteData, LocalDateTime startDate,
            LocalDateTime endDate) {
        Map<String, Object> analytics = new HashMap<>();

        // Group by regions (simplified - you may need to adjust based on your data
        // structure)
        Map<String, List<Waste>> regionGroups = wasteData.stream()
                .collect(Collectors.groupingBy(this::extractRegion));

        Map<String, Object> regionAnalytics = new HashMap<>();
        for (Map.Entry<String, List<Waste>> entry : regionGroups.entrySet()) {
            String region = entry.getKey();
            List<Waste> regionWaste = entry.getValue();

            Map<String, Object> regionStats = new HashMap<>();
            regionStats.put("totalCollections", regionWaste.size());
            regionStats.put("totalWeight", regionWaste.stream().mapToDouble(Waste::getTotalWeightKg).sum());
            regionStats.put("totalPayback", regionWaste.stream().mapToDouble(Waste::getTotalPaybackAmount).sum());
            regionStats.put("averageWeight",
                    regionWaste.stream().mapToDouble(Waste::getTotalWeightKg).average().orElse(0.0));

            regionAnalytics.put(region, regionStats);
        }

        analytics.put("regionBreakdown", regionAnalytics);
        analytics.put("totalCollections", wasteData.size());
        analytics.put("totalRegions", regionGroups.size());

        // Top performing regions
        List<Map<String, Object>> topRegions = regionGroups.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> regionData = new HashMap<>();
                    regionData.put("region", entry.getKey());
                    regionData.put("collections", entry.getValue().size());
                    regionData.put("weight", entry.getValue().stream().mapToDouble(Waste::getTotalWeightKg).sum());
                    return regionData;
                })
                .sorted((r1, r2) -> Integer.compare((Integer) r2.get("collections"), (Integer) r1.get("collections")))
                .limit(5)
                .collect(Collectors.toList());

        analytics.put("topRegions", topRegions);

        return analytics;
    }

    private String extractRegion(Waste waste) {
        // Extract region from waste data - this is simplified
        if (waste.getPickup() != null && waste.getPickup().getAddress() != null) {
            String address = waste.getPickup().getAddress();
            // Simple region extraction - you may need to implement more sophisticated logic
            if (address.toLowerCase().contains("north"))
                return "North";
            if (address.toLowerCase().contains("south"))
                return "South";
            if (address.toLowerCase().contains("east"))
                return "East";
            if (address.toLowerCase().contains("west"))
                return "West";
            if (address.toLowerCase().contains("central"))
                return "Central";
        }
        return "Unknown";
    }

    private Map<String, Object> wasteToMap(Waste waste) {
        Map<String, Object> wasteMap = new HashMap<>();
        wasteMap.put("id", waste.getId().toString());
        wasteMap.put("fullName", waste.getFullName());
        wasteMap.put("submissionDate", waste.getSubmissionDate().toString());
        wasteMap.put("status", waste.getStatus());
        wasteMap.put("totalWeight", waste.getTotalWeightKg());
        wasteMap.put("totalPayback", waste.getTotalPaybackAmount());
        wasteMap.put("submissionMethod", waste.getSubmissionMethod());
        if (waste.getPickup() != null) {
            wasteMap.put("address", waste.getPickup().getAddress());
        }
        return wasteMap;
    }

    private String formatDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy");
        return startDate.format(formatter) + " - " + endDate.format(formatter);
    }

    // Additional methods for report management
    public List<WasteCollectionReport> getAllReports() {
        return reportRepository.findAll();
    }

    public Optional<WasteCollectionReport> getReportById(String id) {
        return reportRepository.findById(id);
    }

    public List<WasteCollectionReport> getReportsByTemplateType(String templateType) {
        return reportRepository.findByTemplateType(templateType);
    }

    public void deleteReport(String id) {
        reportRepository.deleteById(id);
    }
}