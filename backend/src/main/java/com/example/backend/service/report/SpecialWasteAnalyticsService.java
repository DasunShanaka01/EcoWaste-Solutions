package com.example.backend.service.report;

import com.example.backend.dto.report.ReportData;
import com.example.backend.dto.report.ReportParameters;
import com.example.backend.model.SpecialCollection;
import com.example.backend.repository.SpecialCollectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Special Waste Analytics Demo Service
 * Demonstrates the SOLID principles implementation with real Special
 * Collections data
 */
@Service
public class SpecialWasteAnalyticsService {

    private final ReportGenerationService reportGenerationService;
    private final SpecialCollectionRepository specialCollectionRepository;

    @Autowired
    public SpecialWasteAnalyticsService(
            ReportGenerationService reportGenerationService,
            SpecialCollectionRepository specialCollectionRepository) {
        this.reportGenerationService = reportGenerationService;
        this.specialCollectionRepository = specialCollectionRepository;
    }

    /**
     * Generate Special Waste Pie Chart showing distribution by categories
     * Example: Garden (45%), Bulky (30%), E-Waste (15%), Hazardous (10%)
     */
    public ReportData generateSpecialWastePieChart(LocalDate startDate, LocalDate endDate, boolean useSampleData) {
        ReportParameters parameters = new ReportParameters();
        parameters.setStartDate(startDate);
        parameters.setEndDate(endDate);
        parameters.setIncludeSampleData(useSampleData);
        parameters.setFormat("JSON");

        return reportGenerationService.generateReport(
                "Special Waste Analytics", "pie", parameters);
    }

    /**
     * Generate Special Waste Bar Chart showing individual items and their fees
     * Example: Sofa ($65), Old Refrigerator ($85), Garden Waste ($75), etc.
     */
    public ReportData generateSpecialWasteBarChart(LocalDate startDate, LocalDate endDate, boolean useSampleData) {
        ReportParameters parameters = new ReportParameters();
        parameters.setStartDate(startDate);
        parameters.setEndDate(endDate);
        parameters.setIncludeSampleData(useSampleData);
        parameters.setFormat("JSON");

        return reportGenerationService.generateReport(
                "Special Waste Analytics", "bar", parameters);
    }

    /**
     * Generate Special Waste Bar Chart filtered by category
     * Example: Only show Garden category items
     */
    public ReportData generateSpecialWasteBarChartByCategory(
            String category, LocalDate startDate, LocalDate endDate, boolean useSampleData) {
        ReportParameters parameters = new ReportParameters();
        parameters.setStartDate(startDate);
        parameters.setEndDate(endDate);
        parameters.setWasteType(category); // Filter by specific waste category
        parameters.setIncludeSampleData(useSampleData);
        parameters.setFormat("JSON");

        return reportGenerationService.generateReport(
                "Special Waste Analytics", "bar", parameters);
    }

    /**
     * Get current statistics from the database
     */
    public SpecialWasteStatistics getSpecialWasteStatistics() {
        List<SpecialCollection> allCollections = specialCollectionRepository.findAll();

        SpecialWasteStatistics stats = new SpecialWasteStatistics();
        stats.totalCollections = allCollections.size();
        stats.totalRevenue = allCollections.stream()
                .mapToDouble(SpecialCollection::getFee)
                .sum();
        stats.totalQuantity = allCollections.stream()
                .mapToInt(SpecialCollection::getQuantity)
                .sum();

        // Count by category
        stats.bulkyCount = (int) allCollections.stream()
                .filter(c -> "Bulky".equalsIgnoreCase(c.getCategory()))
                .count();
        stats.gardenCount = (int) allCollections.stream()
                .filter(c -> "Garden".equalsIgnoreCase(c.getCategory()))
                .count();
        stats.eWasteCount = (int) allCollections.stream()
                .filter(c -> "E-Waste".equalsIgnoreCase(c.getCategory()))
                .count();
        stats.hazardousCount = (int) allCollections.stream()
                .filter(c -> "Hazardous".equalsIgnoreCase(c.getCategory()))
                .count();

        // Find most expensive item
        stats.mostExpensiveItem = allCollections.stream()
                .max((a, b) -> Double.compare(a.getFee(), b.getFee()))
                .map(c -> c.getItems() + " ($" + c.getFee() + ")")
                .orElse("N/A");

        return stats;
    }

    /**
     * Demo method showing SOLID principles in action
     */
    public void demonstrateSpecialWasteAnalytics() {
        System.out.println("\n=== Special Waste Analytics Demo ===");

        // Get current statistics
        SpecialWasteStatistics stats = getSpecialWasteStatistics();
        System.out.println("Database Statistics:");
        System.out.println("- Total Collections: " + stats.totalCollections);
        System.out.println("- Total Revenue: $" + String.format("%.2f", stats.totalRevenue));
        System.out.println("- Bulky Items: " + stats.bulkyCount);
        System.out.println("- Garden Items: " + stats.gardenCount);
        System.out.println("- E-Waste Items: " + stats.eWasteCount);
        System.out.println("- Hazardous Items: " + stats.hazardousCount);
        System.out.println("- Most Expensive: " + stats.mostExpensiveItem);

        // Generate reports with sample data (for demo purposes)
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(30);

        try {
            // Pie Chart - Shows category distribution
            ReportData pieChart = generateSpecialWastePieChart(startDate, endDate, true);
            System.out.println("\nPie Chart Generated: " + pieChart.getTitle());
            System.out.println("Description: " + pieChart.getDescription());
            System.out.println("Chart Data Points: " + pieChart.getChartData().size());

            // Bar Chart - Shows individual items
            ReportData barChart = generateSpecialWasteBarChart(startDate, endDate, true);
            System.out.println("\nBar Chart Generated: " + barChart.getTitle());
            System.out.println("Description: " + barChart.getDescription());
            System.out.println("Chart Data Points: " + barChart.getChartData().size());

            // Bar Chart filtered by Garden category
            ReportData gardenBarChart = generateSpecialWasteBarChartByCategory(
                    "Garden", startDate, endDate, true);
            System.out.println("\nGarden Bar Chart Generated: " + gardenBarChart.getTitle());

            System.out.println("\n✅ All reports generated successfully using SOLID principles!");

        } catch (Exception e) {
            System.err.println("❌ Error generating reports: " + e.getMessage());
        }
    }

    /**
     * Inner class for statistics (following SRP)
     */
    public static class SpecialWasteStatistics {
        public int totalCollections;
        public double totalRevenue;
        public int totalQuantity;
        public int bulkyCount;
        public int gardenCount;
        public int eWasteCount;
        public int hazardousCount;
        public String mostExpensiveItem;
    }
}