/**
 * Utility functions for collection data processing
 * Single Responsibility: Pure functions for data transformation
 */

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'collected':
    case 'complete':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'collected':
    case 'complete':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'pending':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'in_progress':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    default:
      return null;
  }
};

export const getWasteTypeIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'recyclable':
      return '♻️';
    case 'organic':
      return '🌱';
    case 'general waste':
      return '🗑️';
    default:
      return '📦';
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculateStats = (collections) => {
  const completed = collections.filter(c => 
    c.status?.toLowerCase() === 'collected' || c.status?.toLowerCase() === 'complete'
  ).length;
  
  const pending = collections.filter(c => 
    c.status?.toLowerCase() === 'pending'
  ).length;
  
  const totalWeight = collections.reduce((sum, c) => sum + (c.weight || 0), 0);
  
  return {
    completed,
    pending,
    totalWeight,
    total: collections.length
  };
};
