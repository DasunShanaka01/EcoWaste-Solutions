# EcoWaste Solutions 🗑️♻️

A comprehensive waste management system that connects users, collectors, and administrators in an efficient, eco-friendly waste collection and recycling ecosystem.

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Features Detail](#features-detail)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

EcoWaste Solutions is a full-stack web application designed to streamline waste collection and recycling processes. It enables users to schedule waste collections, earn rewards through a digital wallet, and track their waste disposal history. The system supports multiple user roles including regular users, collectors, and administrators.

### Problem Statement
Traditional waste management systems lack digital integration, making it difficult for users to schedule collections, track waste disposal, and manage recyclables efficiently. EcoWaste Solutions addresses these challenges by providing:
- Easy scheduling of waste collections
- Real-time tracking and GPS integration
- Digital wallet rewards system
- QR code-based verification
- Special waste collection with dynamic pricing

### Solution
An integrated platform featuring:
- **User-friendly web interface** with multi-step forms
- **Google Maps integration** for location selection
- **QR code generation and scanning** for verification
- **Digital wallet system** with points-based rewards
- **Email notifications** for collection updates
- **Admin dashboard** for system management

## ✨ Key Features

### For Users
- 🏠 **Waste Collection Scheduling**: Schedule regular recyclable waste collections
- 🆘 **Special Waste Collection**: Schedule bulky, hazardous, or e-waste collections with dynamic fee calculation
- 💰 **Digital Wallet**: Earn points for waste disposal, redeem rewards
- 📍 **GPS Integration**: Select pickup locations on interactive maps
- 📱 **QR Code Support**: Get QR codes for collection tracking
- 📧 **Email Notifications**: Receive collection updates and confirmations
- 📊 **Account Management**: View waste account, collection history, and profile

### For Collectors
- 🗺️ **Collection Route Management**: View assigned routes on interactive maps
- 📱 **QR Code Scanner**: Scan and verify collections
- ✅ **Collection Processing**: Update collection status, record actual weights
- 📋 **Collection History**: Track past collections
- 💰 **Payment Recording**: Process cash, card, or bank transfer payments
- 📊 **Dashboard**: Overview of assigned tasks and collections

### For Administrators
- 📊 **Analytics Dashboard**: System-wide statistics and reports
- 👥 **User Management**: Manage users, collectors, and permissions
- 🗑️ **Collection Monitoring**: View and manage all waste collections
- 📈 **Reports**: Generate detailed reports and analytics

## 🛠️ Technology Stack

### Frontend
- **React** 19.2.0 - UI framework
- **React Router** 7.9.4 - Navigation
- **Axios** 1.12.2 - HTTP client
- **TailwindCSS** 3.4.18 - Styling
- **@react-google-maps/api** 2.20.7 - Map integration
- **@yudiel/react-qr-scanner** 2.4.1 - QR code scanning
- **React Icons** 5.5.0 - Icon library
- **Vitest** 4.0.3 - Testing framework

### Backend
- **Spring Boot** 3.2.0 - Framework
- **Java** 17 - Programming language
- **MongoDB** - NoSQL database
- **Spring Security** - Authentication & authorization
- **JWT (jjwt)** 0.11.5 - Token-based authentication
- **Spring Mail** - Email services
- **Google ZXing** 3.5.2 - QR code generation
- **Jackson** - JSON processing
- **Lombok** - Code generation
- **Maven** - Build tool

### DevOps
- **MongoDB Atlas** - Cloud database
- **Spring Boot DevTools** - Development tools

## 🏗️ Architecture

### Project Structure
```
EcoWaste-Solutions/
├── Backend/                          # Spring Boot Backend
│   ├── src/main/java/com/example/backend/
│   │   ├── config/                   # Configuration classes
│   │   │   ├── SecurityConfig.java
│   │   │   ├── JwtUtil.java
│   │   │   ├── MailConfig.java
│   │   │   └── JacksonConfig.java
│   │   ├── controller/              # REST Controllers
│   │   │   ├── AuthController.java
│   │   │   ├── CollectionController.java
│   │   │   ├── DigitalWalletController.java
│   │   │   ├── SpecialCollectionController.java
│   │   │   └── WasteController.java
│   │   ├── dto/                     # Data Transfer Objects
│   │   ├── exception/               # Exception handling
│   │   ├── model/                   # Entity models
│   │   │   ├── enums/               # Enumerations
│   │   │   └── valueobjects/        # Value objects
│   │   ├── repository/              # Data access layer
│   │   ├── service/                 # Business logic
│   │   ├── strategy/                # Strategy pattern implementations
│   │   ├── util/                    # Utility classes
│   │   └── validator/               # Validation logic
│   └── src/main/resources/
│       └── application.properties   # Configuration
│
├── frontend/                         # React Frontend
│   ├── public/                      # Static files
│   ├── src/
│   │   ├── Pages/                   # Page components
│   │   │   ├── Admin/
│   │   │   ├── Collector/
│   │   │   ├── Home/
│   │   │   ├── SpecialWaste/
│   │   │   ├── Users/
│   │   │   └── Waste/
│   │   ├── components/              # Reusable components
│   │   ├── api/                     # API integration
│   │   ├── hooks/                   # Custom React hooks
│   │   └── utils/                   # Utility functions
│   └── package.json
└── README.md
```

### Design Patterns
- **Strategy Pattern**: Fee calculation and scheduling strategies
- **Repository Pattern**: Data access abstraction
- **DTO Pattern**: Data transfer between layers
- **MVC Architecture**: Separation of concerns
- **SOLID Principles**: Applied throughout the codebase

## 🚀 Getting Started

### Prerequisites
- **Java Development Kit (JDK)** 17 or higher
- **Node.js** 14 or higher
- **MongoDB** (local or Atlas account)
- **Maven** 3.6 or higher
- **Git**

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/DasunShanaka01/EcoWaste-Solutions.git
cd EcoWaste-Solutions
```

#### 2. Backend Setup

```bash
cd Backend
```

Configure MongoDB connection in `src/main/resources/application.properties`:
```properties
spring.data.mongodb.uri=mongodb://localhost:27017/eco_waste_db
# or
spring.data.mongodb.uri=mongodb+srv://username:password@cluster.mongodb.net/eco_waste_db
```

Configure email settings:
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

Build and run the backend:
```bash
mvn clean install
mvn spring-boot:run
```

The backend will start on `http://localhost:8081`

#### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

The frontend will start on `http://localhost:3000`

### Default Credentials

#### Admin
- **Email**: admin@gmail.com
- **Password**: admin123

#### Collector
- **Email**: kamal@gmail.com or sunil@gmail.com
- **Password**: kamal123 or sunil123

#### User
- Register a new account through the registration flow

## 📚 API Documentation

### Authentication Endpoints

#### Register (Step 1)
```http
POST /api/auth/register/step1
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Send Verification Code
```http
POST /api/auth/send-verification
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "john@example.com",
  "code": "123456"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### Waste Collection Endpoints

#### Submit Waste Collection
```http
POST /api/waste/submit
Content-Type: application/json

{
  "fullName": "John Doe",
  "phoneNumber": "+1234567890",
  "email": "john@example.com",
  "items": [
    {
      "category": "Plastic",
      "description": "Water bottles",
      "weight": 2.5,
      "quantity": 10
    }
  ],
  "submissionMethod": "Home Pickup",
  "pickupDate": "2024-01-15",
  "pickupTimeSlot": "Morning",
  "location": {
    "address": "123 Main St",
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

#### Get Waste Accounts by User
```http
GET /api/auth/waste-accounts/{userId}
```

#### Scan QR Code
```http
POST /api/waste/scan-qr
Content-Type: application/json

{
  "qrData": "WA123456789ABC"
}
```

### Special Collection Endpoints

#### Calculate Fee
```http
POST /api/special-collection/calculate-fee
Content-Type: application/json

{
  "category": "Bulky",
  "quantity": 3,
  "date": "2024-01-15"
}
```

#### Schedule Collection
```http
POST /api/special-collection/schedule
Content-Type: application/json

{
  "userId": "user123",
  "category": "Bulky",
  "items": "Old furniture",
  "quantity": 3,
  "date": "2024-01-15",
  "timeSlot": "Morning",
  "location": "123 Main St",
  "coordinates": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "instructions": "Please handle carefully",
  "paymentMethod": "Card"
}
```

#### Get Available Dates
```http
GET /api/special-collection/available-dates?days=14
```

#### Get Available Time Slots
```http
GET /api/special-collection/slots/{date}
```

### Digital Wallet Endpoints

#### Get Wallet
```http
GET /api/digital-wallet/{userId}
```

#### Add Points
```http
POST /api/digital-wallet/{userId}/add-points
Content-Type: application/json

{
  "points": 100,
  "description": "Waste collection reward"
}
```

## 👥 User Roles

### ADMIN
- Full system access
- User and collector management
- Collection oversight
- Analytics and reporting
- System configuration

### COLLECTOR
- View assigned collection routes
- Scan QR codes for verification
- Update collection status
- Record actual weights and measurements
- Process payments
- View collection history

### USER
- Schedule waste collections
- Manage waste account
- View digital wallet balance
- Schedule special waste collections
- Track collection history
- Update profile information

## 🎨 Features Detail

### 1. Waste Collection System
- **Multi-step form** with validation
- **Category-based** waste submission (Plastic, Paper, Glass, Metal, E-Waste)
- **GPS location picker** using Google Maps
- **Time slot selection** (Morning/Afternoon)
- **Weight estimation** and payback calculation
- **QR code generation** for tracking
- **Photo upload** support

### 2. Special Waste Collection
- **Dynamic fee calculation** based on category and quantity
- **Available date and slot** checking
- **Payment integration** (Cash, Card, Bank Transfer)
- **Email confirmation** with QR code
- **Rescheduling** capability
- **Cancel collection** with restrictions

### 3. Digital Wallet
- **Points-based** reward system
- **Transaction history** tracking
- **Balance management** (add/deduct points)
- **Auto-crediting** on collection completion
- **Transaction descriptions** for transparency

### 4. QR Code System
- **Collection tracking** QR codes
- **Mobile scanning** support
- **Manual entry** fallback
- **Backend verification** of scanned data
- **Account linking** via QR data

### 5. Google Maps Integration
- **Location selection** with map interface
- **Geocoding** support
- **Route visualization** for collectors
- **Marker placement** for collection points
- **Distance calculation** for routing

### 6. Email Notifications
- **Registration** verification codes
- **Collection confirmations**
- **Status update** notifications
- **Payment receipts**
- **Collection reminders**

### 7. Security Features
- **Password encryption** using BCrypt
- **Session-based** authentication
- **Email verification** for new users
- **CSRF protection**
- **CORS configuration**
- **Role-based** access control

## 🧪 Testing

### Backend Tests
```bash
cd Backend
mvn test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Test Coverage
- Unit tests for services and utilities
- Integration tests for APIs
- Component tests for React components
- End-to-end flow tests

## 📊 Database Schema

### Collections
- `users` - User accounts and authentication
- `wastes` - Regular waste collection requests
- `special_collections` - Special waste collection requests
- `digital_wallets` - Digital wallet accounts
- `verification_tokens` - Email verification tokens
- `collections` - Collector-processed waste records

### Key Entities

#### User
```javascript
{
  id: String,
  name: String,
  phone: String,
  email: String,
  password: String (hashed),
  role: String (ADMIN, COLLECTOR, USER),
  emailVerified: Boolean,
  active: Boolean,
  hasOverduePayments: Boolean,
  createdAt: Instant
}
```

#### Waste
```javascript
{
  id: ObjectId,
  userId: String,
  items: Array,
  status: String,
  submissionMethod: String,
  pickupDate: LocalDate,
  location: GeoLocation,
  totalWeightKg: Double,
  qrCodeBase64: String,
  // ... more fields
}
```

#### DigitalWallet
```javascript
{
  id: String,
  userId: String,
  points: Integer,
  transactions: Array<Transaction>,
  createdAt: Instant,
  updatedAt: Instant
}
```

## 🔄 Development Workflow

### Code Style
- **Backend**: Follow Java naming conventions
- **Frontend**: Follow React best practices
- **Comments**: Document complex logic
- **Git**: Use meaningful commit messages

### Branch Strategy
- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `fix/*` - Bug fixes

### Commit Convention
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow the code style and conventions
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass
- Request code review before merging

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Authors

- **Development Team** - EcoWaste Solutions

## 🙏 Acknowledgments

- Spring Boot community
- React team
- MongoDB for database solutions
- Google Maps API
- All contributors and testers

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Email: support@ecowaste.com
- Documentation: [Wiki](https://github.com/DasunShanaka01/EcoWaste-Solutions/wiki)

---

Made with ❤️ for a cleaner planet 🌍

