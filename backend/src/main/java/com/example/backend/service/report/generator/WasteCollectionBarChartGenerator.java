package com.example.backend.service.report.generator;

import com.example.backend.dto.report.ChartDataPoint;
import com.example.backend.dto.report.ReportData;
import com.example.backend.dto.report.ReportParameters;
import com.example.backend.service.report.ReportDataGenerator;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Waste Collection Bar Chart Generator following LSP
 * This class can be substituted for ReportDataGenerator interface
 */
@Component
public class WasteCollectionBarChartGenerator implements ReportDataGenerator {

    private static final String CATEGORY = "Waste Collection Analytics";
    private static final String CHART_TYPE = "bar";

    @Override
    public ReportData generateReportData(ReportParameters parameters) {
        ReportData reportData = new ReportData(
                UUID.randomUUID().toString(),
                "Waste Collection Bar Chart Analysis",
                CATEGORY,
                CHART_TYPE);

        reportData.setDescription("Daily waste collection amounts with date axis and waste amounts in kg");

        // Generate chart data
        List<ChartDataPoint> chartData = generateBarChartData(parameters);
        reportData.setChartData(chartData);

        // Generate statistics
        Map<String, Object> statistics = generateStatistics(chartData);
        reportData.setStatistics(statistics);

        // Add metadata
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("dateRange", formatDateRange(parameters));
        metadata.put("totalDataPoints", chartData.size());
        metadata.put("generationType", parameters.isIncludeSampleData() ? "sample" : "actual");
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
        return parameters != null &&
                parameters.getStartDate() != null &&
                parameters.getEndDate() != null;
    }

    private List<ChartDataPoint> generateBarChartData(ReportParameters parameters) {
        List<ChartDataPoint> dataPoints = new ArrayList<>();

        if (parameters.isIncludeSampleData()) {
            // Generate sample data for demonstration
            LocalDate current = parameters.getStartDate();
            while (!current.isAfter(parameters.getEndDate()) && dataPoints.size() < 30) {
                ChartDataPoint point = new ChartDataPoint();
                point.setPeriod(current.format(DateTimeFormatter.ofPattern("MMM dd")));
                point.setLabel(current.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
                point.setValue(generateRandomWasteAmount());
                point.setCategory("Daily Collection");
                dataPoints.add(point);
                current = current.plusDays(1);
            }
        } else {
            // In a real implementation, this would fetch actual data from repository
            dataPoints = generateActualDataPlaceholder(parameters);
        }

        return dataPoints;
    }

    private List<ChartDataPoint> generateActualDataPlaceholder(ReportParameters parameters) {
        // Placeholder for actual data - in real implementation,
        // this would fetch from waste collection repository
        List<ChartDataPoint> dataPoints = new ArrayList<>();
        String[] wasteTypes = { "Organic", "Plastic", "Paper", "Glass", "Metal" };

        for (String wasteType : wasteTypes) {
            ChartDataPoint point = new ChartDataPoint();
            point.setLabel(wasteType + " Waste");
            point.setValue(Math.random() * 500 + 100); // Random for demo
            point.setCategory("Waste Type");
            dataPoints.add(point);
        }

        return dataPoints;
    }

    private double generateRandomWasteAmount() {
        // Generate realistic waste amounts between 150-800 kg
        return Math.random() * 650 + 150;
    }

    private Map<String, Object> generateStatistics(List<ChartDataPoint> chartData) {
        Map<String, Object> stats = new HashMap<>();

        double totalWaste = chartData.stream()
                .mapToDouble(ChartDataPoint::getValue)
                .sum();

        double averageDaily = totalWaste / chartData.size();

        Optional<ChartDataPoint> maxDay = chartData.stream()
                .max(Comparator.comparing(ChartDataPoint::getValue));

        stats.put("totalWaste", String.format("%.1f kg", totalWaste));
        stats.put("averageDaily", String.format("%.1f kg", averageDaily));
        stats.put("totalDays", chartData.size());
        stats.put("peakDay", maxDay.map(ChartDataPoint::getLabel).orElse("N/A"));
        stats.put("peakAmount", maxDay.map(p -> String.format("%.1f kg", p.getValue())).orElse("N/A"));

        return stats;
    }

    private String formatDateRange(ReportParameters parameters) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy");
        return parameters.getStartDate().format(formatter) + " - " +
                parameters.getEndDate().format(formatter);
    }
}