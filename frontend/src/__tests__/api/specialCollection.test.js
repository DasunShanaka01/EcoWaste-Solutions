import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import scApi from '../../api/specialCollection'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

describe('Special Collection API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateFee', () => {
    it('should calculate fee successfully', async () => {
      const mockData = {
        category: 'Bulky',
        items: 'Sofa',
        quantity: 25
      }
      
      const mockResponse = {
        data: { fee: 150.0 }
      }
      
      mockedAxios.post.mockResolvedValue(mockResponse)
      
      const result = await scApi.calculateFee(mockData)
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8081/api/special-collection/fee',
        mockData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      )
      
      expect(result).toEqual({ fee: 150.0 })
    })

    it('should handle calculate fee errors', async () => {
      const mockData = {
        category: 'Bulky',
        items: 'Sofa',
        quantity: 25
      }
      
      const mockError = new Error('Fee calculation failed')
      mockedAxios.post.mockRejectedValue(mockError)
      
      await expect(scApi.calculateFee(mockData)).rejects.toThrow('Fee calculation failed')
    })

    it('should handle different waste categories', async () => {
      const categories = ['Bulky', 'Hazardous', 'Organic', 'E-Waste', 'Recyclable', 'Other']
      
      for (const category of categories) {
        const mockData = {
          category,
          items: 'Test Item',
          quantity: 10
        }
        
        const mockResponse = {
          data: { fee: 100.0 }
        }
        
        mockedAxios.post.mockResolvedValue(mockResponse)
        
        await scApi.calculateFee(mockData)
        
        expect(mockedAxios.post).toHaveBeenCalledWith(
          'http://localhost:8081/api/special-collection/fee',
          mockData,
          expect.any(Object)
        )
      }
    })

    it('should handle edge case quantities', async () => {
      const testCases = [
        { quantity: 0, expectedFee: 0 },
        { quantity: 1, expectedFee: 50 },
        { quantity: 100, expectedFee: 500 },
        { quantity: 1000, expectedFee: 5000 }
      ]
      
      for (const testCase of testCases) {
        const mockData = {
          category: 'Bulky',
          items: 'Sofa',
          quantity: testCase.quantity
        }
        
        const mockResponse = {
          data: { fee: testCase.expectedFee }
        }
        
        mockedAxios.post.mockResolvedValue(mockResponse)
        
        const result = await scApi.calculateFee(mockData)
        
        expect(result.fee).toBe(testCase.expectedFee)
      }
    })
  })

  describe('getDates', () => {
    it('should get available dates successfully', async () => {
      const mockResponse = {
        data: ['2024-01-15', '2024-01-16', '2024-01-17']
      }
      
      mockedAxios.get.mockResolvedValue(mockResponse)
      
      const result = await scApi.getDates()
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8081/api/special-collection/dates',
        { withCredentials: true }
      )
      
      expect(result).toEqual(['2024-01-15', '2024-01-16', '2024-01-17'])
    })

    it('should handle empty dates response', async () => {
      const mockResponse = {
        data: []
      }
      
      mockedAxios.get.mockResolvedValue(mockResponse)
      
      const result = await scApi.getDates()
      
      expect(result).toEqual([])
    })

    it('should handle get dates errors', async () => {
      const mockError = new Error('Failed to get dates')
      mockedAxios.get.mockRejectedValue(mockError)
      
      await expect(scApi.getDates()).rejects.toThrow('Failed to get dates')
    })
  })

  describe('getSlots', () => {
    it('should get available slots for a date successfully', async () => {
      const date = '2024-01-15'
      const mockResponse = {
        data: ['Morning', 'Afternoon']
      }
      
      mockedAxios.get.mockResolvedValue(mockResponse)
      
      const result = await scApi.getSlots(date)
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8081/api/special-collection/slots',
        { params: { date }, withCredentials: true }
      )
      
      expect(result).toEqual(['Morning', 'Afternoon'])
    })

    it('should handle empty slots response', async () => {
      const date = '2024-01-15'
      const mockResponse = {
        data: []
      }
      
      mockedAxios.get.mockResolvedValue(mockResponse)
      
      const result = await scApi.getSlots(date)
      
      expect(result).toEqual([])
    })

    it('should handle get slots errors', async () => {
      const date = '2024-01-15'
      const mockError = new Error('Failed to get slots')
      mockedAxios.get.mockRejectedValue(mockError)
      
      await expect(scApi.getSlots(date)).rejects.toThrow('Failed to get slots')
    })

    it('should handle invalid date format', async () => {
      const invalidDate = 'invalid-date'
      const mockError = new Error('Invalid date format')
      mockedAxios.get.mockRejectedValue(mockError)
      
      await expect(scApi.getSlots(invalidDate)).rejects.toThrow('Invalid date format')
    })
  })

  describe('schedule', () => {
    it('should schedule collection successfully', async () => {
      const mockPayload = {
        category: 'Bulky',
        items: 'Sofa',
        quantity: 25,
        date: '2024-01-15',
        timeSlot: 'Morning',
        location: 'Front door',
        coordinates: {
          latitude: 6.9280,
          longitude: 79.8620,
          address: 'Colombo, Sri Lanka'
        },
        instructions: 'Please collect from front door',
        paymentMethod: 'card'
      }
      
      const mockResponse = {
        data: {
          collectionId: 'collection-123',
          fee: 150.0,
          status: 'Scheduled',
          paymentStatus: 'Unpaid'
        }
      }
      
      mockedAxios.post.mockResolvedValue(mockResponse)
      
      const result = await scApi.schedule(mockPayload)
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8081/api/special-collection/schedule',
        mockPayload,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      )
      
      expect(result).toEqual({
        collectionId: 'collection-123',
        fee: 150.0,
        status: 'Scheduled',
        paymentStatus: 'Unpaid'
      })
    })

    it('should handle scheduling errors', async () => {
      const mockPayload = {
        category: 'Bulky',
        items: 'Sofa',
        quantity: 25,
        date: '2024-01-15',
        timeSlot: 'Morning',
        location: 'Front door'
      }
      
      const mockError = new Error('Scheduling failed')
      mockedAxios.post.mockRejectedValue(mockError)
      
      await expect(scApi.schedule(mockPayload)).rejects.toThrow('Scheduling failed')
    })

    it('should handle validation errors', async () => {
      const invalidPayload = {
        category: '', // Empty category
        items: '',
        quantity: 0,
        date: '',
        timeSlot: '',
        location: ''
      }
      
      const mockError = {
        response: {
          data: 'Validation failed: All fields are required'
        }
      }
      
      mockedAxios.post.mockRejectedValue(mockError)
      
      await expect(scApi.schedule(invalidPayload)).rejects.toEqual(mockError)
    })

    it('should handle different payment methods', async () => {
      const paymentMethods = ['card', 'bank', 'cash']
      
      for (const method of paymentMethods) {
        const mockPayload = {
          category: 'Bulky',
          items: 'Sofa',
          quantity: 25,
          date: '2024-01-15',
          timeSlot: 'Morning',
          location: 'Front door',
          paymentMethod: method
        }
        
        const mockResponse = {
          data: {
            collectionId: 'collection-123',
            fee: 150.0,
            status: 'Scheduled',
            paymentStatus: 'Unpaid'
          }
        }
        
        mockedAxios.post.mockResolvedValue(mockResponse)
        
        await scApi.schedule(mockPayload)
        
        expect(mockedAxios.post).toHaveBeenCalledWith(
          'http://localhost:8081/api/special-collection/schedule',
          mockPayload,
          expect.any(Object)
        )
      }
    })
  })

  describe('listMine', () => {
    it('should get user collections successfully', async () => {
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
          paymentStatus: 'Paid'
        },
        {
          id: 'collection-2',
          category: 'E-Waste',
          items: 'Computer',
          quantity: 15,
          fee: 200.0,
          date: '2024-01-12',
          timeSlot: 'Afternoon',
          location: 'Garage',
          status: 'Collected',
          paymentStatus: 'Paid'
        }
      ]
      
      const mockResponse = {
        data: mockCollections
      }
      
      mockedAxios.get.mockResolvedValue(mockResponse)
      
      const result = await scApi.listMine()
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8081/api/special-collection/mine',
        { withCredentials: true }
      )
      
      expect(result).toEqual(mockCollections)
    })

    it('should handle empty collections list', async () => {
      const mockResponse = {
        data: []
      }
      
      mockedAxios.get.mockResolvedValue(mockResponse)
      
      const result = await scApi.listMine()
      
      expect(result).toEqual([])
    })

    it('should handle list mine errors', async () => {
      const mockError = new Error('Failed to get collections')
      mockedAxios.get.mockRejectedValue(mockError)
      
      await expect(scApi.listMine()).rejects.toThrow('Failed to get collections')
    })

    it('should handle authentication errors', async () => {
      const mockError = {
        response: {
          status: 401,
          data: 'Unauthorized'
        }
      }
      
      mockedAxios.get.mockRejectedValue(mockError)
      
      await expect(scApi.listMine()).rejects.toEqual(mockError)
    })
  })

  describe('reschedule', () => {
    it('should reschedule collection successfully', async () => {
      const id = 'collection-123'
      const payload = {
        date: '2024-01-16',
        timeSlot: 'Afternoon'
      }
      
      const mockResponse = {
        data: { success: true }
      }
      
      mockedAxios.post.mockResolvedValue(mockResponse)
      
      const result = await scApi.reschedule(id, payload)
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8081/api/special-collection/reschedule/collection-123',
        payload,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      )
      
      expect(result).toEqual({ success: true })
    })

    it('should handle reschedule errors', async () => {
      const id = 'collection-123'
      const payload = {
        date: '2024-01-16',
        timeSlot: 'Afternoon'
      }
      
      const mockError = new Error('Reschedule failed')
      mockedAxios.post.mockRejectedValue(mockError)
      
      await expect(scApi.reschedule(id, payload)).rejects.toThrow('Reschedule failed')
    })

    it('should handle reschedule validation errors', async () => {
      const id = 'collection-123'
      const invalidPayload = {
        date: 'invalid-date',
        timeSlot: 'Invalid'
      }
      
      const mockError = {
        response: {
          data: 'Invalid date or time slot'
        }
      }
      
      mockedAxios.post.mockRejectedValue(mockError)
      
      await expect(scApi.reschedule(id, invalidPayload)).rejects.toEqual(mockError)
    })

    it('should handle reschedule time restrictions', async () => {
      const id = 'collection-123'
      const payload = {
        date: '2024-01-15', // Too soon
        timeSlot: 'Morning'
      }
      
      const mockError = {
        response: {
          data: 'Rescheduling is only allowed more than 24 hours before the scheduled time'
        }
      }
      
      mockedAxios.post.mockRejectedValue(mockError)
      
      await expect(scApi.reschedule(id, payload)).rejects.toEqual(mockError)
    })
  })

  describe('pay', () => {
    it('should process payment successfully', async () => {
      const id = 'collection-123'
      const mockResponse = {
        data: { success: true }
      }
      
      mockedAxios.post.mockResolvedValue(mockResponse)
      
      const result = await scApi.pay(id)
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8081/api/special-collection/pay/collection-123',
        {},
        { withCredentials: true }
      )
      
      expect(result).toEqual({ success: true })
    })

    it('should handle payment errors', async () => {
      const id = 'collection-123'
      const mockError = new Error('Payment failed')
      mockedAxios.post.mockRejectedValue(mockError)
      
      await expect(scApi.pay(id)).rejects.toThrow('Payment failed')
    })
  })

  describe('payWithMethod', () => {
    it('should process payment with card method successfully', async () => {
      const id = 'collection-123'
      const method = 'card'
      const success = true
      
      const mockResponse = {
        data: { success: true }
      }
      
      mockedAxios.post.mockResolvedValue(mockResponse)
      
      const result = await scApi.payWithMethod(id, method, success)
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8081/api/special-collection/pay/collection-123',
        { method, success },
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      )
      
      expect(result).toEqual({ success: true })
    })

    it('should process payment with bank method successfully', async () => {
      const id = 'collection-123'
      const method = 'bank'
      const success = true
      
      const mockResponse = {
        data: { success: true }
      }
      
      mockedAxios.post.mockResolvedValue(mockResponse)
      
      const result = await scApi.payWithMethod(id, method, success)
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8081/api/special-collection/pay/collection-123',
        { method, success },
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      )
      
      expect(result).toEqual({ success: true })
    })

    it('should process payment with cash method successfully', async () => {
      const id = 'collection-123'
      const method = 'cash'
      const success = true
      
      const mockResponse = {
        data: { success: true }
      }
      
      mockedAxios.post.mockResolvedValue(mockResponse)
      
      const result = await scApi.payWithMethod(id, method, success)
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8081/api/special-collection/pay/collection-123',
        { method, success },
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      )
      
      expect(result).toEqual({ success: true })
    })

    it('should handle payment failure', async () => {
      const id = 'collection-123'
      const method = 'card'
      const success = false
      
      const mockError = {
        response: {
          data: 'Payment failed'
        }
      }
      
      mockedAxios.post.mockRejectedValue(mockError)
      
      await expect(scApi.payWithMethod(id, method, success)).rejects.toEqual(mockError)
    })

    it('should handle different payment methods', async () => {
      const paymentMethods = ['card', 'bank', 'cash']
      
      for (const method of paymentMethods) {
        const id = 'collection-123'
        const success = true
        
        const mockResponse = {
          data: { success: true }
        }
        
        mockedAxios.post.mockResolvedValue(mockResponse)
        
        await scApi.payWithMethod(id, method, success)
        
        expect(mockedAxios.post).toHaveBeenCalledWith(
          'http://localhost:8081/api/special-collection/pay/collection-123',
          { method, success },
          expect.any(Object)
        )
      }
    })
  })

  describe('downloadReceipt', () => {
    it('should download receipt successfully', async () => {
      const id = 'collection-123'
      const mockBlob = new Blob(['receipt content'])
      const mockResponse = {
        data: mockBlob
      }
      
      mockedAxios.get.mockResolvedValue(mockResponse)
      
      const result = await scApi.downloadReceipt(id)
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8081/api/special-collection/receipt/collection-123',
        { withCredentials: true, responseType: 'blob' }
      )
      
      expect(result).toEqual(mockResponse)
    })

    it('should handle receipt download errors', async () => {
      const id = 'collection-123'
      const mockError = new Error('Receipt download failed')
      mockedAxios.get.mockRejectedValue(mockError)
      
      await expect(scApi.downloadReceipt(id)).rejects.toThrow('Receipt download failed')
    })

    it('should handle invalid collection ID', async () => {
      const id = 'invalid-id'
      const mockError = {
        response: {
          status: 404,
          data: 'Collection not found'
        }
      }
      
      mockedAxios.get.mockRejectedValue(mockError)
      
      await expect(scApi.downloadReceipt(id)).rejects.toEqual(mockError)
    })
  })

  describe('cancel', () => {
    it('should cancel collection successfully', async () => {
      const id = 'collection-123'
      const mockResponse = {
        data: { success: true }
      }
      
      mockedAxios.post.mockResolvedValue(mockResponse)
      
      const result = await scApi.cancel(id)
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8081/api/special-collection/cancel/collection-123',
        {},
        { withCredentials: true }
      )
      
      expect(result).toEqual({ success: true })
    })

    it('should handle cancel errors', async () => {
      const id = 'collection-123'
      const mockError = new Error('Cancel failed')
      mockedAxios.post.mockRejectedValue(mockError)
      
      await expect(scApi.cancel(id)).rejects.toThrow('Cancel failed')
    })

    it('should handle cancel time restrictions', async () => {
      const id = 'collection-123'
      const mockError = {
        response: {
          data: 'Cancellation is only allowed more than 8 hours before the scheduled time'
        }
      }
      
      mockedAxios.post.mockRejectedValue(mockError)
      
      await expect(scApi.cancel(id)).rejects.toEqual(mockError)
    })

    it('should handle cancel for non-existent collection', async () => {
      const id = 'non-existent'
      const mockError = {
        response: {
          status: 404,
          data: 'Collection not found'
        }
      }
      
      mockedAxios.post.mockRejectedValue(mockError)
      
      await expect(scApi.cancel(id)).rejects.toEqual(mockError)
    })
  })

  describe('getMapCollections', () => {
    it('should get map collections successfully', async () => {
      const mockCollections = [
        {
          id: 'collection-1',
          category: 'Bulky',
          latitude: 6.9280,
          longitude: 79.8620,
          status: 'Scheduled'
        },
        {
          id: 'collection-2',
          category: 'E-Waste',
          latitude: 6.9290,
          longitude: 79.8630,
          status: 'Scheduled'
        }
      ]
      
      const mockResponse = {
        data: mockCollections
      }
      
      mockedAxios.get.mockResolvedValue(mockResponse)
      
      const result = await scApi.getMapCollections()
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8081/api/special-collection/map',
        { withCredentials: true }
      )
      
      expect(result).toEqual(mockCollections)
    })

    it('should handle empty map collections', async () => {
      const mockResponse = {
        data: []
      }
      
      mockedAxios.get.mockResolvedValue(mockResponse)
      
      const result = await scApi.getMapCollections()
      
      expect(result).toEqual([])
    })

    it('should handle get map collections errors', async () => {
      const mockError = new Error('Failed to get map collections')
      mockedAxios.get.mockRejectedValue(mockError)
      
      await expect(scApi.getMapCollections()).rejects.toThrow('Failed to get map collections')
    })
  })

  describe('getDashboardStats', () => {
    it('should get dashboard stats successfully', async () => {
      const mockStats = {
        totalCollections: 10,
        collectedCollections: 7,
        pendingCollections: 3,
        collectedByDate: {
          '2024-01-15': 3,
          '2024-01-16': 4
        }
      }
      
      const mockResponse = {
        data: mockStats
      }
      
      mockedAxios.get.mockResolvedValue(mockResponse)
      
      const result = await scApi.getDashboardStats()
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8081/api/special-collection/dashboard/stats',
        { withCredentials: true }
      )
      
      expect(result).toEqual(mockStats)
    })

    it('should handle get dashboard stats errors', async () => {
      const mockError = new Error('Failed to get dashboard stats')
      mockedAxios.get.mockRejectedValue(mockError)
      
      await expect(scApi.getDashboardStats()).rejects.toThrow('Failed to get dashboard stats')
    })
  })

  describe('searchCollection', () => {
    it('should search collection successfully', async () => {
      const collectionId = 'collection-123'
      const mockCollection = {
        id: 'collection-123',
        category: 'Bulky',
        items: 'Sofa',
        quantity: 25,
        fee: 150.0,
        status: 'Scheduled',
        paymentStatus: 'Paid'
      }
      
      const mockResponse = {
        data: {
          found: true,
          collection: mockCollection,
          isCollected: false,
          message: 'Collection found'
        }
      }
      
      mockedAxios.get.mockResolvedValue(mockResponse)
      
      const result = await scApi.searchCollection(collectionId)
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8081/api/special-collection/search/collection-123',
        { withCredentials: true }
      )
      
      expect(result).toEqual({
        found: true,
        collection: mockCollection,
        isCollected: false,
        message: 'Collection found'
      })
    })

    it('should handle collection not found', async () => {
      const collectionId = 'non-existent'
      const mockResponse = {
        data: {
          found: false,
          message: 'Collection not found'
        }
      }
      
      mockedAxios.get.mockResolvedValue(mockResponse)
      
      const result = await scApi.searchCollection(collectionId)
      
      expect(result).toEqual({
        found: false,
        message: 'Collection not found'
      })
    })

    it('should handle search collection errors', async () => {
      const collectionId = 'collection-123'
      const mockError = new Error('Search failed')
      mockedAxios.get.mockRejectedValue(mockError)
      
      await expect(scApi.searchCollection(collectionId)).rejects.toThrow('Search failed')
    })

    it('should handle invalid collection ID format', async () => {
      const collectionId = 'invalid-format'
      const mockError = {
        response: {
          data: 'Invalid collection ID format'
        }
      }
      
      mockedAxios.get.mockRejectedValue(mockError)
      
      await expect(scApi.searchCollection(collectionId)).rejects.toEqual(mockError)
    })
  })

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      mockedAxios.post.mockRejectedValue(networkError)
      
      await expect(scApi.calculateFee({})).rejects.toThrow('Network Error')
    })

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded')
      mockedAxios.get.mockRejectedValue(timeoutError)
      
      await expect(scApi.getDates()).rejects.toThrow('timeout of 5000ms exceeded')
    })

    it('should handle server errors (500)', async () => {
      const serverError = {
        response: {
          status: 500,
          data: 'Internal Server Error'
        }
      }
      
      mockedAxios.post.mockRejectedValue(serverError)
      
      await expect(scApi.schedule({})).rejects.toEqual(serverError)
    })

    it('should handle bad request errors (400)', async () => {
      const badRequestError = {
        response: {
          status: 400,
          data: 'Bad Request'
        }
      }
      
      mockedAxios.post.mockRejectedValue(badRequestError)
      
      await expect(scApi.schedule({})).rejects.toEqual(badRequestError)
    })

    it('should handle forbidden errors (403)', async () => {
      const forbiddenError = {
        response: {
          status: 403,
          data: 'Forbidden'
        }
      }
      
      mockedAxios.get.mockRejectedValue(forbiddenError)
      
      await expect(scApi.listMine()).rejects.toEqual(forbiddenError)
    })

    it('should handle null and undefined responses', async () => {
      const mockResponse = {
        data: null
      }
      
      mockedAxios.get.mockResolvedValue(mockResponse)
      
      const result = await scApi.getDates()
      
      expect(result).toBeNull()
    })

    it('should handle malformed JSON responses', async () => {
      const mockError = new Error('Unexpected token < in JSON at position 0')
      mockedAxios.get.mockRejectedValue(mockError)
      
      await expect(scApi.getDates()).rejects.toThrow('Unexpected token < in JSON at position 0')
    })
  })

  describe('Request Configuration', () => {
    it('should include credentials in all requests', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] })
      mockedAxios.post.mockResolvedValue({ data: {} })
      
      await scApi.getDates()
      await scApi.calculateFee({})
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        { withCredentials: true }
      )
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          withCredentials: true
        })
      )
    })

    it('should include correct content type headers for POST requests', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} })
      
      await scApi.calculateFee({})
      await scApi.schedule({})
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' }
        })
      )
    })

    it('should use correct response type for blob requests', async () => {
      const mockBlob = new Blob(['receipt content'])
      mockedAxios.get.mockResolvedValue({ data: mockBlob })
      
      await scApi.downloadReceipt('collection-123')
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          responseType: 'blob'
        })
      )
    })
  })
})
