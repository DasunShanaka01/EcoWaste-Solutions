# SOLID Principles Implementation for Report Generation System

## Overview

This implementation demonstrates all five SOLID principles in a report generation system for the EcoWaste Solutions project.

## 1. Single Responsibility Principle (SRP)

### Classes with Single Responsibilities:

**ReportData.java** - Only holds report data structure

- Responsible for: Data transfer between layers
- Not responsible for: Business logic, formatting, export

**ChartDataPoint.java** - Only holds individual chart data points

- Responsible for: Chart point data structure
- Not responsible for: Chart rendering, calculations

**ReportParameters.java** - Only holds report generation parameters

- Responsible for: Input parameter structure
- Not responsible for: Validation, processing

**JsonReportFormatter.java** - Only formats reports to JSON

- Responsible for: JSON formatting
- Not responsible for: PDF formatting, data generation

**PdfReportFormatter.java** - Only formats reports to PDF

- Responsible for: PDF formatting
- Not responsible for: JSON formatting, data generation

## 2. Open/Closed Principle (OCP)

### Interfaces Open for Extension:

**ReportDataGenerator Interface** - Add new chart types without modifying existing code

```java
// Easy to add new generators:
public class WasteCollectionLineChartGenerator implements ReportDataGenerator {
    // Implementation for line charts
}
```

**ReportFormatter Interface** - Add new output formats without changing existing formatters

```java
// Easy to add new formatters:
public class ExcelReportFormatter implements ReportFormatter {
    // Excel formatting implementation
}
```

**ReportExporter Interface** - Add new export destinations without modifying existing exporters

```java
// Easy to add new exporters:
public class EmailReportExporter implements ReportExporter {
    // Email export implementation
}
```

### Current Implementations:

#### Waste Collection Analytics:

- **WasteCollectionBarChartGenerator** - Generates bar charts for waste collection
- **WasteCollectionPieChartGenerator** - Generates pie charts for waste types
- **WasteCollectionDonutChartGenerator** - Generates donut charts for recyclability

#### Special Waste Analytics:

- **SpecialWastePieChartGenerator** - Generates pie charts showing special waste category distribution (Garden, Bulky, E-Waste, Hazardous, etc.)
- **SpecialWasteBarChartGenerator** - Generates bar charts showing individual special waste items with fees (Sofa $65, Refrigerator $85, etc.)

#### Report Formatting:

- **JsonReportFormatter** - Formats reports as JSON
- **PdfReportFormatter** - Formats reports as PDF

#### Report Export:

- **FileReportExporter** - Exports reports to file system

## 3. Liskov Substitution Principle (LSP)

### Substitutable Implementations:

All generator implementations can be substituted for the `ReportDataGenerator` interface:

```java
ReportDataGenerator generator1 = new WasteCollectionBarChartGenerator();
ReportDataGenerator generator2 = new WasteCollectionPieChartGenerator();
ReportDataGenerator generator3 = new WasteCollectionDonutChartGenerator();

// All can be used interchangeably
ReportData report = generator1.generateReportData(parameters);
```

All formatter implementations can be substituted for the `ReportFormatter` interface:

```java
ReportFormatter formatter1 = new JsonReportFormatter();
ReportFormatter formatter2 = new PdfReportFormatter();

// Both can format the same report data
byte[] data1 = formatter1.formatReport(reportData);
byte[] data2 = formatter2.formatReport(reportData);
```

## 4. Interface Segregation Principle (ISP)

### Focused Interfaces:

**ReportDataGenerator** - Only methods related to data generation

```java
public interface ReportDataGenerator {
    ReportData generateReportData(ReportParameters parameters);
    String getSupportedCategory();
    String getSupportedChartType();
    boolean canHandle(ReportParameters parameters);
}
```

**ReportFormatter** - Only methods related to formatting

```java
public interface ReportFormatter {
    byte[] formatReport(ReportData reportData);
    String getSupportedFormat();
    String getContentType();
    String getFileExtension();
}
```

**ReportExporter** - Only methods related to exporting

```java
public interface ReportExporter {
    ExportResult exportReport(ReportData reportData, byte[] formattedData);
    String getSupportedExportType();
    boolean canExport(ReportData reportData);
}
```

No class is forced to implement methods it doesn't need.

## 5. Dependency Inversion Principle (DIP)

### High-level modules depend on abstractions:

**ReportGenerationService** depends on interfaces, not concrete classes:

```java
@Service
public class ReportGenerationService {
    private final List<ReportDataGenerator> dataGenerators;  // Abstract
    private final List<ReportFormatter> formatters;         // Abstract
    private final List<ReportExporter> exporters;           // Abstract

    // Constructor injection of abstractions
    public ReportGenerationService(
        List<ReportDataGenerator> dataGenerators,
        List<ReportFormatter> formatters,
        List<ReportExporter> exporters) {
        // ...
    }
}
```

**SolidReportController** depends on service abstraction:

```java
@RestController
public class SolidReportController {
    private final ReportGenerationService reportGenerationService; // Abstract

    // Constructor injection
    public SolidReportController(ReportGenerationService reportGenerationService) {
        this.reportGenerationService = reportGenerationService;
    }
}
```

## Benefits of This Implementation

### 1. Extensibility

- Add new chart types by implementing `ReportDataGenerator`
- Add new formats by implementing `ReportFormatter`
- Add new export types by implementing `ReportExporter`

### 2. Testability

- Each class has a single responsibility, making unit testing easier
- Interfaces can be mocked for testing
- Dependencies are injected, allowing test doubles

