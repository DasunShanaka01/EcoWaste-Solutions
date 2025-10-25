import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ScheduleSpecial from '../../../Pages/SpecialWaste/ScheduleSpecial'
import * as scApi from '../../../api/specialCollection'

// Test suite for ScheduleSpecial component

// Mock the API
vi.mock('../../../api/specialCollection', () => ({
  default: {
    calculateFee: vi.fn(),
    getDates: vi.fn(),
    getSlots: vi.fn(),
    scheduleCollection: vi.fn(),
    payForCollection: vi.fn(),
    downloadReceipt: vi.fn(),
    listMine: vi.fn()
  }
}))

// Mock window.alert
global.alert = vi.fn()

// Mock navigator.geolocation
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn()
  },
  writable: true
})

// Mock fetch
global.fetch = vi.fn()

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('ScheduleSpecial Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock API responses
    scApi.default.calculateFee.mockResolvedValue({ data: { totalFee: 100 } })
    scApi.default.getDates.mockResolvedValue(['2024-01-15', '2024-01-16', '2024-01-17'])
    scApi.default.getSlots.mockResolvedValue(['Morning', 'Afternoon', 'Evening'])
    scApi.default.scheduleCollection.mockResolvedValue({ 
      data: { 
        id: '123', 
        status: 'Scheduled',
        paymentStatus: 'Unpaid'
      } 
    })
    scApi.default.payForCollection.mockResolvedValue({ 
      data: { 
        id: '123', 
        status: 'Scheduled',
        paymentStatus: 'Paid'
      } 
    })
    scApi.default.downloadReceipt.mockResolvedValue({ data: 'receipt content' })
    scApi.default.listMine.mockResolvedValue({ data: [] })
    
    // Mock geolocation
    navigator.geolocation.getCurrentPosition.mockImplementation((success) => {
      setTimeout(() => {
        success({
          coords: {
            latitude: 6.9280,
            longitude: 79.8620
          }
        })
      }, 50)
    })
    
    // Mock fetch for Google Maps API
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        results: [{
          formatted_address: 'Colombo, Sri Lanka',
          geometry: {
            location: {
              lat: 6.9280,
              lng: 79.8620
            }
          }
        }]
      })
    })
  })

  describe('Component Rendering', () => {
    it('should render the main component', () => {
      render(
        <TestWrapper>
          <ScheduleSpecial />
        </TestWrapper>
      )
      
      expect(screen.getByText('Select Waste Categories')).toBeInTheDocument()
    })

    it('should render all step indicators', () => {
      render(
        <TestWrapper>
          <ScheduleSpecial />
        </TestWrapper>
      )
      
      expect(screen.getByText('Waste Category')).toBeInTheDocument()
      expect(screen.getByText('Items / Quantity')).toBeInTheDocument()
      expect(screen.getByText('Calendar & Time')).toBeInTheDocument()
      expect(screen.getByText('Pickup Location')).toBeInTheDocument()
      expect(screen.getAllByText('Order Summary')).toHaveLength(2)
      expect(screen.getByText('Payment')).toBeInTheDocument()
      expect(screen.getByText('Confirmation')).toBeInTheDocument()
    })
  })

  describe('Step 1: Waste Category Selection', () => {
    it('should render category selection step', () => {
      render(
        <TestWrapper>
          <ScheduleSpecial />
        </TestWrapper>
      )
      
      expect(screen.getByText('Select Waste Categories')).toBeInTheDocument()
    })

    it('should allow selecting waste categories', () => {
      render(
        <TestWrapper>
          <ScheduleSpecial />
        </TestWrapper>
      )
      
      const bulkyButton = screen.getByText('Bulky').closest('button')
      fireEvent.click(bulkyButton)
      
      expect(bulkyButton).toHaveClass('bg-green-50')
    })

    it('should enable next button after category selection', () => {
      render(
        <TestWrapper>
          <ScheduleSpecial />
        </TestWrapper>
      )
      
      const bulkyButton = screen.getByText('Bulky').closest('button')
      fireEvent.click(bulkyButton)
      
      const nextButton = screen.getByRole('button', { name: /^next$/i })
      expect(nextButton).not.toBeDisabled()
    })

    it('should navigate to next step', async () => {
      render(
        <TestWrapper>
          <ScheduleSpecial />
        </TestWrapper>
      )
      
      const bulkyButton = screen.getByText('Bulky').closest('button')
      fireEvent.click(bulkyButton)
      
      const nextButton = screen.getByRole('button', { name: /^next$/i })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText('Items and Quantity')).toBeInTheDocument()
      })
    })
  })

  describe('Step 2: Items and Quantity', () => {
    it('should render items and quantity step', async () => {
      render(
        <TestWrapper>
          <ScheduleSpecial />
        </TestWrapper>
      )
      
      // Navigate to step 2
      const bulkyButton = screen.getByText('Bulky').closest('button')
      fireEvent.click(bulkyButton)
      
      const nextButton = screen.getByRole('button', { name: /^next$/i })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText('Items and Quantity')).toBeInTheDocument()
      })
    })

    it('should allow selecting items', async () => {
      render(
        <TestWrapper>
          <ScheduleSpecial />
        </TestWrapper>
      )
      
      // Navigate to step 2
      const bulkyButton = screen.getByText('Bulky').closest('button')
      fireEvent.click(bulkyButton)
      
      const nextButton = screen.getByRole('button', { name: /^next$/i })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText('Items and Quantity')).toBeInTheDocument()
      })
      
      const itemSelect = screen.getByDisplayValue('Select item')
      fireEvent.change(itemSelect, { target: { value: 'Sofa' } })
      
      expect(itemSelect.value).toBe('Sofa')
    })

    it('should allow entering quantity', async () => {
      render(
        <TestWrapper>
          <ScheduleSpecial />
        </TestWrapper>
      )
      
      // Navigate to step 2
      const bulkyButton = screen.getByText('Bulky').closest('button')
      fireEvent.click(bulkyButton)
      
      const nextButton = screen.getByRole('button', { name: /^next$/i })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText('Items and Quantity')).toBeInTheDocument()
      })
      
      const quantityInput = screen.getByPlaceholderText('Weight (kg)')
      fireEvent.change(quantityInput, { target: { value: '25' } })
      
      expect(quantityInput.value).toBe('25')
    })

    it('should call calculateFee API when quantity changes', async () => {
      render(
        <TestWrapper>
          <ScheduleSpecial />
        </TestWrapper>
      )
      
      // Navigate to step 2
      const bulkyButton = screen.getByText('Bulky').closest('button')
      fireEvent.click(bulkyButton)
      
      const nextButton = screen.getByRole('button', { name: /^next$/i })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText('Items and Quantity')).toBeInTheDocument()
      })
      
      const itemSelect = screen.getByDisplayValue('Select item')
      fireEvent.change(itemSelect, { target: { value: 'Sofa' } })
      
      const quantityInput = screen.getByPlaceholderText('Weight (kg)')
      fireEvent.change(quantityInput, { target: { value: '25' } })
      
      await waitFor(() => {
        expect(scApi.default.calculateFee).toHaveBeenCalled()
      })
    })
  })

  describe('Step 3: Date and Time Selection', () => {
    it('should render date and time step', async () => {
      render(
        <TestWrapper>
          <ScheduleSpecial />
        </TestWrapper>
      )
      
      // Navigate to step 3
      const bulkyButton = screen.getByText('Bulky').closest('button')
      fireEvent.click(bulkyButton)
      
      const nextButton = screen.getByRole('button', { name: /^next$/i })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText('Items and Quantity')).toBeInTheDocument()
      })
      
      const itemSelect = screen.getByDisplayValue('Select item')
      fireEvent.change(itemSelect, { target: { value: 'Sofa' } })
      
      const quantityInput = screen.getByPlaceholderText('Weight (kg)')
      fireEvent.change(quantityInput, { target: { value: '25' } })
      
      fireEvent.click(screen.getByRole('button', { name: /^next$/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Choose Date and Time')).toBeInTheDocument()
      })
    })

    it('should allow selecting date', async () => {
      render(
        <TestWrapper>
          <ScheduleSpecial />
        </TestWrapper>
      )
      
      // Navigate to step 3
      const bulkyButton = screen.getByText('Bulky').closest('button')
      fireEvent.click(bulkyButton)
      
      const nextButton = screen.getByRole('button', { name: /^next$/i })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText('Items and Quantity')).toBeInTheDocument()
      })
      
      const itemSelect = screen.getByDisplayValue('Select item')
      fireEvent.change(itemSelect, { target: { value: 'Sofa' } })
      
      const quantityInput = screen.getByPlaceholderText('Weight (kg)')
      fireEvent.change(quantityInput, { target: { value: '25' } })
      
      fireEvent.click(screen.getByRole('button', { name: /^next$/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Choose Date and Time')).toBeInTheDocument()
      })
      
      const dateSelect = screen.getByDisplayValue('-- choose date --')
      fireEvent.change(dateSelect, { target: { value: '2024-01-15' } })
      
      expect(dateSelect.value).toBe('2024-01-15')
    })

    it('should call getSlots API when date is selected', async () => {
      render(
        <TestWrapper>
          <ScheduleSpecial />
        </TestWrapper>
      )
      
      // Navigate to step 3
      const bulkyButton = screen.getByText('Bulky').closest('button')
      fireEvent.click(bulkyButton)
      
      const nextButton = screen.getByRole('button', { name: /^next$/i })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText('Items and Quantity')).toBeInTheDocument()
      })
      
      const itemSelect = screen.getByDisplayValue('Select item')
      fireEvent.change(itemSelect, { target: { value: 'Sofa' } })
      
      const quantityInput = screen.getByPlaceholderText('Weight (kg)')
      fireEvent.change(quantityInput, { target: { value: '25' } })
      
      fireEvent.click(screen.getByRole('button', { name: /^next$/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Choose Date and Time')).toBeInTheDocument()
      })
      
      const dateSelect = screen.getByDisplayValue('-- choose date --')
      fireEvent.change(dateSelect, { target: { value: '2024-01-15' } })
      
      await waitFor(() => {
        expect(scApi.default.getSlots).toHaveBeenCalledWith('2024-01-15')
      })
    })

    it('should allow selecting time slot', async () => {
      render(
        <TestWrapper>
          <ScheduleSpecial />
        </TestWrapper>
      )
      
      // Navigate to step 3
      const bulkyButton = screen.getByText('Bulky').closest('button')
      fireEvent.click(bulkyButton)
      
      const nextButton = screen.getByRole('button', { name: /^next$/i })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText('Items and Quantity')).toBeInTheDocument()
      })
      
      const itemSelect = screen.getByDisplayValue('Select item')
      fireEvent.change(itemSelect, { target: { value: 'Sofa' } })
      
      const quantityInput = screen.getByPlaceholderText('Weight (kg)')
      fireEvent.change(quantityInput, { target: { value: '25' } })
      
      fireEvent.click(screen.getByRole('button', { name: /^next$/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Choose Date and Time')).toBeInTheDocument()
      })
      
      const dateSelect = screen.getByDisplayValue('-- choose date --')
      fireEvent.change(dateSelect, { target: { value: '2024-01-15' } })
      
      await waitFor(() => {
        expect(scApi.default.getSlots).toHaveBeenCalledWith('2024-01-15')
      })
      
      const slotSelect = screen.getByDisplayValue('-- choose slot --')
      fireEvent.change(slotSelect, { target: { value: 'Morning' } })
      
      expect(slotSelect.value).toBe('Morning')
    })
  })

  describe('Step 4: Location (Simplified)', () => {
    it('should render location step', async () => {
      render(
        <TestWrapper>
          <ScheduleSpecial />
        </TestWrapper>
      )
      
      // Navigate to step 4
      const bulkyButton = screen.getByText('Bulky').closest('button')
      fireEvent.click(bulkyButton)
      
      const nextButton = screen.getByRole('button', { name: /^next$/i })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText('Items and Quantity')).toBeInTheDocument()
      })
      
      const itemSelect = screen.getByDisplayValue('Select item')
      fireEvent.change(itemSelect, { target: { value: 'Sofa' } })
      
      const quantityInput = screen.getByPlaceholderText('Weight (kg)')
      fireEvent.change(quantityInput, { target: { value: '25' } })
      
      fireEvent.click(screen.getByRole('button', { name: /^next$/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Choose Date and Time')).toBeInTheDocument()
      })
      
      const dateSelect = screen.getByDisplayValue('-- choose date --')
      fireEvent.change(dateSelect, { target: { value: '2024-01-15' } })
      
      await waitFor(() => {
        expect(scApi.default.getSlots).toHaveBeenCalledWith('2024-01-15')
      })
      
      const slotSelect = screen.getByDisplayValue('-- choose slot --')
      fireEvent.change(slotSelect, { target: { value: 'Morning' } })
      
      fireEvent.click(screen.getByRole('button', { name: /^next$/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Pickup Location' })).toBeInTheDocument()
      })
    })

    it('should allow selecting location type', async () => {
      render(
        <TestWrapper>
          <ScheduleSpecial />
        </TestWrapper>
      )
      
      // Navigate to step 4
      const bulkyButton = screen.getByText('Bulky').closest('button')
      fireEvent.click(bulkyButton)
      
      const nextButton = screen.getByRole('button', { name: /^next$/i })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText('Items and Quantity')).toBeInTheDocument()
      })
      
      const itemSelect = screen.getByDisplayValue('Select item')
      fireEvent.change(itemSelect, { target: { value: 'Sofa' } })
      
      const quantityInput = screen.getByPlaceholderText('Weight (kg)')
      fireEvent.change(quantityInput, { target: { value: '25' } })
      
      fireEvent.click(screen.getByRole('button', { name: /^next$/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Choose Date and Time')).toBeInTheDocument()
      })
      
      const dateSelect = screen.getByDisplayValue('-- choose date --')
      fireEvent.change(dateSelect, { target: { value: '2024-01-15' } })
      
      await waitFor(() => {
        expect(scApi.default.getSlots).toHaveBeenCalledWith('2024-01-15')
      })
      
      const slotSelect = screen.getByDisplayValue('-- choose slot --')
      fireEvent.change(slotSelect, { target: { value: 'Morning' } })
      
      fireEvent.click(screen.getByRole('button', { name: /^next$/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Pickup Location' })).toBeInTheDocument()
      })
      
      const locationTypeSelect = screen.getByDisplayValue('Front door')
      fireEvent.change(locationTypeSelect, { target: { value: 'Garage' } })
      
      expect(locationTypeSelect.value).toBe('Garage')
    })

    it('should show geolocation button', async () => {
      render(
        <TestWrapper>
          <ScheduleSpecial />
        </TestWrapper>
      )
      
      // Navigate to step 4
      const bulkyButton = screen.getByText('Bulky').closest('button')
      fireEvent.click(bulkyButton)
      
      const nextButton = screen.getByRole('button', { name: /^next$/i })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText('Items and Quantity')).toBeInTheDocument()
      })
      
      const itemSelect = screen.getByDisplayValue('Select item')
      fireEvent.change(itemSelect, { target: { value: 'Sofa' } })
      
      const quantityInput = screen.getByPlaceholderText('Weight (kg)')
      fireEvent.change(quantityInput, { target: { value: '25' } })
      
      fireEvent.click(screen.getByRole('button', { name: /^next$/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Choose Date and Time')).toBeInTheDocument()
      })
      
      const dateSelect = screen.getByDisplayValue('-- choose date --')
      fireEvent.change(dateSelect, { target: { value: '2024-01-15' } })
      
      await waitFor(() => {
        expect(scApi.default.getSlots).toHaveBeenCalledWith('2024-01-15')
      })
      
      const slotSelect = screen.getByDisplayValue('-- choose slot --')
      fireEvent.change(slotSelect, { target: { value: 'Morning' } })
      
      fireEvent.click(screen.getByRole('button', { name: /^next$/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Pickup Location' })).toBeInTheDocument()
      })
      
      expect(screen.getByText('Get My Location')).toBeInTheDocument()
    })

    it('should show location search option', async () => {
      render(
        <TestWrapper>
          <ScheduleSpecial />
        </TestWrapper>
      )
      
      // Navigate to step 4
      const bulkyButton = screen.getByText('Bulky').closest('button')
      fireEvent.click(bulkyButton)
      
      const nextButton = screen.getByRole('button', { name: /^next$/i })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText('Items and Quantity')).toBeInTheDocument()
      })
      
      const itemSelect = screen.getByDisplayValue('Select item')
      fireEvent.change(itemSelect, { target: { value: 'Sofa' } })
      
      const quantityInput = screen.getByPlaceholderText('Weight (kg)')
      fireEvent.change(quantityInput, { target: { value: '25' } })
      
      fireEvent.click(screen.getByRole('button', { name: /^next$/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Choose Date and Time')).toBeInTheDocument()
      })
      
      const dateSelect = screen.getByDisplayValue('-- choose date --')
      fireEvent.change(dateSelect, { target: { value: '2024-01-15' } })
      
      await waitFor(() => {
        expect(scApi.default.getSlots).toHaveBeenCalledWith('2024-01-15')
      })
      
      const slotSelect = screen.getByDisplayValue('-- choose slot --')
      fireEvent.change(slotSelect, { target: { value: 'Morning' } })
      
      fireEvent.click(screen.getByRole('button', { name: /^next$/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Pickup Location' })).toBeInTheDocument()
      })
      
      expect(screen.getAllByText('Search Location')).toHaveLength(2)
    })
  })

  describe('API Integration', () => {
    it('should call calculateFee API', async () => {
      render(
        <TestWrapper>
          <ScheduleSpecial />
        </TestWrapper>
      )
      
      // Navigate to step 2
      const bulkyButton = screen.getByText('Bulky').closest('button')
      fireEvent.click(bulkyButton)
      
      const nextButton = screen.getByRole('button', { name: /^next$/i })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText('Items and Quantity')).toBeInTheDocument()
      })
      
      const itemSelect = screen.getByDisplayValue('Select item')
      fireEvent.change(itemSelect, { target: { value: 'Sofa' } })
      
      const quantityInput = screen.getByPlaceholderText('Weight (kg)')
      fireEvent.change(quantityInput, { target: { value: '25' } })
      
      await waitFor(() => {
        expect(scApi.default.calculateFee).toHaveBeenCalled()
      })
    })

    it('should call getSlots API', async () => {
      render(
        <TestWrapper>
          <ScheduleSpecial />
        </TestWrapper>
      )
      
      // Navigate to step 3
      const bulkyButton = screen.getByText('Bulky').closest('button')
      fireEvent.click(bulkyButton)
      
      const nextButton = screen.getByRole('button', { name: /^next$/i })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText('Items and Quantity')).toBeInTheDocument()
      })
      
      const itemSelect = screen.getByDisplayValue('Select item')
      fireEvent.change(itemSelect, { target: { value: 'Sofa' } })
      
      const quantityInput = screen.getByPlaceholderText('Weight (kg)')
      fireEvent.change(quantityInput, { target: { value: '25' } })
      
      fireEvent.click(screen.getByRole('button', { name: /^next$/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Choose Date and Time')).toBeInTheDocument()
      })
      
      const dateSelect = screen.getByDisplayValue('-- choose date --')
      fireEvent.change(dateSelect, { target: { value: '2024-01-15' } })
      
      await waitFor(() => {
        expect(scApi.default.getSlots).toHaveBeenCalledWith('2024-01-15')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      scApi.default.calculateFee.mockRejectedValue(new Error('API Error'))
      
      render(
        <TestWrapper>
          <ScheduleSpecial />
        </TestWrapper>
      )
      
      // Navigate to step 2
      const bulkyButton = screen.getByText('Bulky').closest('button')
      fireEvent.click(bulkyButton)
      
      const nextButton = screen.getByRole('button', { name: /^next$/i })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText('Items and Quantity')).toBeInTheDocument()
      })
      
      const itemSelect = screen.getByDisplayValue('Select item')
      fireEvent.change(itemSelect, { target: { value: 'Sofa' } })
      
      const quantityInput = screen.getByPlaceholderText('Weight (kg)')
      fireEvent.change(quantityInput, { target: { value: '25' } })
      
      await waitFor(() => {
        expect(scApi.default.calculateFee).toHaveBeenCalled()
      })
    })
  })
})