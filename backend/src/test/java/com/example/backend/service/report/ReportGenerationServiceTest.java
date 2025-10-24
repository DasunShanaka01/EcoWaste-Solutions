package com.example.backend.service.report;

import com.example.backend.dto.report.ReportData;
import com.example.backend.dto.report.ReportParameters;
import com.example.backend.dto.report.ChartDataPoint;
import com.example.backend.service.report.formatter.ReportFormatter;
import com.example.backend.service.report.exporter.ReportExporter;
import com.example.backend.service.report.exporter.ExportResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Test class for ReportGenerationService
 * Tests the SOLID principles implementation and DIP pattern
 */
@ExtendWith(MockitoExtension.class)
class ReportGenerationServiceTest {

    @Mock
    private ReportDataGenerator mockDataGenerator;

    @Mock
    private ReportFormatter mockFormatter;

    @Mock
    private ReportExporter mockExporter;

    private ReportGenerationService reportGenerationService;

    @BeforeEach
    void setUp() {
        List<ReportDataGenerator> generators = Arrays.asList(mockDataGenerator);
        List<ReportFormatter> formatters = Arrays.asList(mockFormatter);
        List<ReportExporter> exporters = Arrays.asList(mockExporter);

        reportGenerationService = new ReportGenerationService(generators, formatters, exporters);
    }

    @Test
    void testGenerateReport_Success() {
        // Arrange
        String category = "Special Waste Analytics";
        String chartType = "pie";
        ReportParameters parameters = createTestParameters();
        ReportData expectedData = createTestReportData();

        when(mockDataGenerator.getSupportedCategory()).thenReturn(category);
        when(mockDataGenerator.getSupportedChartType()).thenReturn(chartType);
        when(mockDataGenerator.canHandle(any(ReportParameters.class))).thenReturn(true);
        when(mockDataGenerator.generateReportData(parameters)).thenReturn(expectedData);

        // Act
        ReportData result = reportGenerationService.generateReport(category, chartType, parameters);

        // Assert
        assertNotNull(result);
        assertEquals(expectedData.getReportId(), result.getReportId());
        assertEquals(expectedData.getTitle(), result.getTitle());
        assertEquals(expectedData.getCategory(), result.getCategory());
        assertEquals(expectedData.getChartType(), result.getChartType());
        verify(mockDataGenerator).generateReportData(parameters);
    }

    @Test
    void testGenerateReport_NoGeneratorFound() {
        // Arrange
        String category = "Unknown Category";
        String chartType = "unknown";
        ReportParameters parameters = createTestParameters();

        when(mockDataGenerator.getSupportedCategory()).thenReturn("Different Category");
        when(mockDataGenerator.getSupportedChartType()).thenReturn("different");

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> reportGenerationService.generateReport(category, chartType, parameters));

