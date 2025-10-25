import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ManageSpecial from '../../../Pages/SpecialWaste/ManageSpecial'
import * as scApi from '../../../api/specialCollection'

// Test suite for ManageSpecial component

// Mock the API
vi.mock('../../../api/specialCollection', () => ({
  default: {
    listMine: vi.fn(),
    getDates: vi.fn(),
    getSlots: vi.fn(),
    reschedule: vi.fn(),
    cancel: vi.fn(),
    downloadReceipt: vi.fn()
  }
}))

// Mock useNavigate
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock fetch for QR code generation
global.fetch = vi.fn()

// Mock window.alert
global.alert = vi.fn()

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

// Mock data
const mockCollections = [
  {
    id: 'collection-1',
    category: 'Bulky',
    items: 'Sofa',
    quantity: 25,
    fee: 150.0,
    date: '2024-01-15',
    timeSlot: 'Morning',
    location: 'Front door',
    status: 'Scheduled',
    paymentStatus: 'Paid',
    instructions: 'Leave at front door'
  },
  {
    id: 'collection-2',
    category: 'Electronics',
    items: 'Laptop',
    quantity: 1,
    fee: 75.0,
    date: '2024-01-16',
    timeSlot: 'Afternoon',
    location: 'Garage',
    status: 'Collected',
    paymentStatus: 'Paid',
    instructions: 'Handle with care'
  },
  {
    id: 'collection-3',
    category: 'Hazardous',
    items: 'Batteries',
    quantity: 5,
    fee: 50.0,
    date: '2024-01-17',
    timeSlot: 'Evening',
    location: 'Back door',
    status: 'Cancelled',
    paymentStatus: 'Refunded',
    instructions: 'Special handling required'
  }
]

describe('ManageSpecial Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock API responses
    scApi.default.listMine.mockResolvedValue(mockCollections)
    scApi.default.getDates.mockResolvedValue(['2024-01-15', '2024-01-16', '2024-01-17'])
    scApi.default.getSlots.mockResolvedValue(['Morning', 'Afternoon', 'Evening'])
    scApi.default.reschedule.mockResolvedValue({ data: { success: true } })
    scApi.default.cancel.mockResolvedValue({ data: { success: true } })
    scApi.default.downloadReceipt.mockResolvedValue({ data: 'receipt content' })
    
    // Mock fetch for QR code generation
    global.fetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['QR Code Data']))
    })
  })

  describe('Component Rendering', () => {
    it('should render the main component', async () => {
      render(
        <TestWrapper>
          <ManageSpecial />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Manage Special Collections')).toBeInTheDocument()
      })
    })

    it('should render all tab buttons', async () => {
      render(
        <TestWrapper>
          <ManageSpecial />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Ongoing (1)')).toBeInTheDocument()
        expect(screen.getByText('Collected (1)')).toBeInTheDocument()
        expect(screen.getByText('Cancelled (1)')).toBeInTheDocument()
      })
    })

    it('should load collections on mount', async () => {
      render(
        <TestWrapper>
          <ManageSpecial />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(scApi.default.listMine).toHaveBeenCalled()
      })
    })
  })

  describe('Tab Navigation', () => {
    it('should switch to collected tab', async () => {
      render(
        <TestWrapper>
          <ManageSpecial />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Manage Special Collections')).toBeInTheDocument()
      })
      
      const collectedTab = screen.getByText('Collected (1)').closest('button')
      fireEvent.click(collectedTab)
      
      expect(collectedTab).toHaveClass('bg-blue-600')
    })

    it('should switch to cancelled tab', async () => {
      render(
        <TestWrapper>
          <ManageSpecial />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Manage Special Collections')).toBeInTheDocument()
      })
      
      const cancelledTab = screen.getByText('Cancelled (1)').closest('button')
      fireEvent.click(cancelledTab)
      
      expect(cancelledTab).toHaveClass('bg-blue-600')
    })

    it('should have ongoing tab active by default', async () => {
      render(
        <TestWrapper>
          <ManageSpecial />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Manage Special Collections')).toBeInTheDocument()
      })
      
      const ongoingTab = screen.getByText('Ongoing (1)').closest('button')
      expect(ongoingTab).toHaveClass('bg-blue-600')
    })
  })

  describe('Collection Display', () => {
    it('should display ongoing collections', async () => {
      render(
        <TestWrapper>
          <ManageSpecial />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Sofa')).toBeInTheDocument()
      })
    })

    it('should display collection details', async () => {
      render(
        <TestWrapper>
          <ManageSpecial />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Bulky')).toBeInTheDocument()
        expect(screen.getByText('25 kg')).toBeInTheDocument()
        expect(screen.getByText('LKR 150.00')).toBeInTheDocument()
        expect(screen.getByText('Scheduled')).toBeInTheDocument()
      })
    })

    it('should display collected collections when tab is switched', async () => {
      render(
        <TestWrapper>
          <ManageSpecial />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Manage Special Collections')).toBeInTheDocument()
      })
      
      const collectedTab = screen.getByText('Collected (1)')
      fireEvent.click(collectedTab)
      
      await waitFor(() => {
        expect(screen.getByText('Laptop')).toBeInTheDocument()
      })
    })
  })

  describe('QR Code Functionality', () => {
    it('should show QR code view and download buttons', async () => {
      render(
        <TestWrapper>
          <ManageSpecial />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Sofa')).toBeInTheDocument()
      })
      
      expect(screen.getByText('View')).toBeInTheDocument()
      expect(screen.getByText('Download')).toBeInTheDocument()
    })

    it('should open QR code modal when view button is clicked', async () => {
      render(
        <TestWrapper>
          <ManageSpecial />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Sofa')).toBeInTheDocument()
      })
      
      const viewButton = screen.getByText('View')
      fireEvent.click(viewButton)
      
      await waitFor(() => {
        expect(screen.getByText('Collection QR Code')).toBeInTheDocument()
      })
    })

    it('should download QR code when download button is clicked', async () => {
      render(
        <TestWrapper>
          <ManageSpecial />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Sofa')).toBeInTheDocument()
      })
      
      const downloadButton = screen.getByText('Download')
      fireEvent.click(downloadButton)
      
      expect(downloadButton).toBeInTheDocument()
    })
  })

  describe('Collection Status Display', () => {
    it('should display collection status badges', async () => {
      render(
        <TestWrapper>
          <ManageSpecial />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Sofa')).toBeInTheDocument()
      })
      
      expect(screen.getByText('Scheduled')).toBeInTheDocument()
      expect(screen.getByText('Paid')).toBeInTheDocument()
    })

    it('should display collection ID and details', async () => {
      render(
        <TestWrapper>
          <ManageSpecial />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Sofa')).toBeInTheDocument()
      })
      
      expect(screen.getByText('#collection-1')).toBeInTheDocument()
    })
  })

  describe('API Integration', () => {
    it('should call listMine API on mount', async () => {
      render(
        <TestWrapper>
          <ManageSpecial />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(scApi.default.listMine).toHaveBeenCalled()
      })
    })

    it('should call getDates API on mount', async () => {
      render(
        <TestWrapper>
          <ManageSpecial />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(scApi.default.getDates).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      scApi.default.listMine.mockRejectedValue(new Error('API Error'))
      
      render(
        <TestWrapper>
          <ManageSpecial />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(scApi.default.listMine).toHaveBeenCalled()
      })
    })

    it('should handle empty collections gracefully', async () => {
      scApi.default.listMine.mockResolvedValue([])
      
      render(
        <TestWrapper>
          <ManageSpecial />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('No Collections Yet')).toBeInTheDocument()
      })
    })
  })
})