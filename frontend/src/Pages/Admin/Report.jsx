import React, { useState, useEffect } from 'react';

const Report = () => {
  const [activeTab, setActiveTab] = useState('configure');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [reportParameters, setReportParameters] = useState({
    dateRange: '',
    startDate: '',
    endDate: '',
    region: '',
    department: ''
  });
  const [selectedFormat, setSelectedFormat] = useState('PDF');
  const [reportPreview, setReportPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const reportCategories = {
    'Waste Collection Analytics': {
      icon: '📊',
      templates: [
        { name: 'Monthly Collection', description: 'Monthly waste collection analytics', icon: '📈' },
        { name: 'Collection by Region', description: 'Collection metrics by region', icon: '🏭' }
      ]
    },
    'Special Waste Analytics': {
      icon: '⚠️',
      templates: [
        { name: 'Hazardous Waste Report', description: 'Hazardous material handling and disposal', icon: '☢️' },
        { name: 'Electronic Waste Report', description: 'E-waste collection and recycling metrics', icon: '💻' }
      ]
    },
    'Financial Report  Analytics': {
      icon: '💰',
      templates: [
        { name: 'Cost Analysis', description: 'Financial cost breakdown and analysis', icon: '💳' },
        { name: 'Carbon Footprint Report', description: 'Environmental impact analysis', icon: '🌱' }
      ]
    },
    'Route Report Analytics': {
      icon: '⚙️',
      templates: [
        { name: 'Custom Template 1', description: 'Customizable report template', icon: '📋' },
        { name: 'Ad-hoc Analysis', description: 'One-time custom analysis', icon: '🔍' }
      ]
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    // Simplified for the new template-based design
    setLoading(false);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedTemplate('');
    setReportPreview(null);
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    if (selectedCategory === 'Waste Collection Analytics') {
      generateWasteCollectionPreview(template);
    } else {
      generatePreview(template);
    }
  };

  const generateWasteCollectionPreview = async (template) => {
    setLoading(true);
    try {
      const endpoint = template.name === 'Monthly Collection' 
        ? '/api/waste-collection-reports/preview/monthly-collection'
        : '/api/waste-collection-reports/preview/collection-by-region';
      
      const response = await fetch(`http://localhost:8080${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportParameters)
      });

      if (response.ok) {
        const previewData = await response.json();
        setReportPreview({
          title: previewData.title,
          data: previewData.data,
          summary: `Preview for ${template.name} - Generated based on current parameters`,
          chartData: generateChartDataFromResponse(previewData.data)
        });
      } else {
        // Fallback to mock data if API fails
        generatePreview(template);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      // Fallback to mock data
      generatePreview(template);
    } finally {
      setLoading(false);
    }
  };

  const generateChartDataFromResponse = (data) => {
    if (data && data.monthlyBreakdown) {
      return Object.entries(data.monthlyBreakdown).map(([month, count]) => ({
        period: month,
        value: count
      }));
    }
    return generateMockChartData();
  };

  const generatePreview = (template) => {
    setLoading(true);
    // Simulate preview generation
    setTimeout(() => {
      setReportPreview({
        title: template.name,
        chartData: generateMockChartData(),
        summary: `Preview for ${template.name} - This report shows waste collection volumes over time with key performance indicators.`
      });
      setLoading(false);
    }, 1000);
  };

  const generateMockChartData = () => {
    return Array.from({ length: 10 }, (_, i) => ({
      period: `Week ${i + 1}`,
      value: Math.floor(Math.random() * 100) + 20
    }));
  };

  const handleParameterChange = (param, value) => {
    setReportParameters(prev => ({
      ...prev,
      [param]: value
    }));
  };

  const generateReport = async () => {
    if (!selectedTemplate) {
      alert('Please select a template first');
      return;
    }

    // Validate date parameters
    if (reportParameters.dateRange === 'custom') {
      if (!reportParameters.startDate || !reportParameters.endDate) {
        alert('Please select both start and end dates for custom range');
        return;
      }
      if (new Date(reportParameters.startDate) > new Date(reportParameters.endDate)) {
        alert('Start date cannot be later than end date');
        return;
      }
    } else if (!reportParameters.dateRange && !reportParameters.startDate && !reportParameters.endDate) {
      alert('Please select a date range or specify custom dates');
      return;
    }

    if (selectedCategory === 'Waste Collection Analytics') {
      await generateWasteCollectionReport();
    } else {
      // For other categories, show simple alert for now
      console.log('Generating report with parameters:', reportParameters);
      alert(`Generating ${selectedTemplate.name} report`);
    }
  };

  const generateWasteCollectionReport = async () => {
    setLoading(true);
    try {
      const endpoint = selectedTemplate.name === 'Monthly Collection'
        ? '/api/waste-collection-reports/generate/monthly-collection'
        : '/api/waste-collection-reports/generate/collection-by-region';

      const requestBody = {
        parameters: reportParameters,
        generatedBy: 'Admin' // You can get this from user context
      };

      const response = await fetch(`http://localhost:8080${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const report = await response.json();
        alert(`Report generated successfully! Report ID: ${report.id}`);
        
        // Update preview with the generated report data
        setReportPreview({
          title: report.reportTitle,
          data: report.data,
          summary: `Report generated successfully on ${new Date().toLocaleString()}`,
          chartData: generateChartDataFromResponse(report.data),
          reportId: report.id
        });
      } else {
        alert('Failed to generate report. Please try again.');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (format) => {
    if (!reportPreview?.reportId) {
      // Generate and download immediately
      await generateAndDownloadReport(format);
    } else {
      // Download existing report
      await downloadExistingReport(reportPreview.reportId, format);
    }
  };

  const generateAndDownloadReport = async (format) => {
    if (!selectedTemplate) {
      alert('Please select a template first');
      return;
    }

    setLoading(true);
    try {
      const endpoint = selectedTemplate.name === 'Monthly Collection'
        ? '/api/waste-collection-reports/generate-and-download/monthly-collection'
        : '/api/waste-collection-reports/generate-and-download/collection-by-region';

      const requestBody = {
        parameters: reportParameters,
        generatedBy: 'Admin'
      };

      const response = await fetch(`http://localhost:8080${endpoint}?format=${format}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Get filename from response headers or generate one
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `waste_collection_report.${format.toLowerCase()}`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        alert(`Report downloaded successfully as ${filename}`);
      } else {
        alert('Failed to download report. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadExistingReport = async (reportId, format) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/waste-collection-reports/download/${reportId}?format=${format}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Get filename from response headers or generate one
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `report_${reportId}.${format.toLowerCase()}`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        alert(`Report downloaded successfully as ${filename}`);
      } else {
        alert('Failed to download report. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex space-x-8 px-6">
          {['Choose Template', 'Configure', 'Select Output Parameters', 'Preview Report', 'Send/Distribute'].map((tab, index) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase().replace(/[^a-z]/g, ''))}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === tab.toLowerCase().replace(/[^a-z]/g, '') || (index === 1 && activeTab === 'configure')
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left Sidebar - Report Categories */}
        <div className="w-1/4 bg-white border-r border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Categories</h3>
          <div className="space-y-2">
            {Object.entries(reportCategories).map(([category, details]) => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedCategory === category
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{details.icon}</span>
                  <span className="text-sm font-medium">{category}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Templates Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Templates</h3>
              {selectedCategory ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportCategories[selectedCategory]?.templates?.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => handleTemplateSelect(template)}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        selectedTemplate?.name === template.name
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{template.icon}</span>
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600">{template.description}</p>
                      {selectedTemplate?.name === template.name && (
                        <div className="mt-3">
                          <button className="bg-green-600 text-white px-3 py-1 rounded text-xs">
                            Select Template
                          </button>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Select a report category to view available templates</p>
                </div>
              )}
            </div>

            {/* Parameters Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Parameters</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <select
                    value={reportParameters.dateRange}
                    onChange={(e) => handleParameterChange('dateRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Range</option>
                    <option value="last-week">Last Week</option>
                    <option value="last-month">Last Month</option>
                    <option value="last-quarter">Last Quarter</option>
                    <option value="last-year">Last Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  
                  {/* Custom Date Range Inputs */}
                  {reportParameters.dateRange === 'custom' && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={reportParameters.startDate}
                          onChange={(e) => handleParameterChange('startDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          max={reportParameters.endDate || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          value={reportParameters.endDate}
                          onChange={(e) => handleParameterChange('endDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min={reportParameters.startDate}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Always show calendar inputs option */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Or select specific dates:</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                        <input
                          type="date"
                          value={reportParameters.startDate}
                          onChange={(e) => {
                            handleParameterChange('startDate', e.target.value);
                            if (e.target.value && reportParameters.endDate) {
                              handleParameterChange('dateRange', 'custom');
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          max={reportParameters.endDate || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                        <input
                          type="date"
                          value={reportParameters.endDate}
                          onChange={(e) => {
                            handleParameterChange('endDate', e.target.value);
                            if (reportParameters.startDate && e.target.value) {
                              handleParameterChange('dateRange', 'custom');
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          min={reportParameters.startDate}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                    {reportParameters.startDate && reportParameters.endDate && (
                      <div className="mt-2 text-sm text-green-600">
                        📅 Selected period: {new Date(reportParameters.startDate).toLocaleDateString()} to {new Date(reportParameters.endDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                  <select
                    value={reportParameters.region}
                    onChange={(e) => handleParameterChange('region', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Districts</option>
                    {/* Western Province */}
                    <option value="colombo">Colombo</option>
                    <option value="gampaha">Gampaha</option>
                    <option value="kalutara">Kalutara</option>
                    {/* Central Province */}
                    <option value="kandy">Kandy</option>
                    <option value="matale">Matale</option>
                    <option value="nuwara-eliya">Nuwara Eliya</option>
                    {/* Southern Province */}
                    <option value="galle">Galle</option>
                    <option value="matara">Matara</option>
                    <option value="hambantota">Hambantota</option>
                    {/* Northern Province */}
                    <option value="jaffna">Jaffna</option>
                    <option value="kilinochchi">Kilinochchi</option>
                    <option value="mannar">Mannar</option>
                    <option value="mullaitivu">Mullaitivu</option>
                    <option value="vavuniya">Vavuniya</option>
                    {/* Eastern Province */}
                    <option value="batticaloa">Batticaloa</option>
                    <option value="ampara">Ampara</option>
                    <option value="trincomalee">Trincomalee</option>
                    {/* North Western Province */}
                    <option value="kurunegala">Kurunegala</option>
                    <option value="puttalam">Puttalam</option>
                    {/* North Central Province */}
                    <option value="anuradhapura">Anuradhapura</option>
                    <option value="polonnaruwa">Polonnaruwa</option>
                    {/* Uva Province */}
                    <option value="badulla">Badulla</option>
                    <option value="monaragala">Monaragala</option>
                    {/* Sabaragamuwa Province */}
                    <option value="ratnapura">Ratnapura</option>
                    <option value="kegalle">Kegalle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Waste Category</label>
                  <select
                    value={reportParameters.department}
                    onChange={(e) => handleParameterChange('department', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    <option value="general-waste">General Waste</option>
                    <option value="recyclable">Recyclable</option>
                    <option value="organic">Organic</option>
                    <option value="hazardous">Hazardous</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    onClick={generateReport}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition duration-200"
                  >
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Report Preview Section */}
          {(selectedTemplate || reportPreview) && (
            <div className="mt-8">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg overflow-hidden">
                {/* Preview Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 rounded-lg p-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Report Preview</h3>
                        <p className="text-blue-100 text-sm">Real-time analytics dashboard</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-white/20 rounded-lg px-3 py-1">
                        <span className="text-white text-sm font-medium">Live Data</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                {loading ? (
                  <div className="flex flex-col justify-center items-center h-80 bg-white">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 opacity-20 animate-pulse"></div>
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-lg font-medium text-gray-700">Generating Report...</p>
                      <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
                    </div>
                  </div>
                ) : reportPreview ? (
                  <div className="bg-white">
                    {/* Report Header Info */}
                    <div className="px-6 py-5 border-b border-gray-100">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <h4 className="text-2xl font-bold text-gray-900">{reportPreview.title}</h4>
                          </div>
                          <p className="text-gray-600 text-lg leading-relaxed">{reportPreview.summary}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Generated: {new Date().toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {new Date().toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        
                        {/* Export Section */}
                        <div className="lg:min-w-[280px]">
                          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
                            <div className="text-center mb-4">
                              <h5 className="text-lg font-semibold text-gray-800 mb-1">Export Report</h5>
                              <p className="text-sm text-gray-600">Choose your preferred format</p>
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Output Format</label>
                                <div className="grid grid-cols-3 gap-2">
                                  {[
                                    { format: 'PDF', icon: '📄', color: 'red' },
                                    { format: 'Excel', icon: '📊', color: 'green' },
                                    { format: 'CSV', icon: '📋', color: 'blue' }
                                  ].map(({ format, icon, color }) => (
                                    <button
                                      key={format}
                                      onClick={() => setSelectedFormat(format)}
                                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all duration-200 ${
                                        selectedFormat === format
                                          ? `border-${color}-500 bg-${color}-50 text-${color}-700 shadow-md scale-105`
                                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:shadow-sm'
                                      }`}
                                    >
                                      <span className="text-lg">{icon}</span>
                                      <span className="text-xs font-medium">{format}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              
                              <button
                                onClick={() => downloadReport(selectedFormat)}
                                disabled={loading || !selectedFormat}
                                className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                              >
                                {loading ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download {selectedFormat}
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Analytics Summary Cards */}
                    {selectedCategory === 'Waste Collection Analytics' && reportPreview.data && (
                      <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Key Metrics Overview
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white rounded-xl p-5 shadow-md border border-blue-100 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <div className="bg-blue-100 rounded-lg p-2">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                              </div>
                              <span className="text-sm text-blue-600 font-medium">Total</span>
                            </div>
                            <h6 className="font-semibold text-gray-700 mb-1">Collections</h6>
                            <p className="text-3xl font-bold text-blue-700">{reportPreview.data.totalCollections || 0}</p>
                            <p className="text-sm text-gray-500 mt-1">Collection entries</p>
                          </div>
                          
                          <div className="bg-white rounded-xl p-5 shadow-md border border-green-100 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <div className="bg-green-100 rounded-lg p-2">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l3-1m-3 1l-3-1" />
                                </svg>
                              </div>
                              <span className="text-sm text-green-600 font-medium">Weight</span>
                            </div>
                            <h6 className="font-semibold text-gray-700 mb-1">Total Weight</h6>
                            <p className="text-3xl font-bold text-green-700">{reportPreview.data.totalWeight?.toFixed(2) || 0}</p>
                            <p className="text-sm text-gray-500 mt-1">Kilograms</p>
                          </div>
                          
                          <div className="bg-white rounded-xl p-5 shadow-md border border-purple-100 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <div className="bg-purple-100 rounded-lg p-2">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="text-sm text-purple-600 font-medium">Revenue</span>
                            </div>
                            <h6 className="font-semibold text-gray-700 mb-1">Total Payback</h6>
                            <p className="text-3xl font-bold text-purple-700">${reportPreview.data.totalPayback?.toFixed(2) || 0}</p>
                            <p className="text-sm text-gray-500 mt-1">USD earned</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Chart Visualization */}
                    <div className="px-6 py-5 border-t border-gray-100">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-5 py-4 border-b border-gray-200">
                          <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {selectedTemplate?.name === 'Monthly Collection' ? 'Monthly Collection Trend' : 'Collection Volume Analysis'}
                          </h5>
                          <p className="text-sm text-gray-600 mt-1">Visual representation of collection data</p>
                        </div>
                        
                        <div className="p-5">
                          <div className="relative h-48 bg-gradient-to-t from-gray-50 to-white rounded-lg border border-gray-100">
                            <div className="flex items-end justify-around h-full p-4">
                              {reportPreview.chartData.slice(0, 8).map((item, index) => {
                                const maxValue = Math.max(...reportPreview.chartData.map(d => d.value));
                                const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                                return (
                                  <div key={index} className="flex flex-col items-center group">
                                    <div className="relative mb-2">
                                      <div
                                        className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg min-w-[24px] transition-all duration-300 group-hover:from-blue-700 group-hover:to-blue-500 shadow-sm"
                                        style={{ height: `${Math.max(height, 5)}%` }}
                                      ></div>
                                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                        {item.value}
                                      </div>
                                    </div>
                                    <span className="text-xs text-gray-600 text-center leading-tight max-w-[60px] transform group-hover:text-blue-600 transition-colors">
                                      {item.period.length > 8 ? item.period.substring(0, 8) + '...' : item.period}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* Chart Grid Lines */}
                            <div className="absolute inset-0 pointer-events-none">
                              {[0, 25, 50, 75, 100].map((line) => (
                                <div
                                  key={line}
                                  className="absolute left-0 right-0 border-t border-gray-200"
                                  style={{ bottom: `${line}%` }}
                                ></div>
                              ))}
                            </div>
                            
                            {/* Y-axis labels */}
                            <div className="absolute left-0 top-0 bottom-0 -ml-12 flex flex-col justify-between text-xs text-gray-500 py-4">
                              <span>{Math.max(...reportPreview.chartData.map(d => d.value))}</span>
                              <span>{Math.round(Math.max(...reportPreview.chartData.map(d => d.value)) * 0.75)}</span>
                              <span>{Math.round(Math.max(...reportPreview.chartData.map(d => d.value)) * 0.5)}</span>
                              <span>{Math.round(Math.max(...reportPreview.chartData.map(d => d.value)) * 0.25)}</span>
                              <span>0</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Analytics Section */}
                    {selectedCategory === 'Waste Collection Analytics' && reportPreview.data && (
                      <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          
                          {/* Status Breakdown */}
                          {reportPreview.data.statusBreakdown && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-4 border-b border-gray-200">
                                <h6 className="font-semibold text-gray-800 flex items-center gap-2">
                                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Status Distribution
                                </h6>
                                <p className="text-sm text-gray-600 mt-1">Collection status breakdown</p>
                              </div>
                              <div className="p-5">
                                <div className="space-y-3">
                                  {Object.entries(reportPreview.data.statusBreakdown).map(([status, count]) => {
                                    const total = Object.values(reportPreview.data.statusBreakdown).reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                                    const statusColors = {
                                      'Completed': 'bg-green-500',
                                      'Pending': 'bg-yellow-500',
                                      'Processing': 'bg-blue-500',
                                      'Cancelled': 'bg-red-500'
                                    };
                                    return (
                                      <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                          <div className={`w-3 h-3 rounded-full ${statusColors[status] || 'bg-gray-500'}`}></div>
                                          <span className="font-medium text-gray-700">{status}</span>
                                        </div>
                                        <div className="text-right">
                                          <span className="font-bold text-gray-900">{count}</span>
                                          <span className="text-sm text-gray-500 ml-2">({percentage}%)</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Recent Collections */}
                          {reportPreview.data.recentCollections && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-4 border-b border-gray-200">
                                <h6 className="font-semibold text-gray-800 flex items-center gap-2">
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Recent Activity
                                </h6>
                                <p className="text-sm text-gray-600 mt-1">Latest collection entries</p>
                              </div>
                              <div className="p-5">
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                  {reportPreview.data.recentCollections.slice(0, 5).map((collection, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                          {collection.fullName?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {collection.fullName}
                                          </p>
                                          <p className="text-sm text-gray-500">{collection.status}</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-semibold text-gray-900">{collection.totalWeight} kg</p>
                                        <p className="text-sm font-medium text-green-600">${collection.totalPayback}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Additional Actions */}
                    {reportPreview.reportId && (
                      <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <h6 className="font-semibold text-gray-800 mb-1">Quick Actions</h6>
                            <p className="text-sm text-gray-600">Additional report operations</p>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <button className="flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 7.89a2 2 0 002.83 0L21 9M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Email Report
                            </button>
                            <button className="flex items-center gap-2 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                              </svg>
                              Share
                            </button>
                            <button className="flex items-center gap-2 bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                              Print
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white py-16">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Report Preview</h4>
                      <p className="text-gray-500 mb-6">Select a template and generate a report to see the preview</p>
                      <div className="flex justify-center">
                        <div className="bg-blue-50 rounded-lg p-4 max-w-md">
                          <p className="text-sm text-blue-800">
                            💡 <strong>Tip:</strong> Choose your parameters above and click "Generate Report" to see detailed analytics and visualization here.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
     
    </div>
  );
};

export default Report;