        assertTrue(exception.getMessage().contains("No generator found"));
        assertTrue(exception.getMessage().contains(category));
        assertTrue(exception.getMessage().contains(chartType));
    }

    @Test
    void testFormatReport_Success() {
        // Arrange
        ReportData reportData = createTestReportData();
        String format = "PDF";
        byte[] expectedFormattedData = "test pdf content".getBytes();

        when(mockFormatter.getSupportedFormat()).thenReturn(format);
        when(mockFormatter.formatReport(reportData)).thenReturn(expectedFormattedData);

        // Act
        byte[] result = reportGenerationService.formatReport(reportData, format);

        // Assert
        assertNotNull(result);
        assertArrayEquals(expectedFormattedData, result);
        verify(mockFormatter).formatReport(reportData);
    }

    @Test
    void testFormatReport_NoFormatterFound() {
        // Arrange
        ReportData reportData = createTestReportData();
        String format = "UNKNOWN";

        when(mockFormatter.getSupportedFormat()).thenReturn("PDF");

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> reportGenerationService.formatReport(reportData, format));

        assertTrue(exception.getMessage().contains("No formatter found"));
        assertTrue(exception.getMessage().contains(format));
    }

    @Test
    void testExportReport_Success() {
        // Arrange
        ReportData reportData = createTestReportData();
        byte[] formattedData = "test content".getBytes();
        String exportType = "FILE";
        ExportResult expectedResult = new ExportResult(true, "File exported successfully", "/path/to/file");

        when(mockExporter.getSupportedExportType()).thenReturn(exportType);
        when(mockExporter.canExport(reportData)).thenReturn(true);
        when(mockExporter.exportReport(reportData, formattedData)).thenReturn(expectedResult);

        // Act
        ExportResult result = reportGenerationService.exportReport(reportData, formattedData, exportType);

        // Assert
        assertNotNull(result);
        assertEquals(expectedResult.isSuccess(), result.isSuccess());
        assertEquals(expectedResult.getMessage(), result.getMessage());
        assertEquals(expectedResult.getExportPath(), result.getExportPath());
        verify(mockExporter).exportReport(reportData, formattedData);
    }

    @Test
    void testExportReport_NoExporterFound() {
        // Arrange
        ReportData reportData = createTestReportData();
        byte[] formattedData = "test content".getBytes();
        String exportType = "UNKNOWN";

        when(mockExporter.getSupportedExportType()).thenReturn("FILE");

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> reportGenerationService.exportReport(reportData, formattedData, exportType));

        assertTrue(exception.getMessage().contains("No exporter found"));
        assertTrue(exception.getMessage().contains(exportType));
    }

    @Test
    void testCompleteReportGeneration_Success() {
        // Arrange
        String category = "Special Waste Analytics";
        String chartType = "bar";
        String format = "JSON";
        String exportType = "FILE";
        ReportParameters parameters = createTestParameters();

        ReportData reportData = createTestReportData();
        byte[] formattedData = "formatted content".getBytes();
        ExportResult exportResult = new ExportResult(true, "Export completed", "/path/to/file");

        // Mock generator
        when(mockDataGenerator.getSupportedCategory()).thenReturn(category);
        when(mockDataGenerator.getSupportedChartType()).thenReturn(chartType);
        when(mockDataGenerator.canHandle(any(ReportParameters.class))).thenReturn(true);
        when(mockDataGenerator.generateReportData(parameters)).thenReturn(reportData);

        // Mock formatter
        when(mockFormatter.getSupportedFormat()).thenReturn(format);
        when(mockFormatter.formatReport(reportData)).thenReturn(formattedData);

        // Mock exporter
        when(mockExporter.getSupportedExportType()).thenReturn(exportType);
        when(mockExporter.canExport(reportData)).thenReturn(true);
        when(mockExporter.exportReport(reportData, formattedData)).thenReturn(exportResult);

        // Act
        ReportData generatedReport = reportGenerationService.generateReport(category, chartType, parameters);
        byte[] formatted = reportGenerationService.formatReport(generatedReport, format);
        ExportResult result = reportGenerationService.exportReport(generatedReport, formatted, exportType);

        // Assert
        assertNotNull(result);
        assertTrue(result.isSuccess());
        verify(mockDataGenerator).generateReportData(parameters);
        verify(mockFormatter).formatReport(generatedReport);
        verify(mockExporter).exportReport(generatedReport, formatted);
    }

    @Test
    void testGeneratorCannotHandle() {
        // Arrange
        String category = "Special Waste Analytics";
        String chartType = "pie";
        ReportParameters parameters = createTestParameters();

        when(mockDataGenerator.getSupportedCategory()).thenReturn(category);
        when(mockDataGenerator.getSupportedChartType()).thenReturn(chartType);
        when(mockDataGenerator.canHandle(any(ReportParameters.class))).thenReturn(false);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> reportGenerationService.generateReport(category, chartType, parameters));

        assertTrue(exception.getMessage().contains("Cannot handle"));
    }

    private ReportParameters createTestParameters() {
        ReportParameters parameters = new ReportParameters();
        parameters.setStartDate(LocalDate.of(2024, 1, 1));
        parameters.setEndDate(LocalDate.of(2024, 12, 31));
        parameters.setFormat("JSON");
        parameters.setIncludeSampleData(false);
        parameters.setGroupByDate(true);
        return parameters;
    }

    private ReportData createTestReportData() {
        ReportData reportData = new ReportData(
                UUID.randomUUID().toString(),
                "Test Special Waste Report",
                "Special Waste Analytics",
                "pie");

        // Add test chart data
        ChartDataPoint point1 = new ChartDataPoint();
        point1.setLabel("Garden Waste");
        point1.setValue(150.0);
        point1.setColor("#22c55e");

        ChartDataPoint point2 = new ChartDataPoint();
        point2.setLabel("Bulky Items");
        point2.setValue(200.0);
        point2.setColor("#3b82f6");

        reportData.setChartData(Arrays.asList(point1, point2));
        reportData.setDescription("Test report for unit testing");

        return reportData;
    }
}