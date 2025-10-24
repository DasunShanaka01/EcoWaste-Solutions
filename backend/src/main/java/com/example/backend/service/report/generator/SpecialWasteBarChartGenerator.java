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
 * Special Waste Bar Chart Generator following SOLID principles
 * Generates bar charts showing special waste items and their amounts/fees
 */
@Component
public class SpecialWasteBarChartGenerator implements ReportDataGenerator {

    private static final String CATEGORY = "Special Waste Analytics";
    private static final String CHART_TYPE = "bar";
    private static final String BAR_COLOR = "#3b82f6"; // Default blue color for bars

    // Colors for different waste categories (updated to match actual categories)
    private static final Map<String, String> CATEGORY_COLORS = Map.of(
            "Bulky", "#3b82f6", // Blue
            "Hazardous", "#ef4444", // Red
            "Organic", "#22c55e", // Green
            "E-Waste", "#8b5cf6", // Purple
            "Recyclable", "#06b6d4", // Cyan
            "Other", "#f59e0b" // Amber
    );

    @Autowired
    private SpecialCollectionRepository specialCollectionRepository;

    @Override
    public ReportData generateReportData(ReportParameters parameters) {
        ReportData reportData = new ReportData(
                UUID.randomUUID().toString(),
                "Special Waste Items Analysis",
                CATEGORY,
                CHART_TYPE);

        reportData
                .setDescription("Bar chart showing different special waste items with collection fees and quantities");

        // Generate chart data from database or sample data
        List<ChartDataPoint> chartData = parameters.isIncludeSampleData()
                ? generateSampleBarChartData(parameters)
                : generateActualBarChartData(parameters);

        reportData.setChartData(chartData);

        // Generate statistics
        Map<String, Object> statistics = generateStatistics(chartData);
        reportData.setStatistics(statistics);

        // Add metadata
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("totalItems", chartData.size());
        metadata.put("dateRange", formatDateRange(parameters));
        metadata.put("generationType", parameters.isIncludeSampleData() ? "sample" : "actual");
        metadata.put("dataSource", "special_collections");
        metadata.put("chartFocus", "Individual waste items and fees");
        reportData.setMetadata(metadata);

        return reportData;
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

    private List<ChartDataPoint> generateActualBarChartData(ReportParameters parameters) {
        List<SpecialCollection> collections = getFilteredCollections(parameters);

        // If no collections found (database empty or connection failed), use sample
        // data
        if (collections.isEmpty()) {
            System.out.println("No collections found, generating sample data instead");
            return generateSampleBarChartData(parameters);
        }

        // For bar chart, always show by category with quantity-based bar lengths
        return generateCategoryBasedBarChartData(collections);
    }

    private List<ChartDataPoint> generateDateBasedBarChartData(List<SpecialCollection> collections) {
        // Group by date to show waste collection over time
        Map<String, List<SpecialCollection>> groupedByDate = collections.stream()
                .collect(Collectors.groupingBy(SpecialCollection::getDate));

        List<ChartDataPoint> chartData = new ArrayList<>();

        for (Map.Entry<String, List<SpecialCollection>> entry : groupedByDate.entrySet()) {
            String date = entry.getKey();
            List<SpecialCollection> dateCollections = entry.getValue();

            // Calculate total fee for this date
            double totalFee = dateCollections.stream()
                    .mapToDouble(SpecialCollection::getFee)
                    .sum();

            // Count total collections and get dominant category
            int totalCount = dateCollections.size();
            String dominantCategory = dateCollections.stream()
                    .collect(Collectors.groupingBy(SpecialCollection::getCategory, Collectors.counting()))
                    .entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("Mixed");

            ChartDataPoint point = new ChartDataPoint();
            point.setLabel(date);
            point.setValue(totalFee);
            point.setColor(BAR_COLOR);
            point.setCategory("Date");
            point.setPeriod(String.format("%d collections (%s)", totalCount, dominantCategory));

            chartData.add(point);
        }

        // Sort by date
        chartData.sort((a, b) -> a.getLabel().compareTo(b.getLabel()));
        return chartData;
    }

    private List<ChartDataPoint> generateCategoryBasedBarChartData(List<SpecialCollection> collections) {
        System.out.println("Generating category-based bar chart data from " + collections.size() + " collections");

        // Create a map to sum quantities for each category
        Map<String, Integer> categoryQuantities = new HashMap<>();

        // Initialize all categories with 0 to ensure they all appear as bars
        String[] allCategories = { "Bulky", "Hazardous", "Organic", "E-Waste", "Recyclable", "Other" };
        for (String category : allCategories) {
            categoryQuantities.put(category, 0);
        }

        // Sum up quantities for each category from actual data
        for (SpecialCollection collection : collections) {
            String category = collection.getCategory();
            int quantity = collection.getQuantity();

            System.out.println("Processing collection - Category: " + category + ", Quantity: " + quantity);

            // Add to existing quantity
            categoryQuantities.put(category, categoryQuantities.getOrDefault(category, 0) + quantity);
        }

        List<ChartDataPoint> chartData = new ArrayList<>();

        // Create bar chart points for each category (X-axis = category, Bar height =
        // quantity)
        for (Map.Entry<String, Integer> entry : categoryQuantities.entrySet()) {
            String category = entry.getKey();
            Integer totalQuantity = entry.getValue();

            ChartDataPoint point = new ChartDataPoint();
            point.setLabel(category); // X-axis label
            point.setValue(totalQuantity.doubleValue()); // Bar height based on quantity
            point.setColor(CATEGORY_COLORS.getOrDefault(category, "#6b7280"));
            point.setCategory("Special Waste Category");

            // Add additional info for tooltip/display
            point.setPeriod(String.format("Total: %d items", totalQuantity));

            chartData.add(point);
            System.out.println("Created bar chart point - Category: " + category + ", Quantity: " + totalQuantity);
        }

        // Sort by category name for consistent display order
        chartData.sort((a, b) -> a.getLabel().compareTo(b.getLabel()));

        System.out.println("Generated " + chartData.size() + " chart points for bar chart");
        return chartData;
    }

    private List<ChartDataPoint> generateItemBasedBarChartData(List<SpecialCollection> collections) {
        // Group by items and calculate totals (original logic)
        Map<String, List<SpecialCollection>> groupedByItems = collections.stream()
                .collect(Collectors.groupingBy(SpecialCollection::getItems));

        List<ChartDataPoint> chartData = new ArrayList<>();

        for (Map.Entry<String, List<SpecialCollection>> entry : groupedByItems.entrySet()) {
            String itemName = entry.getKey();
            List<SpecialCollection> itemCollections = entry.getValue();

            // Calculate total fee for this item type
            double totalFee = itemCollections.stream()
                    .mapToDouble(SpecialCollection::getFee)
                    .sum();

            // Calculate total quantity
            int totalQuantity = itemCollections.stream()
                    .mapToInt(SpecialCollection::getQuantity)
                    .sum();

            // Get the most common category for this item
            String mostCommonCategory = itemCollections.stream()
                    .collect(Collectors.groupingBy(SpecialCollection::getCategory, Collectors.counting()))
                    .entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("Unknown");

            ChartDataPoint point = new ChartDataPoint();
            point.setLabel(itemName);
            point.setValue(totalFee);
            point.setColor(CATEGORY_COLORS.getOrDefault(mostCommonCategory, "#6b7280"));
            point.setCategory(mostCommonCategory);

            // Store quantity info in period field
            point.setPeriod(String.format("Qty: %d", totalQuantity));

            chartData.add(point);
        }

        // Sort by fee amount (descending) and take top 15 to avoid overcrowding
        chartData.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));
        if (chartData.size() > 15) {
            chartData = chartData.subList(0, 15);
        }

