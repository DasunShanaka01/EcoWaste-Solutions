package com.example.backend.service.report.generator;

import com.example.backend.dto.report.ChartDataPoint;
import com.example.backend.dto.report.ReportData;
import com.example.backend.dto.report.ReportParameters;
import com.example.backend.service.report.ReportDataGenerator;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Waste Collection Donut Chart Generator following LSP
 * This class can be substituted for ReportDataGenerator interface
 */
@Component
public class WasteCollectionDonutChartGenerator implements ReportDataGenerator {

    private static final String CATEGORY = "Waste Collection Analytics";
    private static final String CHART_TYPE = "donut";

    @Override
    public ReportData generateReportData(ReportParameters parameters) {
        ReportData reportData = new ReportData(
                UUID.randomUUID().toString(),
                "Waste Recyclability Overview",
                CATEGORY,
                CHART_TYPE);

        reportData.setDescription("Waste categories shown as donut chart with recyclable vs non-recyclable breakdown");

        // Generate chart data
        List<ChartDataPoint> chartData = generateDonutChartData(parameters);
        reportData.setChartData(chartData);

        // Generate statistics
        Map<String, Object> statistics = generateStatistics(chartData);
        reportData.setStatistics(statistics);

        // Add metadata
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("categories", chartData.size());
        metadata.put("generationType", parameters.isIncludeSampleData() ? "sample" : "actual");
        metadata.put("focusArea", "Recyclability Analysis");
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

    private List<ChartDataPoint> generateDonutChartData(ReportParameters parameters) {
        List<ChartDataPoint> dataPoints = new ArrayList<>();

        if (parameters.isIncludeSampleData()) {
            // Generate sample data focusing on recyclability
            dataPoints.add(createDataPoint("Recyclable", 1450.0, "#10b981", "Can be recycled"));
            dataPoints.add(createDataPoint("Organic", 1250.0, "#22c55e", "Compostable waste"));
            dataPoints.add(createDataPoint("Non-Recyclable", 890.0, "#ef4444", "Cannot be recycled"));
            dataPoints.add(createDataPoint("Hazardous", 320.0, "#dc2626", "Requires special handling"));
            dataPoints.add(createDataPoint("E-Waste", 180.0, "#7c3aed", "Electronic waste"));
        } else {
            // Placeholder for actual data
            dataPoints = generateActualDataPlaceholder();
        }

        return dataPoints;
    }

    private List<ChartDataPoint> generateActualDataPlaceholder() {
        List<ChartDataPoint> dataPoints = new ArrayList<>();

        // In real implementation, this would query the database for actual waste data
        dataPoints.add(createDataPoint("Recyclable", Math.random() * 1000 + 500, "#10b981", "Can be recycled"));
        dataPoints.add(createDataPoint("Organic", Math.random() * 800 + 400, "#22c55e", "Compostable waste"));
        dataPoints.add(createDataPoint("Non-Recyclable", Math.random() * 600 + 200, "#ef4444", "Cannot be recycled"));
        dataPoints.add(createDataPoint("Hazardous", Math.random() * 200 + 50, "#dc2626", "Requires special handling"));

        return dataPoints;
    }

    private ChartDataPoint createDataPoint(String label, Double value, String color, String category) {
        ChartDataPoint point = new ChartDataPoint();
        point.setLabel(label);
        point.setValue(value);
        point.setColor(color);
        point.setCategory(category);
        return point;
    }

    private Map<String, Object> generateStatistics(List<ChartDataPoint> chartData) {
        Map<String, Object> stats = new HashMap<>();

        double totalWaste = chartData.stream()
                .mapToDouble(ChartDataPoint::getValue)
                .sum();

        // Calculate recyclable percentage
        double recyclableWaste = chartData.stream()
                .filter(p -> "Recyclable".equals(p.getLabel()) || "Organic".equals(p.getLabel()))
                .mapToDouble(ChartDataPoint::getValue)
                .sum();

        double recyclablePercentage = (recyclableWaste / totalWaste) * 100;

        Optional<ChartDataPoint> largestCategory = chartData.stream()
                .max(Comparator.comparing(ChartDataPoint::getValue));

        stats.put("totalWeight", String.format("%.0f kg", totalWaste));
        stats.put("recyclablePercentage", String.format("%.1f%%", recyclablePercentage));
        stats.put("categories", chartData.size());
        stats.put("largestCategory",
                largestCategory.map(p -> String.format("%s (%.0f kg)", p.getLabel(), p.getValue())).orElse("N/A"));
        stats.put("efficiency",
                recyclablePercentage > 60 ? "Good" : recyclablePercentage > 40 ? "Fair" : "Needs Improvement");

        return stats;
    }
}