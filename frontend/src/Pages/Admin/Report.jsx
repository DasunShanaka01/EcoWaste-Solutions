import React, { useState, useEffect } from 'react';

const Report = () => {
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
  const [selectedFormat, setSelectedFormat] = useState('TXT');
  const [reportPreview, setReportPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState('actual'); // 'actual' or 'sample'

  // Get current data based on preview mode
  const currentData = reportPreview && previewMode === 'sample' ? reportPreview.sampleData : reportPreview?.actualData;

  const reportCategories = {
    'Waste Collection Analytics': {
      icon: '📊',
      templates: [
        { name: 'Bar Chart Analysis', description: 'Daily waste collection amounts with date axis', icon: '📊', chartType: 'bar' },
        { name: 'Pie Chart Analysis', description: 'Waste type distribution in pie chart format', icon: '🥧', chartType: 'pie' },
        { name: 'Donut Chart Report', description: 'Waste categories shown as donut chart', icon: '🍩', chartType: 'donut' }
      ]
    },
    'Special Waste Analytics': {
      icon: '⚠️',
      templates: [
        { name: 'Special Waste Pie Chart', description: 'Waste type distribution by collection date', icon: '🥧', chartType: 'pie' },
        { name: 'Special Waste Bar Chart', description: 'Daily special waste collection amounts over time', icon: '📊', chartType: 'bar' }
      ]
    },
    'Financial Report  Analytics': {
      icon: '💰',
      templates: [
        { name: 'Payment Analysis', description: 'Payment processing and transaction analysis', icon: '💳', chartType: 'bar' },
        { name: 'Payback Report', description: 'Waste collection payback and rewards analysis', icon: '💵', chartType: 'pie' }
      ]
    },
    'Route Report Analytics': {
      icon: '⚙️',
      templates: [
        { name: 'Route Map View', description: 'Collection routes displayed on interactive map', icon: '�️', chartType: 'map' },
        { name: 'Normal Route View', description: 'Collection routes shown as connection list', icon: '�', chartType: 'list' }
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
    } else if (selectedCategory === 'Special Waste Analytics') {
      generateSpecialWastePreview(template);
    } else {
      generatePreview(template);
    }
  };

  const generatePreviewData = (template, mode = 'actual') => {
    // Generate preview based on chart type and mode
    let previewData;
    
    switch (template.chartType) {
      case 'bar':
        previewData = mode === 'sample' ? generateSampleBarChartData() : generateBarChartData();
        break;
      case 'pie':
        previewData = mode === 'sample' ? generateSamplePieChartData() : generatePieChartData();
        break;

      case 'donut':
        previewData = mode === 'sample' ? generateSampleDonutChartData() : generateDonutChartData();
        break;

      case 'map':
        previewData = mode === 'sample' ? generateSampleMapViewData() : generateMapViewData();
        break;
      case 'list':
        previewData = mode === 'sample' ? generateSampleListViewData() : generateListViewData();
        break;
      default:
        previewData = mode === 'sample' ? generateSampleBarChartData() : generateBarChartData();
    }

    return previewData;
  };

  const generateWasteCollectionPreview = async (template) => {
    setLoading(true);
    try {
      // Generate both actual and sample data
      const actualData = generatePreviewData(template, 'actual');
      const sampleData = generatePreviewData(template, 'sample');

      setReportPreview({
        title: template.name,
        chartType: template.chartType,
        actualData: {
          data: actualData.data,
          chartData: actualData.chartData,
          stats: actualData.stats,
          description: actualData.description
        },
        sampleData: {
          data: sampleData.data,
          chartData: sampleData.chartData,
          stats: sampleData.stats,
          description: sampleData.description
        },
        summary: `Preview for ${template.name} - Toggle between actual and sample data to see chart variations`
      });
    } catch (error) {
      console.error('Error generating preview:', error);
      // Fallback to basic preview
      generatePreview(template);
    } finally {
      setLoading(false);
    }
  };

  const generateSpecialWastePreview = async (template) => {
    setLoading(true);
    try {
      // Fetch actual data from Special Waste Analytics API
      const actualResponse = await fetch(`http://localhost:8080/api/reports/solid/generate/Special Waste Analytics/${template.chartType}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: reportParameters.startDate || '2024-01-01',
          endDate: reportParameters.endDate || '2024-12-31',
          format: 'JSON',
          includeSampleData: false
        })
      });

      let actualData;
      if (actualResponse.ok) {
        const apiResult = await actualResponse.json();
        actualData = {
          chartData: apiResult.chartData.map(item => ({
            period: item.label,
            value: item.value,
            color: item.color || (template.chartType === 'pie' ? getPieChartColor(item.label) : getBarChartColor())
          })),
          data: {
            totalItems: apiResult.chartData.length,
            totalQuantity: apiResult.chartData.reduce((sum, item) => sum + (item.value || 0), 0),
            categories: apiResult.chartData.map(item => item.label)
          },
          stats: {
            totalCategories: apiResult.chartData.length,
            totalQuantity: `${apiResult.chartData.reduce((sum, item) => sum + (item.value || 0), 0).toFixed(1)} kg`,
            largestCategory: apiResult.chartData.reduce((max, item) => item.value > max.value ? item : max, apiResult.chartData[0])?.label || 'N/A'
          },
          description: template.chartType === 'pie' 
            ? 'Special waste collection by category showing quantity distribution'
            : 'Special waste quantities by category from database'
        };
      } else {
        // Fallback to sample data if API fails
        actualData = template.chartType === 'pie' ? generateSpecialWastePieSampleData() : generateSpecialWasteBarSampleData();
      }

      // Generate sample data
      const sampleData = template.chartType === 'pie' ? generateSpecialWastePieSampleData() : generateSpecialWasteBarSampleData();

      setReportPreview({
        title: template.name,
        chartType: template.chartType,
        actualData: actualData,
        sampleData: sampleData,
        summary: `Preview for ${template.name} - Showing actual special waste data from database`
      });
    } catch (error) {
      console.error('Error generating special waste preview:', error);
      // Fallback to sample data
      const sampleData = template.chartType === 'pie' ? generateSpecialWastePieSampleData() : generateSpecialWasteBarSampleData();
      setReportPreview({
        title: template.name,
        chartType: template.chartType,
        actualData: sampleData,
        sampleData: sampleData,
        summary: `Preview for ${template.name} - Using sample data (API unavailable)`
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for Special Waste Analytics
  const getPieChartColor = (category) => {
    const colorMap = {
      'Bulky': '#3b82f6',     // Blue
      'Hazardous': '#ef4444', // Red
      'Organic': '#22c55e',   // Green
      'E-Waste': '#8b5cf6',   // Purple
      'Recyclable': '#06b6d4', // Cyan
      'Other': '#f59e0b'      // Amber
    };
    return colorMap[category] || '#6b7280';
  };

  const getBarChartColor = () => '#3b82f6';

  const generateSpecialWastePieSampleData = () => {
    return {
      chartData: [
        { period: 'Organic', value: 45.5, color: '#22c55e' },
        { period: 'Bulky', value: 78.2, color: '#3b82f6' },
        { period: 'E-Waste', value: 23.8, color: '#8b5cf6' },
        { period: 'Hazardous', value: 12.3, color: '#ef4444' },
        { period: 'Recyclable', value: 56.7, color: '#06b6d4' },
        { period: 'Other', value: 18.9, color: '#f59e0b' }
      ],
      data: {
        totalCategories: 6,
        totalQuantity: 235.4,
        categories: ['Organic', 'Bulky', 'E-Waste', 'Hazardous', 'Recyclable', 'Other']
      },
      stats: {
        totalCategories: 6,
        totalQuantity: '235.4 kg',
        largestCategory: 'Bulky'
      },
      description: 'Special waste collection by category showing quantity distribution'
    };
  };

  const generateSpecialWasteBarSampleData = () => {
    return {
      chartData: [
        { period: 'Bulky', value: 78.2, color: '#3b82f6' },
        { period: 'E-Waste', value: 23.8, color: '#8b5cf6' },
        { period: 'Hazardous', value: 12.3, color: '#ef4444' },
        { period: 'Organic', value: 45.5, color: '#22c55e' },
        { period: 'Other', value: 18.9, color: '#f59e0b' },
        { period: 'Recyclable', value: 56.7, color: '#06b6d4' }
      ],
      data: {
        totalCategories: 6,
        totalQuantity: 235.4,
        categories: ['Bulky', 'E-Waste', 'Hazardous', 'Organic', 'Other', 'Recyclable']
      },
      stats: {
        totalCategories: 6,
        totalQuantity: '235.4 kg',
        averageQuantity: '39.2 kg'
      },
      description: 'Special waste quantities by category showing collection amounts'
    };
  };

  // Chart data generators for different chart types
  const generateBarChartData = () => {
    const data = [
      { category: 'Organic Waste', value: 45, color: '#22c55e' },
      { category: 'Recyclables', value: 30, color: '#3b82f6' },
      { category: 'Hazardous', value: 15, color: '#ef4444' },
      { category: 'Other', value: 10, color: '#f59e0b' }
    ];
    
    return {
      chartData: data,
      data: data,
      description: 'Bar chart showing waste collection by category with comparative volumes',
      stats: {
        totalWaste: '2,450 kg',
        categories: 4,
        peakCategory: 'Organic Waste'
      }
    };
  };

  const generatePieChartData = () => {
    const data = [
      { name: 'Residential', value: 40, color: '#8b5cf6' },
      { name: 'Commercial', value: 35, color: '#06b6d4' },
      { name: 'Industrial', value: 20, color: '#f59e0b' },
      { name: 'Municipal', value: 5, color: '#ec4899' }
    ];
    
    return {
      chartData: data,
      data: data,
      description: 'Pie chart displaying waste collection distribution by source type',
      stats: {
        totalSources: 4,
        largestSource: 'Residential (40%)',
        collectionPoints: 156
      }
    };
  };



  const generateDonutChartData = () => {
    const data = [
      { name: 'Collected', value: 85, color: '#10b981' },
      { name: 'Pending', value: 10, color: '#f59e0b' },
      { name: 'Failed', value: 5, color: '#ef4444' }
    ];
    
    return {
      chartData: data,
      data: data,
      description: 'Donut chart showing collection efficiency and status distribution',
      stats: {
        efficiency: '85%',
        pendingCollections: 24,
        completedToday: 127
      }
    };
  };

  // Sample chart data generators with rich dummy data
  const generateSampleBarChartData = () => {
    // Generate last 7 days data with dates and waste amounts
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.floor(Math.random() * 500) + 800 + (i * 20), // Random waste amounts in kg
        color: '#3b82f6'
      });
    }
    
    return {
      chartData: data,
      data: {
        statusBreakdown: {
          'Completed': 234,
          'Pending': 45,
          'Processing': 32,
          'Cancelled': 8
        },
        recentCollections: [
          { fullName: 'John Doe', status: 'Completed', totalWeight: 45.2, totalPayback: 12.50 },
          { fullName: 'Jane Smith', status: 'Processing', totalWeight: 32.8, totalPayback: 8.75 },
          { fullName: 'Mike Johnson', status: 'Completed', totalWeight: 67.3, totalPayback: 18.20 },
          { fullName: 'Sarah Wilson', status: 'Pending', totalWeight: 28.5, totalPayback: 7.60 },
          { fullName: 'David Brown', status: 'Completed', totalWeight: 55.9, totalPayback: 15.40 }
        ]
      },
      description: 'Daily waste collection amounts showing trend over the past week',
      stats: {
        totalWaste: data.reduce((sum, item) => sum + item.value, 0).toFixed(0) + ' kg',
        avgDaily: (data.reduce((sum, item) => sum + item.value, 0) / data.length).toFixed(0) + ' kg',
        peakDay: data.reduce((max, item) => item.value > max.value ? item : max).period,
        trend: 'Increasing'
      }
    };
  };

  const generateSamplePieChartData = () => {
    const data = [
      { period: 'Organic Waste', value: 1250, color: '#22c55e' },
      { period: 'Plastic', value: 890, color: '#3b82f6' },
      { period: 'Paper', value: 720, color: '#f59e0b' },
      { period: 'Glass', value: 420, color: '#8b5cf6' },
      { period: 'Metal', value: 380, color: '#ef4444' },
      { period: 'E-Waste', value: 180, color: '#7c3aed' },
      { period: 'Hazardous', value: 145, color: '#dc2626' }
    ];
    
    return {
      chartData: data,
      data: {
        statusBreakdown: {
          'Completed': 186,
          'Pending': 34,
          'Processing': 28,
          'Cancelled': 5
        },
        recentCollections: [
          { fullName: 'Green Valley School', status: 'Completed', totalWeight: 125.7, totalPayback: 35.20 },
          { fullName: 'City Mall Complex', status: 'Processing', totalWeight: 89.4, totalPayback: 24.80 },
          { fullName: 'Residential Block A', status: 'Completed', totalWeight: 203.6, totalPayback: 56.70 },
          { fullName: 'Tech Industries Ltd', status: 'Pending', totalWeight: 67.8, totalPayback: 18.90 },
          { fullName: 'Municipal Office', status: 'Completed', totalWeight: 45.2, totalPayback: 12.60 }
        ]
      },
      description: 'Waste type distribution showing different categories of collected waste',
      stats: {
        totalTypes: 7,
        largestType: 'Organic Waste (31.2%)',
        totalWeight: data.reduce((sum, item) => sum + item.value, 0).toFixed(0) + ' kg',
        categories: 'Mixed waste types'
      }
    };
  };



  const generateSampleDonutChartData = () => {
    const data = [
      { period: 'Recyclable', value: 1450, color: '#10b981' },
      { period: 'Organic', value: 1250, color: '#22c55e' },
      { period: 'Non-Recyclable', value: 890, color: '#ef4444' },
      { period: 'Hazardous', value: 320, color: '#dc2626' },
      { period: 'E-Waste', value: 180, color: '#7c3aed' }
    ];
    
    return {
      chartData: data,
      data: {
        statusBreakdown: {
          'Completed': 312,
          'Pending': 28,
          'Processing': 48,
          'Cancelled': 12
        },
        recentCollections: [
          { fullName: 'Frank Wilson', status: 'Completed', totalWeight: 167.2, totalPayback: 46.50 },
          { fullName: 'Grace Kim', status: 'Processing', totalWeight: 98.7, totalPayback: 27.40 },
          { fullName: 'Henry Garcia', status: 'Completed', totalWeight: 234.1, totalPayback: 65.20 },
          { fullName: 'Iris Johnson', status: 'Pending', totalWeight: 87.3, totalPayback: 24.30 },
          { fullName: 'Jack Rodriguez', status: 'Completed', totalWeight: 145.6, totalPayback: 40.50 }
        ]
      },
      description: 'Waste category breakdown showing recyclable vs non-recyclable distribution',
      stats: {
        recyclablePercent: '65.4%',
        totalWeight: data.reduce((sum, item) => sum + item.value, 0).toFixed(0) + ' kg',
        topCategory: 'Recyclable Materials',
        sustainabilityScore: '78/100'
      }
    };
  };



  const generateSampleMapViewData = () => {
    const data = [
      { id: 1, route: 'Downtown Circuit', status: 'Active', collections: 23, efficiency: '92%', coordinates: [40.7128, -74.0060] },
      { id: 2, route: 'Residential North', status: 'Active', collections: 18, efficiency: '88%', coordinates: [40.7589, -73.9851] },
      { id: 3, route: 'Industrial Zone', status: 'Completed', collections: 12, efficiency: '95%', coordinates: [40.6892, -74.0445] },
      { id: 4, route: 'Commercial District', status: 'In Progress', collections: 15, efficiency: '85%', coordinates: [40.7505, -73.9934] },
      { id: 5, route: 'University Area', status: 'Pending', collections: 8, efficiency: '90%', coordinates: [40.7282, -73.9942] },
      { id: 6, route: 'Suburban East', status: 'Active', collections: 20, efficiency: '87%', coordinates: [40.7410, -73.9896] }
    ];
    
    return {
      chartData: data,
      data: data,
      description: 'Sample map view showing comprehensive collection routes with real-time status and efficiency metrics',
      stats: {
        totalRoutes: 6,
        activeRoutes: 3,
        avgEfficiency: '89.5%',
        totalCollections: 96
      }
    };
  };

  const generateSampleListViewData = () => {
    const data = [
      { id: 1, route: 'Route A-Downtown', driver: 'John Smith', vehicle: 'WC-001', status: 'Active', progress: '75%', eta: '2:30 PM', collections: 23 },
      { id: 2, route: 'Route B-Residential', driver: 'Maria Garcia', vehicle: 'WC-002', status: 'Active', progress: '60%', eta: '3:15 PM', collections: 18 },
      { id: 3, route: 'Route C-Industrial', driver: 'David Johnson', vehicle: 'WC-003', status: 'Completed', progress: '100%', eta: 'Completed', collections: 12 },
      { id: 4, route: 'Route D-Commercial', driver: 'Sarah Wilson', vehicle: 'WC-004', status: 'In Progress', progress: '45%', eta: '4:00 PM', collections: 15 },
      { id: 5, route: 'Route E-University', driver: 'Mike Brown', vehicle: 'WC-005', status: 'Pending', progress: '0%', eta: '5:00 PM', collections: 8 },
      { id: 6, route: 'Route F-Suburban', driver: 'Lisa Davis', vehicle: 'WC-006', status: 'Active', progress: '80%', eta: '2:45 PM', collections: 20 }
    ];
    
    return {
      chartData: data,
      data: data,
      description: 'Sample list view displaying detailed collection routes with driver information and real-time progress',
      stats: {
        totalRoutes: 6,
        activeRoutes: 3,
        completedToday: 1,
        avgProgress: '60%'
      }
    };
  };

  const generateMapViewData = () => {
    const routeData = [
      { id: 1, name: 'Route A', startPoint: 'Colombo Central', endPoint: 'Galle Face', stops: 8, distance: '12.5 km', coordinates: [{ lat: 6.9271, lng: 79.8612 }, { lat: 6.9344, lng: 79.8428 }] },
      { id: 2, name: 'Route B', startPoint: 'Kandy City', endPoint: 'Peradeniya', stops: 5, distance: '8.3 km', coordinates: [{ lat: 7.2906, lng: 80.6337 }, { lat: 7.2599, lng: 80.5977 }] },
      { id: 3, name: 'Route C', startPoint: 'Gampaha', endPoint: 'Negombo', stops: 12, distance: '15.2 km', coordinates: [{ lat: 7.0873, lng: 80.0514 }, { lat: 7.2084, lng: 79.8380 }] },
      { id: 4, name: 'Route D', startPoint: 'Matara', endPoint: 'Galle', stops: 6, distance: '22.1 km', coordinates: [{ lat: 5.9549, lng: 80.5550 }, { lat: 6.0535, lng: 80.2210 }] }
    ];
    
    return {
      chartData: routeData,
      data: {
        routes: routeData,
        mapCenter: { lat: 7.0000, lng: 80.0000 },
        totalRoutes: routeData.length,
        totalDistance: routeData.reduce((sum, route) => sum + parseFloat(route.distance), 0).toFixed(1) + ' km',
        totalStops: routeData.reduce((sum, route) => sum + route.stops, 0)
      },
      description: 'Interactive map view showing collection routes with GPS coordinates and stops',
      stats: {
        activeRoutes: routeData.length,
        totalDistance: routeData.reduce((sum, route) => sum + parseFloat(route.distance), 0).toFixed(1) + ' km',
        averageStops: Math.round(routeData.reduce((sum, route) => sum + route.stops, 0) / routeData.length)
      }
    };
  };

  const generateListViewData = () => {
    const connectionData = [
      { id: 1, from: 'Waste Collection Point A', to: 'Processing Center 1', status: 'Active', duration: '15 mins', priority: 'High' },
      { id: 2, from: 'Waste Collection Point B', to: 'Recycling Facility', status: 'Active', duration: '22 mins', priority: 'Medium' },
      { id: 3, from: 'Special Waste Center', to: 'Hazardous Treatment Plant', status: 'Scheduled', duration: '35 mins', priority: 'High' },
      { id: 4, from: 'Residential Area 1', to: 'Local Depot', status: 'Completed', duration: '8 mins', priority: 'Low' },
      { id: 5, from: 'Commercial District', to: 'Main Processing Hub', status: 'Active', duration: '18 mins', priority: 'Medium' },
      { id: 6, from: 'Industrial Zone', to: 'Specialized Treatment', status: 'Pending', duration: '45 mins', priority: 'High' }
    ];
    
    return {
      chartData: connectionData,
      data: {
        connections: connectionData,
        statusBreakdown: {
          'Active': connectionData.filter(c => c.status === 'Active').length,
          'Scheduled': connectionData.filter(c => c.status === 'Scheduled').length,
          'Completed': connectionData.filter(c => c.status === 'Completed').length,
          'Pending': connectionData.filter(c => c.status === 'Pending').length
        },
        recentCollections: connectionData.slice(0, 5)
      },
      description: 'Normal route view displaying collection connections as organized list with status tracking',
      stats: {
        totalConnections: connectionData.length,
        activeRoutes: connectionData.filter(c => c.status === 'Active').length,
        averageDuration: '23 mins'
      }
    };
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
    
    // Generate both actual (mock) and sample data
    let sampleData;
    switch (template.chartType) {
      case 'bar':
        sampleData = generateSampleBarChartData();
        break;
      case 'pie':
        sampleData = generateSamplePieChartData();
        break;
      case 'donut':
        sampleData = generateSampleDonutChartData();
        break;
      default:
        sampleData = generateSampleBarChartData();
    }

    // Simulate preview generation
    setTimeout(() => {
      setReportPreview({
        title: template.name,
        summary: `Preview for ${template.name} - This report shows waste collection data with comprehensive analytics.`,
        data: {
          totalCollections: 319,
          totalWeight: 4567.8,
          totalPayback: 1256.45
        },
        actualData: {
          chartData: generateMockChartData(),
          data: {
            statusBreakdown: {
              'Completed': 45,
              'Pending': 12,
              'Processing': 8,
              'Cancelled': 2
            },
            recentCollections: [
              { fullName: 'Loading...', status: 'Pending', totalWeight: 0, totalPayback: 0 }
            ]
          },
          description: 'Loading actual data from backend...'
        },
        sampleData: sampleData
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
    } else if (selectedCategory === 'Special Waste Analytics') {
      await generateSpecialWasteReport();
    } else {
      // For other categories, show simple alert for now
      console.log('Generating report with parameters:', reportParameters);
      alert(`Generating ${selectedTemplate.name} report`);
    }
  };

  const generateWasteCollectionReport = async () => {
    setLoading(true);
    try {
      // Use chartType to determine endpoint instead of hardcoded names
      const chartType = selectedTemplate.chartType || 'bar';
      const endpoint = `/api/reports/solid/generate/Waste Collection Analytics/${chartType}`;

      const requestBody = {
        startDate: reportParameters.startDate || '2024-01-01',
        endDate: reportParameters.endDate || '2024-12-31',
        format: selectedFormat || 'JSON',
        includeSampleData: false // Use real data if available
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
        console.log('Report response:', report);
        alert(`Report generated successfully! Report ID: ${report.reportId}`);
        
        // Update preview with the generated report data
        setReportPreview({
          title: report.title,
          chartType: report.chartType,
          reportId: report.reportId,
          description: report.description,
          data: report.chartData,
          summary: `Report generated successfully on ${new Date().toLocaleString()}`,
          chartData: report.chartData || generateChartDataFromResponse(report.chartData),
          stats: report.statistics
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

  const generateSpecialWasteReport = async () => {
    setLoading(true);
    try {
      const chartType = selectedTemplate.chartType || 'pie';

      const requestBody = {
        startDate: reportParameters.startDate || '2024-01-01',
        endDate: reportParameters.endDate || '2024-12-31',
        format: selectedFormat || 'JSON',
        includeSampleData: false // Use real data from database
      };

      const endpoint = `/api/reports/solid/generate/Special Waste Analytics/${chartType}`;
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
        console.log('Special waste report response:', report);
        alert(`Special waste report generated successfully!`);
        
        // Update preview with the generated report data
        const chartData = report.chartData.map(item => ({
          period: item.label,
          value: item.value,
          color: item.color || (chartType === 'pie' ? getPieChartColor(item.label) : getBarChartColor())
        }));

        setReportPreview({
          title: report.title || selectedTemplate.name,
          chartType: chartType,
          reportId: report.reportId,
          actualData: {
            chartData: chartData,
            data: {
              totalItems: report.chartData.length,
              totalQuantity: report.chartData.reduce((sum, item) => sum + (item.value || 0), 0),
              categories: report.chartData.map(item => item.label)
            },
            stats: report.statistics || {
              totalCategories: report.chartData.length,
              totalQuantity: `${report.chartData.reduce((sum, item) => sum + (item.value || 0), 0).toFixed(1)} kg`,
              largestCategory: report.chartData.reduce((max, item) => item.value > max.value ? item : max, report.chartData[0])?.label || 'N/A'
            },
            description: report.description || (chartType === 'pie' 
              ? 'Special waste collection by category showing quantity distribution'
              : 'Special waste quantities by category from database')
          },
          summary: `Special waste report generated successfully on ${new Date().toLocaleString()}`,
          reportData: report
        });
      } else {
        const errorText = await response.text();
        console.error('Error response:', response.status, errorText);
        alert(`Failed to generate special waste report. Status: ${response.status}. Please try again.`);
      }
    } catch (error) {
      console.error('Error generating special waste report:', error);
      alert('Error generating report. Please check your connection and try again.\nError: ' + error.message);
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
      const chartType = selectedTemplate.chartType || 'bar';
      
      // Use SOLID controller for both categories
      const endpoint = `/api/reports/solid/download/${encodeURIComponent(selectedCategory)}/${chartType}/${format}`;
      
      const requestBody = {
        startDate: reportParameters.startDate || '2024-01-01',
        endDate: reportParameters.endDate || '2024-12-31',
        format: format,
        includeSampleData: false // Use real data if available
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
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Get filename from response headers or generate one
        const contentDisposition = response.headers.get('content-disposition');
        const categorySlug = selectedCategory.toLowerCase().replace(/\s+/g, '_');
        const chartType = selectedTemplate.chartType || 'bar';
        const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        let filename = `${categorySlug}_${chartType}_report_${timestamp}.${format.toLowerCase()}`;
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
    // Since SOLID controller doesn't have download by ID, 
    // we'll regenerate and download with current parameters
    await generateAndDownloadReport(format);
  };

  // Handler functions for email, share, and print
  const handleEmailReport = async () => {
    if (!reportPreview) {
      alert('No report preview available to email');
      return;
    }

    // Prompt for recipient email
    const recipientEmail = prompt('Enter recipient email address:');
    if (!recipientEmail || !recipientEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      console.log('Sending email to:', recipientEmail);
      console.log('Report data:', reportPreview);

      const emailData = {
        email: recipientEmail,
        reportId: reportPreview.reportId,
        reportTitle: reportPreview.title,
        reportContent: reportPreview.description || 'SOLID Principles-based Waste collection analytics report with detailed charts and statistics.'
      };

      console.log('Email payload:', emailData);

      const response = await fetch('http://localhost:8080/api/reports/solid/email', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const result = await response.json();
        console.log('Success result:', result);
        alert(result.message || 'Report sent successfully!');
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        alert(error.error || 'Failed to send email. Please try again.');
      }
      
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error sending email. Please check your connection and try again.\nError: ' + error.message);
    }
  };

  const handleShareReport = async () => {
    if (!reportPreview) {
      alert('No report preview available to share');
      return;
    }

    try {
      // Create a more detailed share message
      const shareText = `📊 Waste Collection Report: ${reportPreview.title}\n\n` +
        `📅 Generated: ${new Date().toLocaleDateString()}\n` +
        `📈 Type: ${selectedTemplate?.chartType || 'Analysis'} Chart\n` +
        `📋 ${reportPreview.description || 'Comprehensive waste management analytics'}\n\n` +
        `${reportPreview.stats ? Object.entries(reportPreview.stats).map(([key, value]) => 
          `• ${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`
        ).join('\n') : ''}`;

      const shareData = {
        title: `📊 ${reportPreview.title}`,
        text: shareText,
        url: window.location.href
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        // Use native sharing API if available (mobile devices)
        await navigator.share(shareData);
      } else {
        // Fallback: copy comprehensive report info to clipboard
        const clipboardText = `${shareText}\n\n🔗 View Report: ${window.location.href}`;
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(clipboardText);
          alert('📋 Report details copied to clipboard!\n\nYou can now paste this information to share the report.');
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = clipboardText;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('📋 Report details copied to clipboard!\n\nYou can now paste this information to share the report.');
        }
      }
    } catch (error) {
      console.error('Error sharing report:', error);
      if (error.name !== 'AbortError') {
        // Show shareable content in a prompt as final fallback
        const fallbackText = `${reportPreview.title}\nGenerated: ${new Date().toLocaleDateString()}\nView at: ${window.location.href}`;
        prompt('Copy this text to share the report:', fallbackText);
      }
    }
  };

  const handlePrintReport = () => {
    if (!reportPreview) {
      alert('No report preview available to print');
      return;
    }

    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${reportPreview.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .subtitle { font-size: 16px; color: #666; }
            .content { margin: 20px 0; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat-item { text-align: center; }
            .stat-value { font-size: 20px; font-weight: bold; color: #2563eb; }
            .stat-label { font-size: 14px; color: #666; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${reportPreview.title}</div>
            <div class="subtitle">Generated on ${new Date().toLocaleDateString()}</div>
          </div>
          <div class="content">
            <p><strong>Description:</strong> ${reportPreview.description || 'Waste collection analytics report'}</p>
            ${reportPreview.stats ? `
              <div class="stats">
                ${Object.entries(reportPreview.stats).map(([key, value]) => `
                  <div class="stat-item">
                    <div class="stat-value">${value}</div>
                    <div class="stat-label">${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            ${reportPreview.data ? `
              <div>
                <h3>Report Data</h3>
                <pre>${JSON.stringify(reportPreview.data, null, 2)}</pre>
              </div>
            ` : ''}
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };

    } catch (error) {
      console.error('Error printing report:', error);
      alert('Error printing report. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Three Equal Sections Layout */}
      <div className="p-6 bg-gray-50">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          
          {/* Report Categories Section */}
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg border border-blue-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-lg p-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Report Categories</h3>
                  <p className="text-blue-100 text-sm">Choose your analytics type</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.entries(reportCategories).map(([category, details]) => (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 ${
                      selectedCategory === category
                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-lg scale-105'
                        : 'border-gray-200 bg-white hover:border-blue-300 text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`text-2xl p-2 rounded-lg ${
                        selectedCategory === category 
                          ? 'bg-blue-100' 
                          : 'bg-gray-100'
                      }`}>
                        {details.icon}
                      </div>
                      <div>
                        <span className="font-semibold text-sm block">{category}</span>
                        <span className="text-xs text-gray-500">
                          {details.templates?.length || 0} templates available
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Templates Section */}
          <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-lg border border-green-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-lg p-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Templates</h3>
                  <p className="text-green-100 text-sm">Select report format</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {selectedCategory ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {reportCategories[selectedCategory]?.templates?.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full p-4 border-2 rounded-xl text-left transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 ${
                        selectedTemplate?.name === template.name
                          ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg scale-105'
                          : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`text-2xl p-2 rounded-lg ${
                          selectedTemplate?.name === template.name 
                            ? 'bg-green-100' 
                            : 'bg-gray-100'
                        }`}>
                          {template.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm mb-1">{template.name}</h4>
                          <p className="text-xs text-gray-600 leading-relaxed">{template.description}</p>
                          {selectedTemplate?.name === template.name && (
                            <div className="mt-3">
                              <span className="inline-flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Selected
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">Select a category first</p>
                  <p className="text-gray-400 text-xs mt-1">Choose from report categories to view templates</p>
                </div>
              )}
            </div>
          </div>

          {/* Parameters Section */}
          <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl shadow-lg border border-purple-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-lg p-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Parameters</h3>
                  <p className="text-purple-100 text-sm">Configure report settings</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="space-y-5 max-h-96 overflow-y-auto">
                
                {/* Date Range Selection */}
                <div className="bg-white rounded-lg border border-purple-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <label className="text-sm font-semibold text-gray-800">Date Range</label>
                  </div>
                  <select
                    value={reportParameters.dateRange}
                    onChange={(e) => handleParameterChange('dateRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
                  >
                    <option value="">Select Range</option>
                    <option value="last-week">📅 Last Week</option>
                    <option value="last-month">📅 Last Month</option>
                    <option value="last-quarter">📅 Last Quarter</option>
                    <option value="last-year">📅 Last Year</option>
                    <option value="custom">🗓️ Custom Range</option>
                  </select>
                  
                  {/* Custom Date Inputs */}
                  {reportParameters.dateRange === 'custom' && (
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-purple-700 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={reportParameters.startDate}
                            onChange={(e) => handleParameterChange('startDate', e.target.value)}
                            className="w-full px-2 py-1 border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs"
                            max={reportParameters.endDate || new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-purple-700 mb-1">End Date</label>
                          <input
                            type="date"
                            value={reportParameters.endDate}
                            onChange={(e) => handleParameterChange('endDate', e.target.value)}
                            className="w-full px-2 py-1 border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs"
                            min={reportParameters.startDate}
                            max={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Quick Date Selection */}
                  <div className="mt-3">
                    <div className="text-xs font-medium text-gray-600 mb-2">Quick Selection:</div>
                    <div className="grid grid-cols-2 gap-2">
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
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs"
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
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs"
                          min={reportParameters.startDate}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                    {reportParameters.startDate && reportParameters.endDate && (
                      <div className="mt-2 p-2 bg-green-50 rounded-md border border-green-200">
                        <div className="text-xs text-green-700 font-medium flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Period: {new Date(reportParameters.startDate).toLocaleDateString()} to {new Date(reportParameters.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* District Selection */}
                <div className="bg-white rounded-lg border border-purple-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <label className="text-sm font-semibold text-gray-800">District</label>
                  </div>
                  <select
                    value={reportParameters.region}
                    onChange={(e) => handleParameterChange('region', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
                  >
                    <option value="">🏝️ All Districts</option>
                    <optgroup label="🌊 Western Province">
                      <option value="colombo">🏙️ Colombo</option>
                      <option value="gampaha">🏘️ Gampaha</option>
                      <option value="kalutara">🌴 Kalutara</option>
                    </optgroup>
                    <optgroup label="⛰️ Central Province">
                      <option value="kandy">👑 Kandy</option>
                      <option value="matale">🌿 Matale</option>
                      <option value="nuwara-eliya">🍃 Nuwara Eliya</option>
                    </optgroup>
                    <optgroup label="🏖️ Southern Province">
                      <option value="galle">🏰 Galle</option>
                      <option value="matara">🌊 Matara</option>
                      <option value="hambantota">🐘 Hambantota</option>
                    </optgroup>
                    <optgroup label="🏛️ Northern Province">
                      <option value="jaffna">🕌 Jaffna</option>
                      <option value="kilinochchi">🌾 Kilinochchi</option>
                      <option value="mannar">🏝️ Mannar</option>
                      <option value="mullaitivu">🌊 Mullaitivu</option>
                      <option value="vavuniya">🌳 Vavuniya</option>
                    </optgroup>
                    <optgroup label="🌅 Eastern Province">
                      <option value="batticaloa">🏖️ Batticaloa</option>
                      <option value="ampara">🌾 Ampara</option>
                      <option value="trincomalee">⚓ Trincomalee</option>
                    </optgroup>
                    <optgroup label="🌴 North Western Province">
                      <option value="kurunegala">🌴 Kurunegala</option>
                      <option value="puttalam">🧂 Puttalam</option>
                    </optgroup>
                    <optgroup label="🏛️ North Central Province">
                      <option value="anuradhapura">🛕 Anuradhapura</option>
                      <option value="polonnaruwa">🏛️ Polonnaruwa</option>
                    </optgroup>
                    <optgroup label="⛰️ Uva Province">
                      <option value="badulla">⛰️ Badulla</option>
                      <option value="monaragala">🏔️ Monaragala</option>
                    </optgroup>
                    <optgroup label="💎 Sabaragamuwa Province">
                      <option value="ratnapura">💎 Ratnapura</option>
                      <option value="kegalle">🌿 Kegalle</option>
                    </optgroup>
                  </select>
                </div>

                {/* Waste Category Selection */}
                <div className="bg-white rounded-lg border border-purple-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <label className="text-sm font-semibold text-gray-800">Waste Category</label>
                  </div>
                  <select
                    value={reportParameters.department}
                    onChange={(e) => handleParameterChange('department', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
                  >
                    <option value="">♻️ All Categories</option>
                    <option value="general-waste">🗑️ General Waste</option>
                    <option value="recyclable">♻️ Recyclable</option>
                    <option value="organic">🌱 Organic</option>
                    <option value="hazardous">⚠️ Hazardous</option>
                  </select>
                </div>

                {/* Generate Button */}
                <div className="pt-2">
                  <button
                    onClick={generateReport}
                    disabled={!selectedTemplate}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium text-sm flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Generate Report
                      </>
                    )}
                  </button>
                  {!selectedTemplate && (
                    <p className="text-xs text-gray-500 text-center mt-2">Select a template first to generate report</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Report Preview Section */}
      {(selectedTemplate || reportPreview) && (
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-full mx-auto px-6 py-8">
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
                        <p className="text-blue-100 text-sm">Toggle between actual and sample data</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Data Mode Toggle */}
                      <div className="flex items-center gap-3 bg-white/10 rounded-lg p-2">
                        <span className={`text-sm font-medium transition-colors ${previewMode === 'actual' ? 'text-white' : 'text-blue-200'}`}>
                          Actual
                        </span>
                        <button
                          onClick={() => setPreviewMode(previewMode === 'actual' ? 'sample' : 'actual')}
                          className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 bg-white/20"
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              previewMode === 'sample' ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-sm font-medium transition-colors ${previewMode === 'sample' ? 'text-white' : 'text-blue-200'}`}>
                          Sample
                        </span>
                      </div>
                      <div className={`rounded-lg px-3 py-1 ${previewMode === 'actual' ? 'bg-green-500/20' : 'bg-orange-500/20'}`}>
                        <span className="text-white text-sm font-medium">
                          {previewMode === 'actual' ? 'Live Data' : 'Demo Data'}
                        </span>
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
                            <div className={`w-3 h-3 rounded-full animate-pulse ${previewMode === 'sample' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                            <h4 className="text-2xl font-bold text-gray-900">{reportPreview.title}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              previewMode === 'sample' 
                                ? 'bg-orange-100 text-orange-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {previewMode === 'sample' ? 'Sample Data' : 'Live Data'}
                            </span>
                          </div>
                          <p className="text-gray-600 text-lg leading-relaxed">
                            {currentData?.description || reportPreview.summary}
                          </p>
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
                            <span className={`flex items-center gap-1 ${previewMode === 'sample' ? 'text-orange-600' : 'text-green-600'}`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {previewMode === 'sample' ? 'Demo Mode' : 'Live Mode'}
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
                                <div className="grid grid-cols-4 gap-2">
                                  {[
                                    { format: 'PDF', icon: '📄', color: 'red' },
                                    { format: 'Excel', icon: '📊', color: 'green' },
                                    { format: 'CSV', icon: '📋', color: 'blue' },
                                    { format: 'TXT', icon: '📝', color: 'gray' }
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
                            {selectedTemplate?.chartType === 'pie' ? 'Distribution Analysis' :
                             selectedTemplate?.chartType === 'donut' ? 'Status Overview' :
                             selectedTemplate?.chartType === 'map' ? 'Route Map View' :
                             selectedTemplate?.chartType === 'list' ? 'Route Connection List' :
                             'Collection Data Analysis'}
                          </h5>
                          <p className="text-sm text-gray-600 mt-1">Visual representation of collection data</p>
                        </div>
                        
                        <div className="p-5">
                          {/* Render different chart types based on selectedTemplate.chartType */}
                          {selectedTemplate?.chartType === 'pie' ? (
                            /* Pie Chart */
                            <div className="relative h-96 flex items-center justify-center">
                              <div className="relative w-72 h-72">
                                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                  {currentData?.chartData?.map((item, index) => {
                                    const total = currentData.chartData.reduce((sum, d) => sum + d.value, 0);
                                    const percentage = (item.value / total) * 100;
                                    const angle = (percentage / 100) * 360;
                                    const startAngle = currentData.chartData.slice(0, index).reduce((sum, d) => sum + (d.value / total) * 360, 0);
                                    
                                    const startX = 50 + 30 * Math.cos((startAngle * Math.PI) / 180);
                                    const startY = 50 + 30 * Math.sin((startAngle * Math.PI) / 180);
                                    const endX = 50 + 30 * Math.cos(((startAngle + angle) * Math.PI) / 180);
                                    const endY = 50 + 30 * Math.sin(((startAngle + angle) * Math.PI) / 180);
                                    
                                    const largeArcFlag = angle > 180 ? 1 : 0;
                                    
                                    return (
                                      <path
                                        key={index}
                                        d={`M 50 50 L ${startX} ${startY} A 30 30 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                                        fill={item.color || `hsl(${index * 60}, 70%, 50%)`}
                                        stroke="white"
                                        strokeWidth="0.5"
                                        className="hover:opacity-80 transition-opacity cursor-pointer"
                                      />
                                    );
                                  }) || []}
                                </svg>
                                
                                {/* Center Label */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-800">
                                      {currentData?.chartData?.reduce((sum, item) => sum + item.value, 0) || 0}
                                    </div>
                                    <div className="text-sm text-gray-500">Total kg</div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Legend */}
                              <div className="absolute right-0 top-0 space-y-3 max-w-xs">
                                {currentData?.chartData?.map((item, index) => {
                                  const total = currentData.chartData.reduce((sum, d) => sum + d.value, 0);
                                  const percentage = ((item.value / total) * 100).toFixed(1);
                                  return (
                                    <div key={index} className="flex items-center gap-3 text-sm bg-white bg-opacity-90 rounded-lg px-3 py-2 shadow-sm border border-gray-100">
                                      <div 
                                        className="w-4 h-4 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: item.color || `hsl(${index * 60}, 70%, 50%)` }}
                                      ></div>
                                      <div className="flex flex-col">
                                        <span className="text-gray-700 font-medium text-sm">{item.period}</span>
                                        <span className="text-gray-500 text-xs">{item.value} kg ({percentage}%)</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : selectedTemplate?.chartType === 'donut' ? (
                            /* Donut Chart */
                            <div className="relative h-96 flex items-center justify-center">
                              <div className="relative w-72 h-72">
                                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                  {currentData?.chartData?.map((item, index) => {
                                    const total = currentData.chartData.reduce((sum, d) => sum + d.value, 0);
                                    const percentage = (item.value / total) * 100;
                                    const angle = (percentage / 100) * 360;
                                    const startAngle = currentData.chartData.slice(0, index).reduce((sum, d) => sum + (d.value / total) * 360, 0);
                                    
                                    const outerRadius = 30;
                                    const innerRadius = 15;
                                    
                                    const startOuterX = 50 + outerRadius * Math.cos((startAngle * Math.PI) / 180);
                                    const startOuterY = 50 + outerRadius * Math.sin((startAngle * Math.PI) / 180);
                                    const endOuterX = 50 + outerRadius * Math.cos(((startAngle + angle) * Math.PI) / 180);
                                    const endOuterY = 50 + outerRadius * Math.sin(((startAngle + angle) * Math.PI) / 180);
                                    
                                    const startInnerX = 50 + innerRadius * Math.cos((startAngle * Math.PI) / 180);
                                    const startInnerY = 50 + innerRadius * Math.sin((startAngle * Math.PI) / 180);
                                    const endInnerX = 50 + innerRadius * Math.cos(((startAngle + angle) * Math.PI) / 180);
                                    const endInnerY = 50 + innerRadius * Math.sin(((startAngle + angle) * Math.PI) / 180);
                                    
                                    const largeArcFlag = angle > 180 ? 1 : 0;
                                    
                                    return (
                                      <path
                                        key={index}
                                        d={`M ${startOuterX} ${startOuterY} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuterX} ${endOuterY} L ${endInnerX} ${endInnerY} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInnerX} ${startInnerY} Z`}
                                        fill={item.color || `hsl(${index * 90}, 70%, 50%)`}
                                        stroke="white"
                                        strokeWidth="0.5"
                                        className="hover:opacity-80 transition-opacity cursor-pointer"
                                      />
                                    );
                                  }) || []}
                                </svg>
                                
                                {/* Center Label */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-gray-800">
                                      {currentData?.chartData?.reduce((sum, item) => sum + item.value, 0) || 0}
                                    </div>
                                    <div className="text-xs text-gray-500">Total kg</div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Legend */}
                              <div className="absolute right-0 top-0 space-y-2 max-w-xs">
                                {currentData?.chartData?.map((item, index) => {
                                  const total = currentData.chartData.reduce((sum, d) => sum + d.value, 0);
                                  const percentage = ((item.value / total) * 100).toFixed(1);
                                  return (
                                    <div key={index} className="flex items-center gap-2 text-sm bg-white bg-opacity-80 rounded px-2 py-1">
                                      <div 
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: item.color || `hsl(${index * 90}, 70%, 50%)` }}
                                      ></div>
                                      <div className="flex flex-col">
                                        <span className="text-gray-700 font-medium text-xs">{item.period}</span>
                                        <span className="text-gray-500 text-xs">{item.value} kg ({percentage}%)</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                          ) : (
                            /* Default Bar Chart */
                            <div className="relative h-80 bg-gradient-to-t from-gray-50 to-white rounded-lg border border-gray-100">
                              <div className="flex items-end justify-around h-full p-4">
                                {currentData?.chartData?.slice(0, 8).map((item, index) => {
                                  const maxValue = Math.max(...(currentData?.chartData?.map(d => d.value) || [0]));
                                  const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                                  return (
                                    <div key={index} className="flex flex-col items-center group">
                                      <div className="relative mb-2">
                                        <div
                                          className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg min-w-[40px] w-12 transition-all duration-300 group-hover:from-blue-700 group-hover:to-blue-500 shadow-md"
                                          style={{ height: `${Math.max(height, 8)}px`, minHeight: '8px' }}
                                        ></div>
                                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg">
                                          {item.value} kg
                                        </div>
                                      </div>
                                      <span className="text-sm text-gray-600 text-center leading-tight max-w-[80px] transform group-hover:text-blue-600 transition-colors font-medium">
                                        {item.period?.length > 10 ? item.period.substring(0, 10) + '...' : item.period}
                                      </span>
                                    </div>
                                  );
                                }) || []}
                              </div>
                              
                              {/* Chart Grid Lines for Bar Chart */}
                              <div className="absolute inset-0 pointer-events-none">
                                {[0, 25, 50, 75, 100].map((line) => (
                                  <div
                                    key={line}
                                    className="absolute left-0 right-0 border-t border-gray-200"
                                    style={{ bottom: `${line}%` }}
                                  ></div>
                                ))}
                              </div>
                              
                              {/* Y-axis labels for Bar Chart */}
                              <div className="absolute left-0 top-0 bottom-0 -ml-16 flex flex-col justify-between text-sm text-gray-500 py-4">
                                <span className="font-medium">{Math.max(...(currentData?.chartData?.map(d => d.value) || [0])).toFixed(1)} kg</span>
                                <span>{Math.round(Math.max(...(currentData?.chartData?.map(d => d.value) || [0])) * 0.75)} kg</span>
                                <span>{Math.round(Math.max(...(currentData?.chartData?.map(d => d.value) || [0])) * 0.5)} kg</span>
                                <span>{Math.round(Math.max(...(currentData?.chartData?.map(d => d.value) || [0])) * 0.25)} kg</span>
                                <span className="font-medium">0 kg</span>
                              </div>
                              
                              {/* Axis Labels */}
                              <div className="absolute -left-20 top-1/2 -rotate-90 text-sm font-medium text-gray-700 whitespace-nowrap">
                                Waste Amount (kg)
                              </div>
                              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 text-sm font-medium text-gray-700">
                                Waste Category
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Analytics Section */}
                    {selectedCategory === 'Waste Collection Analytics' && currentData?.data && (
                      <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          
                          {/* Status Breakdown */}
                          {currentData.data.statusBreakdown && (
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
                                  {currentData?.data?.statusBreakdown ? Object.entries(currentData.data.statusBreakdown).map(([status, count]) => {
                                    const total = Object.values(currentData.data.statusBreakdown).reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                                    const statusColors = {
                                      'Completed': 'bg-green-500',
                                      'Pending': 'bg-yellow-500',
                                      'Processing': 'bg-blue-500',
                                      'Cancelled': 'bg-red-500'
                                    };
                                    return (
                                      <div key={status} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-3 h-3 rounded-full ${statusColors[status] || 'bg-gray-500'}`}></div>
                                          <span className="text-sm font-medium text-gray-700">{status}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-gray-600">{count}</span>
                                          <span className="text-xs text-gray-500">({percentage}%)</span>
                                        </div>
                                      </div>
                                    );
                                  }) : null}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Recent Collections List */}
                          {currentData?.data?.recentCollections && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                              <div className="bg-gradient-to-r from-green-50 to-teal-50 px-5 py-4 border-b border-gray-200">
                                <h6 className="font-semibold text-gray-800 flex items-center gap-2">
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                  Recent Collections
                                </h6>
                                <p className="text-sm text-gray-600 mt-1">Latest collection activities</p>
                              </div>
                              <div className="p-5">
                                <div className="space-y-3">
                                  {currentData?.data?.recentCollections?.slice(0, 5).map((collection, index) => (
                                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800">{collection.fullName}</p>
                                        <p className="text-xs text-gray-500">{collection.status}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-medium text-gray-700">{collection.totalWeight}kg</p>
                                        <p className="text-xs text-gray-500">${collection.totalPayback}</p>
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

                    {/* Quick Actions */}
                    {previewMode === 'sample' && (
                      <div className="px-6 py-5 bg-orange-50 border-t border-orange-200">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1">
                            <h5 className="font-semibold text-orange-800 flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Sample Data Preview
                            </h5>
                            <p className="text-sm text-orange-700 mt-1">You're viewing sample data to preview how reports will look with actual data</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button 
                              onClick={() => setPreviewMode('actual')}
                              className="flex items-center gap-2 bg-white hover:bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Switch to Live Data
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-800">Quick Actions</h5>
                          <p className="text-sm text-gray-600 mt-1">Additional report operations</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button className="flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Email Report
                          </button>
                          <button className="flex items-center gap-2 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                            Share
                          </button>
                          <button 
                            onClick={() => window.print()}
                            className="flex items-center gap-2 bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print
                          </button>
                        </div>
                      </div>
                    </div>
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
          </div>
        )}

      {/* Footer */}
     
    </div>
  );
};

export default Report;