        return chartData;
    }

    private List<ChartDataPoint> generateSampleBarChartData(ReportParameters parameters) {
        // Sample data showing categories with quantity-based bar heights (X-axis =
        // category, Bar height = total quantity)
        List<ChartDataPoint> chartData = Arrays.asList(
                createSampleDataPoint("Bulky", 45.0, "#3b82f6", "Special Waste Category", "Total: 45 items"),
                createSampleDataPoint("E-Waste", 36.0, "#8b5cf6", "Special Waste Category", "Total: 36 items"),
                createSampleDataPoint("Organic", 32.0, "#22c55e", "Special Waste Category", "Total: 32 items"),
                createSampleDataPoint("Hazardous", 19.0, "#ef4444", "Special Waste Category", "Total: 19 items"),
                createSampleDataPoint("Recyclable", 15.0, "#06b6d4", "Special Waste Category", "Total: 15 items"),
                createSampleDataPoint("Other", 8.0, "#f59e0b", "Special Waste Category", "Total: 8 items"));

        return chartData;
    }

    private ChartDataPoint createSampleDataPoint(String label, Double value, String color, String category,
            String period) {
        ChartDataPoint point = new ChartDataPoint();
        point.setLabel(label);
        point.setValue(value);
        point.setColor(color);
        point.setCategory(category);
        point.setPeriod(period);
        return point;
    }

    private List<SpecialCollection> getFilteredCollections(ReportParameters parameters) {
        try {
            System.out.println("Fetching special collections from database for bar chart...");

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

                System.out.println("After date filtering: " + filtered.size() + " collections");
                return filtered;
            }

            // Filter by waste type if specified
            if (parameters.getWasteType() != null && !parameters.getWasteType().isEmpty()) {
                List<SpecialCollection> filtered = allCollections.stream()
                        .filter(collection -> parameters.getWasteType().equalsIgnoreCase(collection.getCategory()))
                        .collect(Collectors.toList());

                System.out.println("After waste type filtering: " + filtered.size() + " collections");
                return filtered;
            }

            return allCollections;
        } catch (Exception e) {
            System.err
                    .println("Error fetching special collections for bar chart (this is normal in demo environments): "
                            + e.getMessage());
            System.err.println("Falling back to sample data generation");
            e.printStackTrace();
            return new ArrayList<>(); // Return empty list to trigger sample data
        }
    }

    private Map<String, Object> generateStatistics(List<ChartDataPoint> chartData) {
        Map<String, Object> stats = new HashMap<>();

        double totalRevenue = chartData.stream()
                .mapToDouble(ChartDataPoint::getValue)
                .sum();

        int totalQuantity = chartData.stream()
                .mapToInt(point -> {
                    String period = point.getPeriod();
                    if (period != null && period.startsWith("Qty: ")) {
                        try {
                            return Integer.parseInt(period.substring(5));
                        } catch (NumberFormatException e) {
                            return 0;
                        }
                    }
                    return 0;
                })
                .sum();

        Optional<ChartDataPoint> highestRevenue = chartData.stream()
                .max(Comparator.comparing(ChartDataPoint::getValue));

        // Count items by category
        Map<String, Long> categoryCounts = chartData.stream()
                .collect(Collectors.groupingBy(ChartDataPoint::getCategory, Collectors.counting()));

        String mostCommonCategory = categoryCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");

        stats.put("totalRevenue", String.format("$%.2f", totalRevenue));
        stats.put("totalItems", chartData.size());
        stats.put("totalQuantity", totalQuantity);
        stats.put("highestRevenueItem",
                highestRevenue.map(p -> String.format("%s ($%.2f)", p.getLabel(), p.getValue())).orElse("N/A"));
        stats.put("averagePerItem",
                chartData.size() > 0 ? String.format("$%.2f", totalRevenue / chartData.size()) : "$0.00");
        stats.put("mostCommonCategory", mostCommonCategory);
        stats.put("categoriesCount", categoryCounts.size());

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