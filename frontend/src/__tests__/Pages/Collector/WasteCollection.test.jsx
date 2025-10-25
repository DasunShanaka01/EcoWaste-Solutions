import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import WasteCollection from '../../../Pages/Collector/WasteCollection'

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

// Mock the hooks
vi.mock('../../../hooks/useWasteCollection', () => ({
  useWasteCollection: () => ({
    markers: [
      {
        lat: 40.7128,
        lng: -74.0060,
        address: '123 Main St',
        pointId: 'WA123456789ABC',
        type: 'waste_account',
        status: 'active',
        capacity: 75.5
      }
    ],
    stats: {
      total: 1,
      completed: 0,
      remaining: 1
    },
    loading: false,
    error: null,
    updateStats: vi.fn(),
    removeMarker: vi.fn()
  })
}))

vi.mock('../../../hooks/useCollectionSteps', () => ({
  useCollectionSteps: () => ({
    currentStep: 1,
    routeStarted: false,
    steps: [
      { id: 1, name: 'Route Overview' },
      { id: 2, name: 'Scan Account Tag' },
      { id: 3, name: 'Verify Account' },
      { id: 4, name: 'Record Weight' },
      { id: 5, name: 'Confirm Collection' }
    ],
    startRoute: vi.fn(),
    nextStep: vi.fn(),
    prevStep: vi.fn(),
    resetSteps: vi.fn()
  })
}))

vi.mock('../../../hooks/useQRScanner', () => ({
  useQRScanner: () => ({
    scanning: false,
    scanResult: null,
    setScanResult: vi.fn(),
    showError: false,
    showManualEntry: false,
    videoRef: { current: null },
    processQR: vi.fn(),
    handleScan: vi.fn(),
    handleManualEntry: vi.fn(),
    resetScanner: vi.fn()
  })
}))

// Mock global fetch
global.fetch = vi.fn()

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn()
}
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
})

// Mock alert
global.alert = vi.fn()

describe('WasteCollection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })
  })

  describe('Component Rendering', () => {
    it('should render the main component', () => {
      render(
        <TestWrapper>
          <WasteCollection />
        </TestWrapper>
      )
      expect(screen.getByText('Waste Collection Route')).toBeInTheDocument()
    })

    it('should render step indicator', () => {
      render(
        <TestWrapper>
          <WasteCollection />
        </TestWrapper>
      )
      expect(screen.getByText('Collection Process')).toBeInTheDocument()
    })

    it('should render progress bar with steps', () => {
      render(
        <TestWrapper>
          <WasteCollection />
        </TestWrapper>
      )
      expect(screen.getAllByText('Route Overview')).toHaveLength(2)
      expect(screen.getAllByText('Scan Account Tag')).toHaveLength(2)
      expect(screen.getAllByText('Verify Account')).toHaveLength(2)
    })
  })

  describe('Route Overview Step', () => {
    it('should display route overview content', () => {
      render(
        <TestWrapper>
          <WasteCollection />
        </TestWrapper>
      )
      expect(screen.getByText('Waste Collection Route')).toBeInTheDocument()
      expect(screen.getByText('Start your collection route and visit waste bin locations to collect waste')).toBeInTheDocument()
    })

    it('should show start route button', () => {
      render(
        <TestWrapper>
          <WasteCollection />
        </TestWrapper>
      )
      expect(screen.getByText('Start Collection Route (GPS Required)')).toBeInTheDocument()
    })

    it('should display waste bin locations', () => {
      render(
        <TestWrapper>
          <WasteCollection />
        </TestWrapper>
      )
      expect(screen.getByText('Waste Bin Locations')).toBeInTheDocument()
      expect(screen.getByText(/123 Main St/)).toBeInTheDocument()
    })

    it('should display stats', () => {
      render(
        <TestWrapper>
          <WasteCollection />
        </TestWrapper>
      )
      expect(screen.getByText('Total Bins')).toBeInTheDocument()
      expect(screen.getByText('Active Bins')).toBeInTheDocument()
      expect(screen.getByText('Available')).toBeInTheDocument()
    })
  })

  describe('GPS Location Handling', () => {
    it('should handle successful GPS location', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      }
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      render(
        <TestWrapper>
          <WasteCollection />
        </TestWrapper>
      )

      const startButton = screen.getByText('Start Collection Route (GPS Required)')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled()
      })
    })

    it('should handle GPS permission denied', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 1, message: 'Permission denied' })
      })

      render(
        <TestWrapper>
          <WasteCollection />
        </TestWrapper>
      )

      const startButton = screen.getByText('Start Collection Route (GPS Required)')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('GPS permission is required for waste collection. Please enable location services and try again.')
      })
    })

    it('should handle GPS not supported', () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true
      })

      render(
        <TestWrapper>
          <WasteCollection />
        </TestWrapper>
      )

      const startButton = screen.getByText('Start Collection Route (GPS Required)')
      fireEvent.click(startButton)

      expect(global.alert).toHaveBeenCalledWith('GPS is not supported on this device. Please use a device with GPS capabilities.')
    })
  })

  describe('API Integration', () => {
    it('should handle API errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      render(
        <TestWrapper>
          <WasteCollection />
        </TestWrapper>
      )

      // Component should still render
      expect(screen.getByText('Waste Collection Route')).toBeInTheDocument()
    })

    it('should handle network timeouts', async () => {
      global.fetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )

      render(
        <TestWrapper>
          <WasteCollection />
        </TestWrapper>
      )

      // Component should still render
      expect(screen.getByText('Waste Collection Route')).toBeInTheDocument()
    })
  })
})