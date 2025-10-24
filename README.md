# EcoWaste-Solutions

A full-stack web application for eco-friendly waste management solutions built with Spring Boot and React.

## 🏗️ Project Structure

```
EcoWaste-Solutions/
├── backend/          # Spring Boot API (Java 17)
│   ├── src/
│   └── pom.xml
├── frontend/         # React Application
│   ├── src/
│   └── package.json
└── README.md
```

## 🛠️ Prerequisites

Before running this project, make sure you have the following installed:

### Required Software:

1. **Java Development Kit (JDK) 17 or higher**

   - Download from: https://adoptium.net/
   - Verify installation: `java -version`

2. **Node.js (v16 or higher) and npm**

   - Download from: https://nodejs.org/
   - Verify installation: `node -v` and `npm -v`

3. **Maven** (Optional - project includes Maven wrapper)

   - Download from: https://maven.apache.org/
   - Or use the included `mvnw` (Maven wrapper)

4. **MongoDB Atlas Account** (Database)
   - The project uses MongoDB Atlas cloud database
   - Connection string is already configured

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/DasunShanaka01/EcoWaste-Solutions.git
cd EcoWaste-Solutions
```

### 2. Backend Setup (Spring Boot)

Navigate to the backend directory:

```bash
cd backend
```

#### Install Dependencies & Run:

```bash
# Using Maven wrapper (Recommended)
./mvnw spring-boot:run

# OR using Maven (if installed)
mvn spring-boot:run

# OR using Maven wrapper on Windows
mvnw.cmd spring-boot:run
```

The backend will start on: `http://localhost:8080`

### 3. Frontend Setup (React)

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

#### Install Dependencies:

```bash
npm install
```

#### Run Development Server:

```bash
npm start
```

The frontend will start on: `http://localhost:3000`

## 🖥️ Running the Application

### Step-by-Step Guide:

1. **Start Backend First:**

   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

   Wait for "Started BackendApplication" message

2. **Start Frontend (in new terminal):**

   ```bash
   cd frontend
   npm install  # Only needed first time
   npm start
   ```

3. **Access Application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - The React app will automatically proxy API requests to the backend

## 📡 API Endpoints

The backend provides the following main endpoints:

- **Authentication:** `/api/auth/*`
- **User Management:** `/api/users/*`
- **Waste Management:** `/api/waste/*`

## 🗄️ Database Configuration

The project uses MongoDB Atlas with the connection already configured in `application.properties`. The database includes:

- User authentication and registration
- Waste management data
- Email verification tokens

## 🎨 Frontend Features

- **React 19** with modern hooks
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication
- **Multi-step registration** process
- **JWT Authentication**

## 🔧 Backend Features

- **Spring Boot 3.2.0** with Java 17
- **Spring Security** with JWT authentication
- **MongoDB** integration
- **Email verification** system
- **RESTful API** design
- **CORS configuration** for frontend integration

## 🛠️ Development Commands

### Backend:

```bash
# Run tests
./mvnw test

# Build application
./mvnw clean package

# Run with profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### Frontend:

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Lint and format code
npm run lint
```

## 🐛 Troubleshooting

### Common Issues:

1. **Port already in use:**

   - Backend (8080): Change port in `application.properties`
   - Frontend (3000): It will prompt to use different port

2. **Java version mismatch:**

   - Ensure JDK 17+ is installed and set as JAVA_HOME

3. **Node modules issues:**

   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Maven wrapper permission (Linux/Mac):**
   ```bash
   chmod +x mvnw
   ```

## 📝 Environment Variables

The project uses the following configuration:

### Backend (`application.properties`):

- MongoDB connection string (already configured)
- Email service configuration
- JWT secret configuration

### Frontend:

- API base URL automatically configured for development

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check this README for common solutions
2. Ensure all prerequisites are properly installed
3. Verify both backend and frontend are running
4. Check browser console and terminal for error messages

---

**Happy Coding! 🚀**
