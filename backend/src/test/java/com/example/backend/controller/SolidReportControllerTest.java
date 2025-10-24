package com.example.backend.controller;

import com.example.backend.dto.report.ReportData;
import com.example.backend.dto.report.ReportParameters;
import com.example.backend.dto.report.ChartDataPoint;
import com.example.backend.service.report.ReportGenerationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Test class for SolidReportController
 * Tests the REST endpoints for report generation
 */
@ExtendWith(MockitoExtension.class)
class SolidReportControllerTest {

    @Mock
    private ReportGenerationService reportGenerationService;

    @InjectMocks
    private SolidReportController solidReportController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(solidReportController).build();
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules(); // For LocalDate support
    }

    @Test
    void testTestEndpoint() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/reports/solid/test"))
                .andExpect(status().isOk())
                .andExpect(content().string("SOLID Report Controller is working!"));
    }

    @Test
    void testGenerateReport_Success() throws Exception {
        // Arrange
        String category = "Special Waste Analytics";
        String chartType = "pie";
        ReportParameters parameters = createTestParameters();
        ReportData mockReportData = createMockReportData();

        when(reportGenerationService.generateReport(eq(category), eq(chartType), any(ReportParameters.class)))
                .thenReturn(mockReportData);

        String requestBody = objectMapper.writeValueAsString(parameters);

        // Act & Assert
        mockMvc.perform(post("/api/reports/solid/generate/{category}/{chartType}", category, chartType)
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reportId").value(mockReportData.getReportId()))
                .andExpect(jsonPath("$.title").value(mockReportData.getTitle()))
                .andExpect(jsonPath("$.category").value(category))
                .andExpect(jsonPath("$.chartType").value(chartType));
    }

    @Test
    void testGenerateReport_BadRequest() throws Exception {
        // Arrange
        String category = "Invalid Category";
        String chartType = "invalid";
        ReportParameters parameters = createTestParameters();

        when(reportGenerationService.generateReport(eq(category), eq(chartType), any(ReportParameters.class)))
                .thenThrow(new IllegalArgumentException("No generator found"));

        String requestBody = objectMapper.writeValueAsString(parameters);

        // Act & Assert
        mockMvc.perform(post("/api/reports/solid/generate/{category}/{chartType}", category, chartType)
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGenerateReport_InternalServerError() throws Exception {
        // Arrange
        String category = "Special Waste Analytics";
        String chartType = "pie";
        ReportParameters parameters = createTestParameters();

        when(reportGenerationService.generateReport(eq(category), eq(chartType), any(ReportParameters.class)))
                .thenThrow(new RuntimeException("Database connection failed"));

        String requestBody = objectMapper.writeValueAsString(parameters);

        // Act & Assert
        mockMvc.perform(post("/api/reports/solid/generate/{category}/{chartType}", category, chartType)
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testGetSpecialWasteSampleReport() throws Exception {
        // Arrange
        String chartType = "pie";
        ReportData mockReportData = createMockReportData();

        when(reportGenerationService.generateReport(eq("Special Waste Analytics"), eq(chartType),
                any(ReportParameters.class)))
                .thenReturn(mockReportData);

        // Act & Assert
        mockMvc.perform(get("/api/reports/solid/special-waste/sample/{chartType}", chartType))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reportId").value(mockReportData.getReportId()))
                .andExpect(jsonPath("$.category").value("Special Waste Analytics"))
                .andExpect(jsonPath("$.chartType").value(chartType));
    }

    @Test
    void testGetSpecialWasteActualReport_Success() throws Exception {
        // Arrange
        String chartType = "bar";
        ReportParameters parameters = createTestParameters();
        ReportData mockReportData = createMockReportData();
        mockReportData.setChartType(chartType);

        when(reportGenerationService.generateReport(eq("Special Waste Analytics"), eq(chartType),
                any(ReportParameters.class)))
                .thenReturn(mockReportData);

        String requestBody = objectMapper.writeValueAsString(parameters);

        // Act & Assert
        mockMvc.perform(post("/api/reports/solid/special-waste/actual/{chartType}", chartType)
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reportId").value(mockReportData.getReportId()))
                .andExpect(jsonPath("$.category").value("Special Waste Analytics"))
                .andExpect(jsonPath("$.chartType").value(chartType));
    }

    @Test
    void testGetSpecialWasteActualReport_BadRequest() throws Exception {
        // Arrange
        String chartType = "invalid";
        ReportParameters parameters = createTestParameters();

        when(reportGenerationService.generateReport(eq("Special Waste Analytics"), eq(chartType),
                any(ReportParameters.class)))
                .thenThrow(new IllegalArgumentException("Invalid chart type"));

        String requestBody = objectMapper.writeValueAsString(parameters);

        // Act & Assert
        mockMvc.perform(post("/api/reports/solid/special-waste/actual/{chartType}", chartType)
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetSpecialWasteActualReport_InternalServerError() throws Exception {
        // Arrange
        String chartType = "pie";
        ReportParameters parameters = createTestParameters();

        when(reportGenerationService.generateReport(eq("Special Waste Analytics"), eq(chartType),
                any(ReportParameters.class)))
                .thenThrow(new RuntimeException("Database error"));

        String requestBody = objectMapper.writeValueAsString(parameters);

        // Act & Assert
        mockMvc.perform(post("/api/reports/solid/special-waste/actual/{chartType}", chartType)
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testFormatReport_Success() throws Exception {
        // Arrange
        String category = "Special Waste Analytics";
        String chartType = "pie";
        String format = "JSON";
        ReportParameters parameters = createTestParameters();
        ReportData mockReportData = createMockReportData();
        byte[] formattedData = "{\"test\": \"data\"}".getBytes();

        when(reportGenerationService.generateReport(eq(category), eq(chartType), any(ReportParameters.class)))
                .thenReturn(mockReportData);
        when(reportGenerationService.formatReport(mockReportData, format))
                .thenReturn(formattedData);

        String requestBody = objectMapper.writeValueAsString(parameters);

        // Act & Assert
        mockMvc.perform(post("/api/reports/solid/format/{category}/{chartType}/{format}", category, chartType, format)
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(content().bytes(formattedData));
    }

    @Test
    void testDownloadReport_Success() throws Exception {
        // Arrange
        String category = "Special Waste Analytics";
        String chartType = "pie";
        String format = "PDF";
        ReportParameters parameters = createTestParameters();
        ReportData mockReportData = createMockReportData();
        byte[] formattedData = "PDF content".getBytes();

        when(reportGenerationService.generateReport(eq(category), eq(chartType), any(ReportParameters.class)))
                .thenReturn(mockReportData);
        when(reportGenerationService.formatReport(mockReportData, format))
                .thenReturn(formattedData);

        String requestBody = objectMapper.writeValueAsString(parameters);

        // Act & Assert
        mockMvc.perform(post("/api/reports/solid/download/{category}/{chartType}/{format}", category, chartType, format)
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition",
                        org.hamcrest.Matchers.containsString("attachment")))
                .andExpect(content().bytes(formattedData));
    }

    @Test
    void testCorsConfiguration() throws Exception {
        // Act & Assert
        mockMvc.perform(options("/api/reports/solid/test")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk());
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

    private ReportData createMockReportData() {
        ReportData reportData = new ReportData(
                UUID.randomUUID().toString(),
                "Test Special Waste Report",
                "Special Waste Analytics",
                "pie");

        // Add test chart data
        ChartDataPoint point1 = new ChartDataPoint();
        point1.setLabel("2024-10-20 (Garden)");
        point1.setValue(150.0);
        point1.setColor("#22c55e");

        ChartDataPoint point2 = new ChartDataPoint();
        point2.setLabel("2024-10-21 (Bulky)");
        point2.setValue(200.0);
        point2.setColor("#3b82f6");

        reportData.setChartData(Arrays.asList(point1, point2));
        reportData.setDescription("Test report showing date-based waste type distribution");

        // Add statistics
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("totalFee", 350.0);
        statistics.put("totalDates", 2);
        statistics.put("averageFee", 175.0);
        reportData.setStatistics(statistics);

        // Add metadata
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("totalCategories", 2);
        metadata.put("generationType", "actual");
        metadata.put("dataSource", "special_collections");
        reportData.setMetadata(metadata);

        return reportData;
    }
}