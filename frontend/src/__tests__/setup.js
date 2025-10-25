import { vi } from 'vitest'

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: null }),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    useHistory: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      goBack: vi.fn(),
      goForward: vi.fn()
    })
  }
})

// Mock React Context
vi.mock('../Pages/Users/UserContext', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'USER'
    },
    setUser: vi.fn(),
    loading: false,
    logout: vi.fn()
  }),
  UserProvider: ({ children }) => children
}))

// Mock API modules
vi.mock('../api/auth', () => ({
  default: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    registerStep1: vi.fn(),
    registerStep2: vi.fn(),
    registerStep3: vi.fn(),
    verifyEmail: vi.fn(),
    sendVerificationCode: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    getUserWasteSubmissions: vi.fn(),
    deleteWasteSubmission: vi.fn(),
    updateWasteSubmission: vi.fn()
  }
}))

vi.mock('../api/specialCollection', () => ({
  default: {
    calculateFee: vi.fn(),
    getDates: vi.fn(),
    getSlots: vi.fn(),
    schedule: vi.fn(),
    listMine: vi.fn(),
    reschedule: vi.fn(),
    pay: vi.fn(),
    payWithMethod: vi.fn(),
    downloadReceipt: vi.fn(),
    cancel: vi.fn(),
    getMapCollections: vi.fn(),
    getDashboardStats: vi.fn(),
    searchCollection: vi.fn()
  }
}))

// Mock Google Maps
vi.mock('@react-google-maps/api', () => ({
  GoogleMap: () => <div data-testid="google-map">Google Map</div>,
  Marker: () => <div data-testid="marker">Marker</div>,
  InfoWindow: () => <div data-testid="info-window">Info Window</div>,
  useJsApiLoader: () => ({
    isLoaded: true,
    loadError: null
  })
}))

// Mock QR Scanner
vi.mock('@yudiel/react-qr-scanner', () => ({
  QrScanner: () => <div data-testid="qr-scanner">QR Scanner</div>
}))

// Mock session API
vi.mock('react-session-api', () => ({
  useSession: () => ({
    session: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER'
      }
    },
    setSession: vi.fn(),
    clearSession: vi.fn()
  })
}))

// Mock web vitals
vi.mock('../reportWebVitals', () => ({
  default: vi.fn()
}))

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'USER',
    ...overrides
  }),
  
  createMockCollection: (overrides = {}) => ({
    id: 'test-collection-id',
    category: 'Bulky',
    items: 'Sofa',
    quantity: 25,
    fee: 150.0,
    date: '2024-01-15',
    timeSlot: 'Morning',
    location: 'Front door',
    status: 'Scheduled',
    paymentStatus: 'Paid',
    instructions: 'Please collect from front door',
    createdAt: '2024-01-10T10:00:00Z',
    ...overrides
  }),
  
  createMockWasteAccount: (overrides = {}) => ({
    accountId: 'test-account-id',
    location: {
      latitude: 6.9280,
      longitude: 79.8620,
      address: 'Colombo, Sri Lanka'
    },
    capacity: 75.5,
    ...overrides
  })
}
