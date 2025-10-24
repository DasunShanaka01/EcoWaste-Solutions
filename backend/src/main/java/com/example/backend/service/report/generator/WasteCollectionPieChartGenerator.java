package com.example.backend.service.report.generator;

import com.example.backend.dto.report.ChartDataPoint;
import com.example.backend.dto.report.ReportData;
import com.example.backend.dto.report.ReportParameters;
import com.example.backend.service.report.ReportDataGenerator;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Waste Collection Pie Chart Generator following LSP
 * This class can be substituted for ReportDataGenerator interface
 */
@Component
public class WasteCollectionPieChartGenerator implements ReportDataGenerator {

    private static final String CATEGORY = "Waste Collection Analytics";
    private static final String CHART_TYPE = "pie";

    private static final String[] WASTE_TYPES = {
            "Organic", "Plastic", "Paper", "Glass", "Metal", "E-Waste", "Hazardous"
    };

    private static final String[] COLORS = {
            "#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#dc2626"
    };

    @Override
    public ReportData generateReportData(ReportParameters parameters) {
        ReportData reportData = new ReportData(
                UUID.randomUUID().toString(),
                "Waste Type Distribution Analysis",
                CATEGORY,
                CHART_TYPE);

        reportData.setDescription("Distribution of different waste types collected with percentages and weights");

        // Generate chart data
        List<ChartDataPoint> chartData = generatePieChartData(parameters);
        reportData.setChartData(chartData);

        // Generate statistics
        Map<String, Object> statistics = generateStatistics(chartData);
        reportData.setStatistics(statistics);

        // Add metadata
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("wasteTypes", WASTE_TYPES.length);
        metadata.put("generationType", parameters.isIncludeSampleData() ? "sample" : "actual");
        metadata.put("dateRange", formatDateRange(parameters));
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

    private List<ChartDataPoint> generatePieChartData(ReportParameters parameters) {
        List<ChartDataPoint> dataPoints = new ArrayList<>();

        if (parameters.isIncludeSampleData()) {
            // Generate sample data with realistic waste type distribution
            double[] basePercentages = { 35.2, 23.8, 15.6, 8.9, 7.3, 5.1, 4.1 }; // Realistic distribution

            for (int i = 0; i < WASTE_TYPES.length; i++) {
                ChartDataPoint point = new ChartDataPoint();
                point.setLabel(WASTE_TYPES[i]);
                point.setValue(generateWasteAmount(basePercentages[i]));
                point.setColor(COLORS[i]);
                point.setCategory("Waste Type");
                dataPoints.add(point);
            }
        } else {
            // In real implementation, fetch actual data from repository
            dataPoints = generateActualDataPlaceholder();
        }

        return dataPoints;
    }

    private List<ChartDataPoint> generateActualDataPlaceholder() {
        // Placeholder for actual data
        List<ChartDataPoint> dataPoints = new ArrayList<>();

        for (int i = 0; i < WASTE_TYPES.length; i++) {
            ChartDataPoint point = new ChartDataPoint();
            point.setLabel(WASTE_TYPES[i]);
            point.setValue(Math.random() * 300 + 50); // Random for demo
            point.setColor(COLORS[i]);
            point.setCategory("Waste Type");
            dataPoints.add(point);
        }

        return dataPoints;
    }

    private double generateWasteAmount(double percentage) {
        // Generate amounts based on percentage with some variation
        double baseAmount = 2000; // Total base amount
        double variation = 0.15; // 15% variation
        double amount = (baseAmount * percentage / 100);
        return amount * (1 + (Math.random() - 0.5) * variation);
    }

    private Map<String, Object> generateStatistics(List<ChartDataPoint> chartData) {
        Map<String, Object> stats = new HashMap<>();

        double totalWaste = chartData.stream()
                .mapToDouble(ChartDataPoint::getValue)
                .sum();

        Optional<ChartDataPoint> largestType = chartData.stream()
                .max(Comparator.comparing(ChartDataPoint::getValue));

        Optional<ChartDataPoint> smallestType = chartData.stream()
                .min(Comparator.comparing(ChartDataPoint::getValue));

        stats.put("totalWaste", String.format("%.0f kg", totalWaste));
        stats.put("totalTypes", chartData.size());
        stats.put("largestType", largestType
                .map(p -> String.format("%s (%.1f%%)", p.getLabel(), (p.getValue() / totalWaste) * 100)).orElse("N/A"));
        stats.put("smallestType", smallestType
                .map(p -> String.format("%s (%.1f%%)", p.getLabel(), (p.getValue() / totalWaste) * 100)).orElse("N/A"));
        stats.put("categories", "Mixed waste types");

        return stats;
    }

    private String formatDateRange(ReportParameters parameters) {
        if (parameters.getStartDate() != null && parameters.getEndDate() != null) {
            return String.format("%s to %s",
                    parameters.getStartDate().toString(),
                    parameters.getEndDate().toString());
        }
        return "Current period";
    }
}