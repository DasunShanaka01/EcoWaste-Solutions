package com.example.backend.service.report.generator;

import com.example.backend.dto.report.ChartDataPoint;
import com.example.backend.dto.report.ReportData;
import com.example.backend.dto.report.ReportParameters;
import com.example.backend.model.SpecialCollection;
import com.example.backend.repository.SpecialCollectionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Test class for Special Waste Analytics Generators
 * Tests both Pie Chart and Bar Chart generators
 */
@ExtendWith(MockitoExtension.class)
class SpecialWasteGeneratorTest {

    @Mock
    private SpecialCollectionRepository specialCollectionRepository;

    @InjectMocks
    private SpecialWastePieChartGenerator pieChartGenerator;

    @InjectMocks
    private SpecialWasteBarChartGenerator barChartGenerator;

    @BeforeEach
    void setUp() {
        // Setup is handled by @InjectMocks
    }

    @Test
    void testPieChartGenerator_SupportedCategory() {
        // Act & Assert
        assertEquals("Special Waste Analytics", pieChartGenerator.getSupportedCategory());
        assertEquals("pie", pieChartGenerator.getSupportedChartType());
    }

    @Test
    void testBarChartGenerator_SupportedCategory() {
        // Act & Assert
        assertEquals("Special Waste Analytics", barChartGenerator.getSupportedCategory());
        assertEquals("bar", barChartGenerator.getSupportedChartType());
    }

    @Test
    void testPieChartGenerator_CanHandle() {
        // Arrange
        ReportParameters parameters = createTestParameters();

        // Act & Assert
        assertTrue(pieChartGenerator.canHandle(parameters));
        assertTrue(pieChartGenerator.canHandle(null)); // Should handle null gracefully
    }

    @Test
    void testPieChartGenerator_WithSampleData() {
        // Arrange
        ReportParameters parameters = createTestParameters();
        parameters.setIncludeSampleData(true);

        // Act
        ReportData result = pieChartGenerator.generateReportData(parameters);

        // Assert
        assertNotNull(result);
        assertEquals("Special Waste Category Distribution", result.getTitle());
        assertEquals("Special Waste Analytics", result.getCategory());
        assertEquals("pie", result.getChartType());
        assertNotNull(result.getChartData());
        assertFalse(result.getChartData().isEmpty());

        // Verify repository was not called for sample data
        verify(specialCollectionRepository, never()).findAll();
    }

    @Test
    void testPieChartGenerator_WithActualData() {
        // Arrange
        ReportParameters parameters = createTestParameters();
        parameters.setIncludeSampleData(false);
        parameters.setGroupByDate(false); // Test category-based grouping

        List<SpecialCollection> mockCollections = createMockCollections();
        when(specialCollectionRepository.findAll()).thenReturn(mockCollections);

        // Act
        ReportData result = pieChartGenerator.generateReportData(parameters);

        // Assert
        assertNotNull(result);
        assertEquals("Special Waste Category Distribution", result.getTitle());
        assertEquals("Special Waste Analytics", result.getCategory());
        assertEquals("pie", result.getChartType());
        assertNotNull(result.getChartData());
        assertFalse(result.getChartData().isEmpty());

        // Verify repository was called
        verify(specialCollectionRepository).findAll();

        // Check chart data content
        List<ChartDataPoint> chartData = result.getChartData();
        assertTrue(chartData.size() > 0);

        // Verify data points have required fields
        for (ChartDataPoint point : chartData) {
            assertNotNull(point.getLabel());
            assertTrue(point.getValue() > 0);
            assertNotNull(point.getColor());
        }
    }

    @Test
    void testPieChartGenerator_WithDateBasedGrouping() {
        // Arrange
        ReportParameters parameters = createTestParameters();
        parameters.setIncludeSampleData(false);
        parameters.setGroupByDate(true); // Test date-based grouping

        List<SpecialCollection> mockCollections = createMockCollections();
        when(specialCollectionRepository.findAll()).thenReturn(mockCollections);

        // Act
        ReportData result = pieChartGenerator.generateReportData(parameters);

        // Assert
        assertNotNull(result);
        assertNotNull(result.getChartData());

        // With date-based grouping, labels should contain dates
        List<ChartDataPoint> chartData = result.getChartData();
        for (ChartDataPoint point : chartData) {
            String label = point.getLabel();
            // Labels should be in format "YYYY-MM-DD (Category)" for date-based grouping
            assertTrue(label.contains("2024-") || label.contains("Garden") || label.contains("Bulky"));
        }

        verify(specialCollectionRepository).findAll();
    }

    @Test
    void testBarChartGenerator_WithSampleData() {
        // Arrange
        ReportParameters parameters = createTestParameters();
        parameters.setIncludeSampleData(true);

        // Act
        ReportData result = barChartGenerator.generateReportData(parameters);

        // Assert
        assertNotNull(result);
        assertEquals("Special Waste Items Analysis", result.getTitle());
        assertEquals("Special Waste Analytics", result.getCategory());
        assertEquals("bar", result.getChartType());
        assertNotNull(result.getChartData());
        assertFalse(result.getChartData().isEmpty());

        // Verify repository was not called for sample data
        verify(specialCollectionRepository, never()).findAll();
    }