### 3. Maintainability

- Changes to one component don't affect others
- Code is organized by responsibility
- Easy to locate and fix issues

### 4. Flexibility

- Components can be swapped without changing client code
- New implementations can be added without modifying existing code
- Configuration-driven behavior through dependency injection

## Usage Examples

### Generate a Bar Chart Report:

```java
ReportParameters params = new ReportParameters();
params.setStartDate(LocalDate.now().minusDays(7));
params.setEndDate(LocalDate.now());
params.setIncludeSampleData(true);

ReportData report = reportGenerationService.generateReport(
    "Waste Collection Analytics", "bar", params);
```

### Generate Special Waste Analytics Reports:

#### Special Waste Pie Chart (Category Distribution):

```java
// Shows distribution by categories: Garden, Bulky, E-Waste, Hazardous, etc.
ReportData pieChart = reportGenerationService.generateReport(
    "Special Waste Analytics", "pie", params);
```

#### Special Waste Bar Chart (Individual Items):

```java
// Shows individual items with fees: Sofa ($65), Refrigerator ($85), etc.
ReportData barChart = reportGenerationService.generateReport(
    "Special Waste Analytics", "bar", params);
```

#### Filter by Waste Category:

```java
params.setWasteType("Garden"); // Filter for only Garden category items
ReportData gardenReport = reportGenerationService.generateReport(
    "Special Waste Analytics", "bar", params);
```

### Format and Export:

```java
byte[] pdfData = reportGenerationService.formatReport(report, "PDF");
ExportResult result = reportGenerationService.exportReport(report, pdfData, "FILE");
```

### One-Step Generation and Export:

```java
ExportResult result = reportGenerationService.generateAndExportReport(
    "Special Waste Analytics", "pie", params, "PDF", "FILE");
```

## API Endpoints

The `SolidReportController` provides RESTful endpoints:

### General Report Endpoints:

- `POST /api/reports/solid/generate/{category}/{chartType}` - Generate report data
- `POST /api/reports/solid/download/{category}/{chartType}/{format}` - Download formatted report
- `POST /api/reports/solid/export/{category}/{chartType}/{format}/{exportType}` - Export report

### Special Waste Analytics Endpoints:

- `GET /api/reports/solid/special-waste/sample/{chartType}` - Get sample Special Waste report
- `POST /api/reports/solid/special-waste/actual/{chartType}` - Get actual Special Waste report with database data

### Configuration Endpoints:

- `GET /api/reports/solid/categories` - Get available categories
- `GET /api/reports/solid/formats` - Get available formats
- `GET /api/reports/solid/export-types` - Get available export types
- `GET /api/reports/solid/options` - Get all available options in one request

### Example Usage:

#### Get Special Waste Pie Chart with Sample Data:

```
GET /api/reports/solid/special-waste/sample/pie
```

#### Get Special Waste Bar Chart with Actual Database Data:

```
POST /api/reports/solid/special-waste/actual/bar
Content-Type: application/json

{
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "wasteType": "Garden",
  "includeSampleData": false
}
```

## Testing the Implementation

Use the `ReportDemoService` to test the SOLID implementation:

```java
@Autowired
private ReportDemoService demoService;

// Test the implementation
demoService.demonstrateReportGeneration();
demoService.showAvailableOptions();
```

## Special Waste Analytics Integration

### Database Integration

The Special Waste Analytics generators integrate with the `special_collections` MongoDB collection:

```json
{
  "_id": { "$oid": "68f0bf17ae310355d0f83561" },
  "userId": "68f0950b2087b3043d16f3cf",
  "category": "Garden", // Waste category (Garden, Bulky, E-Waste, Hazardous)
  "items": "Sofa", // Item description
  "quantity": 1, // Quantity collected
  "fee": 10, // Collection fee
  "date": "2025-10-19", // Collection date
  "timeSlot": "Afternoon", // Time slot
  "location": "Building lobby", // Collection location
  "status": "Scheduled", // Collection status
  "paymentStatus": "Paid", // Payment status
  "createdAt": { "$date": "2025-10-16T09:47:03.223Z" }
}
```

### Chart Types and Data Representation

#### Pie Chart (Category Distribution):

- **Purpose**: Shows distribution of special waste by categories
- **Data Source**: Groups `special_collections` by `category` field
- **Display**: Each slice represents a category (Garden, Bulky, E-Waste, etc.)
- **Values**: Total fees collected per category
- **Labels**: Category name with collection count

#### Bar Chart (Individual Items):

- **Purpose**: Shows individual special waste items and their fees
- **Data Source**: Groups `special_collections` by `items` field
- **Display**: Each bar represents a specific item type
- **Values**: Total fees for each item type
- **Labels**: Item name with quantity information

### Service Integration

The `SpecialWasteAnalyticsService` provides convenient methods:

```java
// Generate pie chart showing category distribution
ReportData pieChart = specialWasteService.generateSpecialWastePieChart(
    LocalDate.now().minusDays(30), LocalDate.now(), false);

// Generate bar chart showing individual items
ReportData barChart = specialWasteService.generateSpecialWasteBarChart(
    LocalDate.now().minusDays(30), LocalDate.now(), false);

// Filter by specific category (e.g., only Garden items)
ReportData gardenChart = specialWasteService.generateSpecialWasteBarChartByCategory(
    "Garden", LocalDate.now().minusDays(30), LocalDate.now(), false);
```

This implementation showcases how SOLID principles create a robust, extensible, and maintainable report generation system that seamlessly integrates with real database collections.
