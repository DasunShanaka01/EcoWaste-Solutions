// Special Waste Analytics Frontend Integration
// This example shows how to use the SOLID-based Special Waste Analytics API

class SpecialWasteAnalyticsAPI {
  constructor() {
    this.baseUrl = 'http://localhost:8080/api/reports/solid';
  }

  /**
   * Get Special Waste Pie Chart (Category Distribution)
   * Shows distribution by categories: Garden, Bulky, E-Waste, Hazardous
   */
  async getSpecialWastePieChart(useSampleData = false, parameters = {}) {
    try {
      if (useSampleData) {
        // Get sample data (no parameters needed)
        const response = await fetch(`${this.baseUrl}/special-waste/sample/pie`);
        return await response.json();
      } else {
        // Get actual data from database
        const response = await fetch(`${this.baseUrl}/special-waste/actual/pie`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parameters)
        });
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching special waste pie chart:', error);
      throw error;
    }
  }

  /**
   * Get Special Waste Bar Chart (Individual Items)
   * Shows individual items with fees: Sofa ($65), Refrigerator ($85), etc.
   */
  async getSpecialWasteBarChart(useSampleData = false, parameters = {}) {
    try {
      if (useSampleData) {
        // Get sample data (no parameters needed)
        const response = await fetch(`${this.baseUrl}/special-waste/sample/bar`);
        return await response.json();
      } else {
        // Get actual data from database
        const response = await fetch(`${this.baseUrl}/special-waste/actual/bar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parameters)
        });
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching special waste bar chart:', error);
      throw error;
    }
  }

  /**
   * Download Special Waste Report
   */
  async downloadSpecialWasteReport(chartType, format, parameters) {
    try {
      const response = await fetch(
        `${this.baseUrl}/download/Special Waste Analytics/${chartType}/${format}`, {
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
      const filename = this.getFilenameFromResponse(response) || 
                      `special_waste_${chartType}_report.${format.toLowerCase()}`;
      
      // Create download
      const blob = await response.blob();
      this.downloadBlob(blob, filename);
      
      return { success: true, filename };
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  }

  // Helper methods
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

// React Component Example for Special Waste Analytics
const SpecialWasteAnalyticsDashboard = () => {
  const [api] = useState(new SpecialWasteAnalyticsAPI());
  const [pieChartData, setPieChartData] = useState(null);
  const [barChartData, setBarChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useSampleData, setUseSampleData] = useState(true);

  const loadPieChart = async () => {
    setLoading(true);
    try {
      const parameters = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        includeSampleData: useSampleData
      };

      const data = await api.getSpecialWastePieChart(useSampleData, parameters);
      setPieChartData(data);
    } catch (error) {
      console.error('Failed to load pie chart:', error);
      alert('Failed to load pie chart');
    } finally {
      setLoading(false);
    }
  };

  const loadBarChart = async () => {
    setLoading(true);
    try {
      const parameters = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        wasteType: '', // Empty for all categories, or specify 'Garden', 'Bulky', etc.
        includeSampleData: useSampleData
      };

      const data = await api.getSpecialWasteBarChart(useSampleData, parameters);
      setBarChartData(data);
    } catch (error) {
      console.error('Failed to load bar chart:', error);
      alert('Failed to load bar chart');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (chartType) => {
    setLoading(true);
    try {
      const parameters = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        includeSampleData: useSampleData
      };

      await api.downloadSpecialWasteReport(chartType, 'PDF', parameters);
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load sample data on component mount
    loadPieChart();
    loadBarChart();
  }, [useSampleData]);

  return (
    <div className="special-waste-analytics-dashboard">
      <h2>Special Waste Analytics Dashboard</h2>
      
      {/* Data Source Toggle */}
      <div className="data-source-toggle">
        <label>
          <input 
            type="checkbox" 
            checked={useSampleData}
            onChange={(e) => setUseSampleData(e.target.checked)}
          />
          Use Sample Data (uncheck to use actual database data)
        </label>
      </div>

      {/* Pie Chart Section */}
      <div className="chart-section">
        <h3>Category Distribution (Pie Chart)</h3>
        <p>Shows distribution of special waste by categories: Garden, Bulky, E-Waste, Hazardous</p>
        
        <div className="chart-actions">
          <button onClick={loadPieChart} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh Pie Chart'}
          </button>
          <button onClick={() => downloadReport('pie')} disabled={loading}>
            Download Pie Chart Report
          </button>
        </div>

        {pieChartData && (
          <div className="chart-preview">
            <h4>{pieChartData.title}</h4>
            <p>{pieChartData.description}</p>
            
            {/* Chart Data Display */}
            <div className="chart-data">
              <h5>Chart Data:</h5>
              {pieChartData.chartData.map((item, index) => (
                <div key={index} className="data-point">
                  <span 
                    className="color-indicator" 
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <strong>{item.label}</strong>: ${item.value.toFixed(2)} 
                  {item.period && <span> ({item.period})</span>}
                </div>
              ))}
            </div>

            {/* Statistics */}
            {pieChartData.statistics && (
              <div className="statistics">
                <h5>Statistics:</h5>
                {Object.entries(pieChartData.statistics).map(([key, value]) => (
                  <div key={key}>
                    <strong>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong> {value}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bar Chart Section */}
      <div className="chart-section">
        <h3>Individual Items (Bar Chart)</h3>
        <p>Shows individual special waste items with collection fees</p>
        
        <div className="chart-actions">
          <button onClick={loadBarChart} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh Bar Chart'}
          </button>
          <button onClick={() => downloadReport('bar')} disabled={loading}>
            Download Bar Chart Report
          </button>
        </div>

        {barChartData && (
          <div className="chart-preview">
            <h4>{barChartData.title}</h4>
            <p>{barChartData.description}</p>
            
            {/* Chart Data Display */}
            <div className="chart-data">
              <h5>Chart Data:</h5>
              {barChartData.chartData.slice(0, 10).map((item, index) => (
                <div key={index} className="data-point">
                  <span 
                    className="color-indicator" 
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <strong>{item.label}</strong>: ${item.value.toFixed(2)} 
                  <span className="category">({item.category})</span>
                  {item.period && <span> - {item.period}</span>}
                </div>
              ))}
              {barChartData.chartData.length > 10 && (
                <p>... and {barChartData.chartData.length - 10} more items</p>
              )}
            </div>

            {/* Statistics */}
            {barChartData.statistics && (
              <div className="statistics">
                <h5>Statistics:</h5>
                {Object.entries(barChartData.statistics).map(([key, value]) => (
                  <div key={key}>
                    <strong>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong> {value}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// CSS Styles (add to your CSS file)
const styles = `
.special-waste-analytics-dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.data-source-toggle {
  margin: 20px 0;
  padding: 10px;
  background-color: #f3f4f6;
  border-radius: 8px;
}

.chart-section {
  margin: 30px 0;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background-color: white;
}

.chart-actions {
  display: flex;
  gap: 10px;
  margin: 15px 0;
}

.chart-actions button {
  padding: 10px 20px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.chart-actions button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.chart-preview {
  margin-top: 20px;
  padding: 15px;
  background-color: #f9fafb;
  border-radius: 8px;
}

.chart-data {
  margin: 15px 0;
}

.data-point {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  margin-right: 10px;
  display: inline-block;
}

.category {
  color: #6b7280;
  font-size: 0.9em;
}

.statistics {
  margin: 15px 0;
  padding: 10px;
  background-color: white;
  border-radius: 6px;
}

.statistics div {
  margin: 5px 0;
}
`;

// Export components
export { SpecialWasteAnalyticsAPI, SpecialWasteAnalyticsDashboard };

// Usage example:
// import { SpecialWasteAnalyticsDashboard } from './SpecialWasteAnalytics';
// 
// function App() {
//   return (
//     <div>
//       <SpecialWasteAnalyticsDashboard />
//     </div>
//   );
// }