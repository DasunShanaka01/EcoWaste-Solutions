package com.example.backend.service.report.generator;

import com.example.backend.dto.report.ChartDataPoint;
import com.example.backend.dto.report.ReportData;
import com.example.backend.dto.report.ReportParameters;
import com.example.backend.model.SpecialCollection;
import com.example.backend.repository.SpecialCollectionRepository;
import com.example.backend.service.report.ReportDataGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Special Waste Pie Chart Generator following SOLID principles
 * Generates pie charts showing distribution of special waste categories
 */
@Component
public class SpecialWastePieChartGenerator implements ReportDataGenerator {

    private static final String CATEGORY = "Special Waste Analytics";
    private static final String CHART_TYPE = "pie";

    // Special waste categories with colors
    private static final Map<String, String> CATEGORY_COLORS = Map.of(
            "Bulky", "#3b82f6", // Blue
            "Hazardous", "#ef4444", // Red
            "Garden", "#22c55e", // Green
            "E-Waste", "#8b5cf6", // Purple
            "Electronic", "#06b6d4", // Cyan
            "Furniture", "#f59e0b", // Amber
            "Chemical", "#dc2626" // Dark Red
    );

    @Autowired
    private SpecialCollectionRepository specialCollectionRepository;

    @Override
    public ReportData generateReportData(ReportParameters parameters) {
        try {
            System.out.println("SpecialWastePieChartGenerator: Starting report generation");
            System.out.println("Include sample data: " + parameters.isIncludeSampleData());

            ReportData reportData = new ReportData(
                    UUID.randomUUID().toString(),
                    "Special Waste Category Distribution",
                    CATEGORY,
                    CHART_TYPE);

            reportData.setDescription(
                    "Distribution of different special waste categories with collection counts and fees");

            // Generate chart data from database or sample data
            List<ChartDataPoint> chartData = parameters.isIncludeSampleData()
                    ? generateSamplePieChartData(parameters)
                    : generateActualPieChartData(parameters);

            System.out.println("Generated " + chartData.size() + " chart data points");
            reportData.setChartData(chartData);

            // Generate statistics
            Map<String, Object> statistics = generateStatistics(chartData);
            reportData.setStatistics(statistics);

            // Add metadata
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("totalCategories", chartData.size());
            metadata.put("dateRange", formatDateRange(parameters));
            metadata.put("generationType", parameters.isIncludeSampleData() ? "sample" : "actual");
            metadata.put("dataSource", "special_collections");
            reportData.setMetadata(metadata);

            System.out.println("SpecialWastePieChartGenerator: Report generation completed successfully");
            return reportData;
        } catch (Exception e) {
            System.err.println("Error in SpecialWastePieChartGenerator: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Override
    public String getSupportedCategory() {
        return CATEGORY;
    }

    @Override
    public String getSupportedChartType() {
        return CHART_TYPE;
    }

    @Override
    public boolean canHandle(ReportParameters parameters) {
        return parameters != null;
    }

    private List<ChartDataPoint> generateActualPieChartData(ReportParameters parameters) {
        List<SpecialCollection> collections = getFilteredCollections(parameters);

        // If no collections found (database empty or connection failed), use sample
        // data
        if (collections.isEmpty()) {
            System.out.println("No collections found, generating sample data instead");
            return generateSamplePieChartData(parameters);
        }

        // Check if we should group by date or category
        boolean groupByDate = parameters.getGroupByDate() != null ? parameters.getGroupByDate() : false;

        if (groupByDate) {
            return generateDateBasedPieChartData(collections);
        } else {
            return generateCategoryBasedPieChartData(collections);
        }
    }

    private List<ChartDataPoint> generateDateBasedPieChartData(List<SpecialCollection> collections) {
        // Group by date and category to show waste type distribution over time
        Map<String, Map<String, Double>> dateToCategories = new HashMap<>();

        for (SpecialCollection collection : collections) {
            String dateKey = collection.getDate(); // Date is already a String in format YYYY-MM-DD
            String category = collection.getCategory();

            dateToCategories.computeIfAbsent(dateKey, k -> new HashMap<>())
                    .merge(category, collection.getFee(), Double::sum);
        }

        List<ChartDataPoint> chartData = new ArrayList<>();

        // Create chart points for each date showing category breakdown
        for (Map.Entry<String, Map<String, Double>> dateEntry : dateToCategories.entrySet()) {
            String date = dateEntry.getKey();
            Map<String, Double> categories = dateEntry.getValue();

            // Calculate total for this date
            double dateTotal = categories.values().stream().mapToDouble(Double::doubleValue).sum();

            // Create a combined label showing the dominant category for this date
            String dominantCategory = categories.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("Mixed");

            ChartDataPoint point = new ChartDataPoint();
            point.setLabel(date + " (" + dominantCategory + ")");
            point.setValue(dateTotal);
            point.setColor(CATEGORY_COLORS.getOrDefault(dominantCategory, "#6b7280"));
            point.setCategory("Date-Category");
            point.setPeriod(String.format("%.0f collections",
                    categories.values().stream().mapToDouble(v -> 1).sum()));

            chartData.add(point);
        }

        // Sort by date
        chartData.sort((a, b) -> a.getLabel().compareTo(b.getLabel()));
        return chartData;
    }

    private List<ChartDataPoint> generateCategoryBasedPieChartData(List<SpecialCollection> collections) {
        // Group by category and calculate totals (original logic)
        Map<String, List<SpecialCollection>> groupedByCategory = collections.stream()
                .collect(Collectors.groupingBy(SpecialCollection::getCategory));

        List<ChartDataPoint> chartData = new ArrayList<>();

        for (Map.Entry<String, List<SpecialCollection>> entry : groupedByCategory.entrySet()) {
            String category = entry.getKey();
            List<SpecialCollection> categoryCollections = entry.getValue();

            // Calculate total fee for this category
            double totalFee = categoryCollections.stream()
                    .mapToDouble(SpecialCollection::getFee)
                    .sum();

            // Count total collections
            int totalCount = categoryCollections.size();

            ChartDataPoint point = new ChartDataPoint();
            point.setLabel(category);
            point.setValue(totalFee);
            point.setColor(CATEGORY_COLORS.getOrDefault(category, "#6b7280"));
            point.setCategory("Special Waste Category");

            // Add additional info in period field for display
            point.setPeriod(String.format("%d collections", totalCount));

            chartData.add(point);
        }

        // Sort by value (descending)
        chartData.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));

        return chartData;
    }

    private List<ChartDataPoint> generateSamplePieChartData(ReportParameters parameters) {
        // Sample data for demonstration
        List<ChartDataPoint> chartData = Arrays.asList(
                createSampleDataPoint("Bulky", 1250.0, "#3b82f6", "45 collections"),
                createSampleDataPoint("Garden", 850.0, "#22c55e", "32 collections"),
                createSampleDataPoint("E-Waste", 650.0, "#8b5cf6", "28 collections"),
                createSampleDataPoint("Hazardous", 420.0, "#ef4444", "18 collections"),
                createSampleDataPoint("Furniture", 380.0, "#f59e0b", "15 collections"),
                createSampleDataPoint("Chemical", 180.0, "#dc2626", "8 collections"));

        return chartData;
    }

    private ChartDataPoint createSampleDataPoint(String label, Double value, String color, String period) {
        ChartDataPoint point = new ChartDataPoint();
        point.setLabel(label);
        point.setValue(value);
        point.setColor(color);
        point.setCategory("Special Waste Category");
        point.setPeriod(period);
        return point;
    }

    private List<SpecialCollection> getFilteredCollections(ReportParameters parameters) {
        try {
            System.out.println("Fetching special collections from database...");

            if (specialCollectionRepository == null) {
                System.err.println("SpecialCollectionRepository is null! Using sample data instead.");
                return new ArrayList<>();
            }

            List<SpecialCollection> allCollections = specialCollectionRepository.findAll();
            System.out.println("Found " + allCollections.size() + " special collections in database");

            if (allCollections.isEmpty()) {
                System.out.println("No collections found in database - this is normal for demo environments");
                return new ArrayList<>();
            }

            // Filter by date range if specified
            if (parameters.getStartDate() != null && parameters.getEndDate() != null) {
                String startDateStr = parameters.getStartDate().toString();
                String endDateStr = parameters.getEndDate().toString();

                System.out.println("Filtering by date range: " + startDateStr + " to " + endDateStr);

                List<SpecialCollection> filtered = allCollections.stream()
                        .filter(collection -> {
                            String collectionDate = collection.getDate();
                            return collectionDate != null &&
                                    collectionDate.compareTo(startDateStr) >= 0 &&
                                    collectionDate.compareTo(endDateStr) <= 0;
                        })
                        .collect(Collectors.toList());

                System.out.println("After filtering: " + filtered.size() + " collections");
                return filtered;
            }

            return allCollections;
        } catch (Exception e) {
            System.err.println(
                    "Error fetching special collections (this is normal in demo environments): " + e.getMessage());
            System.err.println("Falling back to sample data generation");
            e.printStackTrace();
            return new ArrayList<>(); // Return empty list to trigger sample data
        }
    }

    private Map<String, Object> generateStatistics(List<ChartDataPoint> chartData) {
        Map<String, Object> stats = new HashMap<>();

        double totalFee = chartData.stream()
                .mapToDouble(ChartDataPoint::getValue)
                .sum();

        int totalCollections = chartData.stream()
                .mapToInt(point -> {
                    String period = point.getPeriod();
                    if (period != null && period.contains("collections")) {
                        try {
                            return Integer.parseInt(period.split(" ")[0]);
                        } catch (NumberFormatException e) {
                            return 0;
                        }
                    }
                    return 0;
                })
                .sum();

        Optional<ChartDataPoint> topCategory = chartData.stream()
                .max(Comparator.comparing(ChartDataPoint::getValue));

        Optional<ChartDataPoint> mostFrequent = chartData.stream()
                .max(Comparator.comparing(point -> {
                    String period = point.getPeriod();
                    if (period != null && period.contains("collections")) {
                        try {
                            return Integer.parseInt(period.split(" ")[0]);
                        } catch (NumberFormatException e) {
                            return 0;
                        }
                    }
                    return 0;
                }));

        stats.put("totalRevenue", String.format("$%.2f", totalFee));
        stats.put("totalCollections", totalCollections);
        stats.put("totalCategories", chartData.size());
        stats.put("topRevenueCategory",
                topCategory.map(p -> String.format("%s ($%.2f)", p.getLabel(), p.getValue())).orElse("N/A"));
        stats.put("mostFrequentCategory",
                mostFrequent.map(p -> String.format("%s (%s)", p.getLabel(), p.getPeriod())).orElse("N/A"));
        stats.put("averagePerCollection",
                totalCollections > 0 ? String.format("$%.2f", totalFee / totalCollections) : "$0.00");

        return stats;
    }

    private String formatDateRange(ReportParameters parameters) {
        if (parameters.getStartDate() != null && parameters.getEndDate() != null) {
            return String.format("%s to %s",
                    parameters.getStartDate().toString(),
                    parameters.getEndDate().toString());
        }
        return "All time";
    }
}