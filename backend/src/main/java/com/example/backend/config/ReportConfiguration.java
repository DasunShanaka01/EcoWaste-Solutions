package com.example.backend.config;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for SOLID Report Generation
 * Ensures all report-related components are properly scanned and registered
 */
@Configuration
@ComponentScan(basePackages = {
        "com.example.backend.service.report",
        "com.example.backend.service.report.generator",
        "com.example.backend.service.report.formatter",
        "com.example.backend.service.report.exporter"
})
public class ReportConfiguration {
    // This configuration class ensures all SOLID report components are registered
    // Spring will automatically inject all implementations of the interfaces
    // into the ReportGenerationService through constructor injection
}