// SOLID Principles Report API Integration Example
// This file demonstrates how to use the new SOLID-based report generation API

class SolidReportService {
  constructor() {
    this.baseUrl = 'http://localhost:8080/api/reports/solid';
  }

  /**
   * Get available report options
   */
  async getAvailableOptions() {
    try {
      const response = await fetch(`${this.baseUrl}/options`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching options:', error);
      throw error;
    }
  }

  /**
   * Generate report data (following SRP - single responsibility)
   */
  async generateReportData(category, chartType, parameters) {
    try {
      const response = await fetch(`${this.baseUrl}/generate/${category}/${chartType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parameters)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Download formatted report (following OCP - open for extension)
   */
  async downloadReport(category, chartType, format, parameters) {
    try {
      const response = await fetch(`${this.baseUrl}/download/${category}/${chartType}/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parameters)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download report: ${response.statusText}`);
      }
      
      // Get filename from response headers
      const filename = this.getFilenameFromResponse(response) || `report.${format.toLowerCase()}`;
      
      // Create download
      const blob = await response.blob();
      this.downloadBlob(blob, filename);
      
      return { success: true, filename };
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  }

  /**
   * Export report to file system (following DIP - depends on abstractions)
   */
  async exportReport(category, chartType, format, exportType, parameters) {
    try {
      const response = await fetch(`${this.baseUrl}/export/${category}/${chartType}/${format}/${exportType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parameters)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to export report: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }

  /**
   * Get chart types for a category (following ISP - interface segregation)
   */
  async getChartTypesForCategory(category) {
    try {
      const response = await fetch(`${this.baseUrl}/categories/${encodeURIComponent(category)}/chart-types`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching chart types:', error);
      throw error;
    }
  }

  // Helper methods (following SRP)
  getFilenameFromResponse(response) {
    const disposition = response.headers.get('Content-Disposition');
    if (disposition) {
      const match = disposition.match(/filename="(.+)"/);
      return match ? match[1] : null;
    }
    return null;
  }

  downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

// React Component Example using SOLID principles
const SolidReportGenerator = () => {
  const [reportService] = useState(new SolidReportService());
  const [options, setOptions] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedChartType, setSelectedChartType] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Load available options on component mount
  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const availableOptions = await reportService.getAvailableOptions();
      setOptions(availableOptions);
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  const generateReport = async () => {
    if (!selectedCategory || !selectedChartType) {
      alert('Please select category and chart type');
      return;
    }

    setLoading(true);
    try {
      const parameters = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        includeSampleData: true,
        format: selectedFormat
      };

      // Generate report data (SRP in action)
      const data = await reportService.generateReportData(
        selectedCategory, 
        selectedChartType, 
        parameters
      );
      
      setReportData(data);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    if (!reportData) {
      alert('Please generate a report first');
      return;
    }

    setLoading(true);
    try {
      const parameters = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        includeSampleData: true
      };

      // Download formatted report (OCP in action - easily extensible formats)
      await reportService.downloadReport(
        selectedCategory, 
        selectedChartType, 
        selectedFormat, 
        parameters
      );
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  if (!options) {
    return <div>Loading options...</div>;
  }

  return (
    <div className="solid-report-generator">
      <h2>SOLID Principles Report Generator</h2>
      
      {/* Category Selection */}
      <div className="form-group">
        <label>Category:</label>
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Select Category</option>
          {options.categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Chart Type Selection */}
      {selectedCategory && (
        <div className="form-group">
          <label>Chart Type:</label>
          <select 
            value={selectedChartType} 
            onChange={(e) => setSelectedChartType(e.target.value)}
          >
            <option value="">Select Chart Type</option>
            {/* In a real app, you'd fetch chart types for the selected category */}
            <option value="bar">Bar Chart</option>
            <option value="pie">Pie Chart</option>
            <option value="donut">Donut Chart</option>
          </select>
        </div>
      )}

      {/* Format Selection */}
      <div className="form-group">
        <label>Format:</label>
        <select 
          value={selectedFormat} 
          onChange={(e) => setSelectedFormat(e.target.value)}
        >
          <option value="">Select Format</option>
          {options.formats.map(format => (
            <option key={format} value={format}>{format}</option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      <div className="actions">
        <button 
          onClick={generateReport} 
          disabled={loading || !selectedCategory || !selectedChartType}
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
        
        <button 
          onClick={downloadReport} 
          disabled={loading || !reportData || !selectedFormat}
        >
          {loading ? 'Downloading...' : 'Download Report'}
        </button>
      </div>

      {/* Report Preview */}
      {reportData && (
        <div className="report-preview">
          <h3>Generated Report: {reportData.title}</h3>
          <p>Category: {reportData.category}</p>
          <p>Chart Type: {reportData.chartType}</p>
          <p>Generated At: {reportData.generatedAt}</p>
          
          {reportData.statistics && (
            <div className="statistics">
              <h4>Statistics:</h4>
              <pre>{JSON.stringify(reportData.statistics, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Export the service and component
export { SolidReportService, SolidReportGenerator };

// Usage example:
// import { SolidReportService } from './solidReportService';
// 
// const reportService = new SolidReportService();
// 
// // Generate waste collection bar chart
// const reportData = await reportService.generateReportData(
//   'Waste Collection Analytics', 
//   'bar', 
//   { startDate: '2024-01-01', endDate: '2024-12-31', includeSampleData: true }
// );
//
// // Download as PDF
// await reportService.downloadReport(
//   'Waste Collection Analytics', 
//   'bar', 
//   'PDF', 
//   { startDate: '2024-01-01', endDate: '2024-12-31', includeSampleData: true }
// );