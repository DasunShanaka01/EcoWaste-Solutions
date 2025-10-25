import { describe, it, expect } from 'vitest'
import {
  getStatusColor,
  getStatusIcon,
  getWasteTypeIcon,
  formatDate,
  calculateStats
} from '../../utils/collectionUtils.jsx'

// Test suite for Collection Utils

describe('Collection Utils', () => {
  describe('getStatusColor', () => {
    it('should return correct color for collected status', () => {
      expect(getStatusColor('collected')).toBe('bg-green-100 text-green-800 border-green-200')
      expect(getStatusColor('COLLECTED')).toBe('bg-green-100 text-green-800 border-green-200')
    })

    it('should return correct color for complete status', () => {
      expect(getStatusColor('complete')).toBe('bg-green-100 text-green-800 border-green-200')
    })

    it('should return correct color for pending status', () => {
      expect(getStatusColor('pending')).toBe('bg-yellow-100 text-yellow-800 border-yellow-200')
    })

    it('should return correct color for in_progress status', () => {
      expect(getStatusColor('in_progress')).toBe('bg-blue-100 text-blue-800 border-blue-200')
    })

    it('should return default color for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('bg-gray-100 text-gray-800 border-gray-200')
    })
  })

  describe('getStatusIcon', () => {
    it('should return correct icon for collected status', () => {
      const icon = getStatusIcon('collected')
      expect(icon).toBeDefined()
      expect(typeof icon).toBe('object')
    })

    it('should return correct icon for complete status', () => {
      const icon = getStatusIcon('complete')
      expect(icon).toBeDefined()
      expect(typeof icon).toBe('object')
    })

    it('should return correct icon for pending status', () => {
      const icon = getStatusIcon('pending')
      expect(icon).toBeDefined()
      expect(typeof icon).toBe('object')
    })

    it('should return correct icon for in_progress status', () => {
      const icon = getStatusIcon('in_progress')
      expect(icon).toBeDefined()
      expect(typeof icon).toBe('object')
    })

    it('should return null for unknown status', () => {
      expect(getStatusIcon('unknown')).toBeNull()
    })
  })

  describe('getWasteTypeIcon', () => {
    it('should return correct icon for recyclable type', () => {
      expect(getWasteTypeIcon('recyclable')).toBe('♻️')
    })

    it('should return correct icon for organic type', () => {
      expect(getWasteTypeIcon('organic')).toBe('🌱')
    })

    it('should return correct icon for general waste type', () => {
      expect(getWasteTypeIcon('general')).toBe('📦')
    })

    it('should return default icon for unknown type', () => {
      expect(getWasteTypeIcon('unknown')).toBe('📦')
    })
  })

  describe('formatDate', () => {
    it('should format valid date string correctly', () => {
      const date = '2024-01-15T10:30:00Z'
      const formatted = formatDate(date)
      expect(formatted).toContain('Jan')
      expect(formatted).toContain('2024')
    })

    it('should handle different date formats', () => {
      const date1 = '2024-01-15'
      const date2 = '2024-12-25T15:45:00Z'
      
      expect(formatDate(date1)).toBeDefined()
      expect(formatDate(date2)).toBeDefined()
    })

    it('should handle null and undefined dates', () => {
      expect(formatDate(null)).toBe('N/A')
      expect(formatDate(undefined)).toBe('N/A')
    })
  })

  describe('calculateStats', () => {
    it('should calculate stats correctly for mixed statuses', () => {
      const collections = [
        { status: 'collected', weight: 10 },
        { status: 'complete', weight: 15 },
        { status: 'pending', weight: 20 },
        { status: 'in_progress', weight: 5 }
      ]

      const result = calculateStats(collections)

      expect(result.total).toBe(4)
      expect(result.completed).toBe(2)
      expect(result.pending).toBe(1)
      expect(result.totalWeight).toBe(50)
    })

    it('should handle empty collections array', () => {
      const result = calculateStats([])

      expect(result.total).toBe(0)
      expect(result.completed).toBe(0)
      expect(result.pending).toBe(0)
      expect(result.totalWeight).toBe(0)
    })

    it('should handle collections with null/undefined status', () => {
      const collections = [
        { status: null, weight: 10 },
        { status: undefined, weight: 15 },
        { status: 'collected', weight: 20 }
      ]

      const result = calculateStats(collections)

      expect(result.total).toBe(3)
      expect(result.completed).toBe(1)
    })

    it('should handle collections without weight property', () => {
      const collections = [
        { status: 'collected' },
        { status: 'pending', weight: 15 }
      ]

      const result = calculateStats(collections)

      expect(result.total).toBe(2)
      expect(result.completed).toBe(1)
      expect(result.pending).toBe(1)
    })

    it('should handle collections with zero weight', () => {
      const collections = [
        { status: 'collected', weight: 0 },
        { status: 'pending', weight: 15 }
      ]

      const result = calculateStats(collections)

      expect(result.total).toBe(2)
      expect(result.totalWeight).toBe(15)
    })

    it('should handle all completed collections', () => {
      const collections = [
        { status: 'collected', weight: 10 },
        { status: 'complete', weight: 20 }
      ]

      const result = calculateStats(collections)

      expect(result.total).toBe(2)
      expect(result.completed).toBe(2)
      expect(result.pending).toBe(0)
    })

    it('should handle all pending collections', () => {
      const collections = [
        { status: 'pending', weight: 10 },
        { status: 'in_progress', weight: 20 }
      ]

      const result = calculateStats(collections)

      expect(result.total).toBe(2)
      expect(result.completed).toBe(0)
      expect(result.pending).toBe(1)
    })
  })
})