    @Test
    void testBarChartGenerator_WithActualData() {
        // Arrange
        ReportParameters parameters = createTestParameters();
        parameters.setIncludeSampleData(false);
        parameters.setGroupByDate(false); // Test item-based grouping

        List<SpecialCollection> mockCollections = createMockCollections();
        when(specialCollectionRepository.findAll()).thenReturn(mockCollections);

        // Act
        ReportData result = barChartGenerator.generateReportData(parameters);

        // Assert
        assertNotNull(result);
        assertEquals("Special Waste Items Analysis", result.getTitle());
        assertNotNull(result.getChartData());

        verify(specialCollectionRepository).findAll();

        // Check that data points represent items
        List<ChartDataPoint> chartData = result.getChartData();
        for (ChartDataPoint point : chartData) {
            assertNotNull(point.getLabel());
            assertTrue(point.getValue() >= 0);
            assertNotNull(point.getColor());
        }
    }

    @Test
    void testBarChartGenerator_WithDateBasedGrouping() {
        // Arrange
        ReportParameters parameters = createTestParameters();
        parameters.setIncludeSampleData(false);
        parameters.setGroupByDate(true); // Test date-based grouping

        List<SpecialCollection> mockCollections = createMockCollections();
        when(specialCollectionRepository.findAll()).thenReturn(mockCollections);

        // Act
        ReportData result = barChartGenerator.generateReportData(parameters);

        // Assert
        assertNotNull(result);
        assertNotNull(result.getChartData());

        // With date-based grouping, labels should be dates
        List<ChartDataPoint> chartData = result.getChartData();
        for (ChartDataPoint point : chartData) {
            String label = point.getLabel();
            // Labels should be dates in YYYY-MM-DD format
            assertTrue(label.matches("\\d{4}-\\d{2}-\\d{2}") || label.contains("2024"));
        }

        verify(specialCollectionRepository).findAll();
    }

    @Test
    void testPieChartGenerator_WithDateFiltering() {
        // Arrange
        ReportParameters parameters = createTestParameters();
        parameters.setStartDate(LocalDate.of(2024, 1, 1));
        parameters.setEndDate(LocalDate.of(2024, 12, 31));
        parameters.setIncludeSampleData(false);

        List<SpecialCollection> mockCollections = createMockCollections();
        when(specialCollectionRepository.findAll()).thenReturn(mockCollections);

        // Act
        ReportData result = pieChartGenerator.generateReportData(parameters);

        // Assert
        assertNotNull(result);
        verify(specialCollectionRepository).findAll();

        // Should have applied date filtering
        assertNotNull(result.getChartData());
        assertNotNull(result.getStatistics());
        assertNotNull(result.getMetadata());
    }

    @Test
    void testGenerators_HandleEmptyData() {
        // Arrange
        ReportParameters parameters = createTestParameters();
        parameters.setIncludeSampleData(false);

        when(specialCollectionRepository.findAll()).thenReturn(Arrays.asList()); // Empty list

        // Act
        ReportData pieResult = pieChartGenerator.generateReportData(parameters);
        ReportData barResult = barChartGenerator.generateReportData(parameters);

        // Assert
        assertNotNull(pieResult);
        assertNotNull(barResult);

        // Even with empty data, should return valid report structure
        assertNotNull(pieResult.getChartData());
        assertNotNull(barResult.getChartData());

        verify(specialCollectionRepository, times(2)).findAll();
    }

    @Test
    void testGenerators_HandleRepositoryException() {
        // Arrange
        ReportParameters parameters = createTestParameters();
        parameters.setIncludeSampleData(false);

        when(specialCollectionRepository.findAll()).thenThrow(new RuntimeException("Database connection failed"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            pieChartGenerator.generateReportData(parameters);
        });

        assertThrows(RuntimeException.class, () -> {
            barChartGenerator.generateReportData(parameters);
        });
    }

    private ReportParameters createTestParameters() {
        ReportParameters parameters = new ReportParameters();
        parameters.setStartDate(LocalDate.of(2024, 1, 1));
        parameters.setEndDate(LocalDate.of(2024, 12, 31));
        parameters.setFormat("JSON");
        parameters.setIncludeSampleData(false);
        parameters.setGroupByDate(false);
        return parameters;
    }

    private List<SpecialCollection> createMockCollections() {
        SpecialCollection collection1 = new SpecialCollection();
        collection1.setId("1");
        collection1.setUserId("user1");
        collection1.setCategory("Garden");
        collection1.setItems("Tree branches, Garden waste");
        collection1.setQuantity(2);
        collection1.setFee(45.50);
        collection1.setDate("2024-10-20");
        collection1.setTimeSlot("Morning");
        collection1.setStatus("Completed");
        collection1.setPaymentStatus("Paid");

        SpecialCollection collection2 = new SpecialCollection();
        collection2.setId("2");
        collection2.setUserId("user2");
        collection2.setCategory("Bulky");
        collection2.setItems("Old refrigerator");
        collection2.setQuantity(1);
        collection2.setFee(85.00);
        collection2.setDate("2024-10-21");
        collection2.setTimeSlot("Afternoon");
        collection2.setStatus("Completed");
        collection2.setPaymentStatus("Paid");

        SpecialCollection collection3 = new SpecialCollection();
        collection3.setId("3");
        collection3.setUserId("user3");
        collection3.setCategory("E-Waste");
        collection3.setItems("Old laptop, Monitor");
        collection3.setQuantity(2);
        collection3.setFee(55.25);
        collection3.setDate("2024-10-22");
        collection3.setTimeSlot("Morning");
        collection3.setStatus("Completed");
        collection3.setPaymentStatus("Paid");

        return Arrays.asList(collection1, collection2, collection3);
    }
}