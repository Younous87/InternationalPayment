# International Payment System

[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/en)
[![Express.js](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![JWT](https://img.shields.io/badge/JWT-FFC300?logo=jsonwebtokens&logoColor=white)](https://www.npmjs.com/package/jsonwebtoken)
[![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=white)](https://jestjs.io/)

A secure, full-stack international payment application built with React frontend and Node.js backend, featuring comprehensive security measures, employee transaction management, and robust authentication systems.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Security Features](#security-features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Supported Currencies & Payment Methods](#supported-currencies--payment-methods)
- [Development Tools](#development-tools)
- [Resources](#resources)

---

## Features

### 🔐 User Authentication & Authorization

- **Secure Registration & Login**
  - Multi-factor authentication with username, account number, and password
  - Password strength validation with complexity requirements
  - Password history tracking (prevents reuse of last 5 passwords)
  - Password hashing with bcrypt and pepper for enhanced security

- **Account Recovery**
  - Password recovery with verification codes (15-minute expiration)
  - Username recovery via email
  - Secure password reset workflow
  - Account registration confirmation

- **Account Management**
  - Change password functionality
  - JWT-based session management (1-day expiration)
  - Role-based access control (Client vs Employee)

### 💰 International Money Transfers

- **Payment Processing**
  - Multi-currency support (11 currencies)
  - SWIFT payment provider integration
  - Transaction status workflow (pending → processing → completed/failed/cancelled)
  - Unique transaction ID generation
  - Real-time transaction tracking

- **Transaction Management**
  - Send money with beneficiary details
  - View transaction history
  - View money sent/received
  - Transaction verification system
  - Payment confirmation

### 👔 Employee Portal

- **Employee Features**
  - Dedicated employee login
  - View all pending transactions
  - Approve transactions (sends to SWIFT)
  - Reject transactions
  - View transaction details
  - Transaction management dashboard

### 🛡️ Security Features

- **Backend Security**
  - SSL/TLS encryption with HTTPS support
  - Helmet.js security headers
  - Rate limiting (100 requests per 15 minutes)
  - Web Application Firewall (WAF) - blocks XSS, SQL injection, NoSQL injection
  - Input validation and sanitization (whitelist approach)
  - MongoDB injection prevention (express-mongo-sanitize)
  - HTTP Parameter Pollution prevention (HPP)
  - Content Security Policy (CSP)
  - Password pepper for defense in depth
  - JWT token authentication
  - HTTPS enforcement in production
  - Request logging with Morgan (development)

- **Frontend Security**
  - Content Security Policy headers
  - React Helmet for secure meta tags
  - Client-side input validation
  - XSS protection
  - Secure token storage

### 🎨 User Interface

- **Dashboard Views**
  - Home page with client/employee login options
  - User dashboard with quick actions
  - Transaction history
  - Money sent view
  - Money received view

- **Authentication Views**
  - User login
  - User registration
  - Account registered confirmation
  - Password recovery
  - Username recovery

- **Transaction Views**
  - Send money interface
  - Transaction verification
  - Payment confirmation
  - Money sent/received views

- **Employee Views**
  - Employee login
  - Employee transaction list
  - Employee transaction detail view
  - Transaction approval/rejection interface

---

## Technology Stack

### Backend

- **Runtime:** Node.js (v14+)
- **Framework:** Express.js 5.1.0
- **Database:** MongoDB (Mongoose 8.19.1)
- **Security:**
  - Helmet 8.1.0 - Security headers
  - bcrypt 6.0.0 - Password hashing
  - jsonwebtoken 9.0.2 - JWT authentication
  - express-rate-limit 8.1.0 - Rate limiting
  - express-mongo-sanitize 2.2.0 - NoSQL injection prevention
  - hpp 0.2.3 - HTTP Parameter Pollution prevention
  - validator 13.15.15 - Input validation
- **Development:**
  - Jest 29.7.0 - Testing framework
  - Supertest 7.1.4 - API testing
  - ESLint 8.57.1 - Code linting
  - Nodemon 3.1.10 - Development server
  - Morgan 1.10.1 - HTTP request logger

### Frontend

- **Framework:** React 19.2.0
- **Routing:** React Router DOM 6.28.0
- **Security:** React Helmet 6.1.0 (CSP)
- **Build Tool:** Create React App 5.0.1
- **Testing:** React Testing Library 16.3.0

### Development & Quality

- **Code Quality:** ESLint with security plugin
- **Testing:** Jest with coverage reporting
- **Code Analysis:** SonarQube integration
- **Version Control:** Git

---

## Security Features

### Backend Security Implementation

- **Helmet.js:** Sets various HTTP headers for security (XSS protection, content type sniffing prevention, etc.)
- **Rate Limiting:** Prevents brute force attacks (100 requests per 15 minutes per IP)
- **Web Application Firewall:** Blocks malicious payloads including:
  - SQL injection patterns
  - XSS attacks (script tags, event handlers)
  - NoSQL injection operators
  - Command injection patterns
- **Input Validation:** Comprehensive whitelist-based validation for all user inputs
- **Password Security:**
  - bcrypt hashing with salt rounds (10 rounds)
  - Password pepper for additional security layer
  - Password strength validation (8+ chars, uppercase, lowercase, number, special char)
  - Password history tracking (prevents reuse of last 5 passwords)
  - Common password detection
  - Sequential/repeated character detection
- **JWT Authentication:** Secure token-based authentication with 1-day expiration
- **HTTPS Enforcement:** Automatic redirect to HTTPS in production
- **MongoDB Sanitization:** Prevents NoSQL injection through operator filtering
- **HTTP Parameter Pollution Prevention:** Blocks duplicate parameter attacks
- **Content Security Policy:** Restricts resource loading to prevent XSS
- **Request Timeouts:** Protection against slowloris attacks (60s request timeout)

### Frontend Security Implementation

- **Content Security Policy:** Prevents XSS attacks by restricting script sources
- **React Helmet:** Secure meta tags and headers
- **Input Sanitization:** Client-side validation before submission
- **Secure Token Storage:** JWT tokens stored securely (not in localStorage for production)

---

## Project Structure

```
InternationalPayment/
├── backend/
│   ├── models/
│   │   ├── User.js          # User model with password history
│   │   └── Payment.js       # Payment transaction model
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   └── payments.js      # Payment routes
│   ├── utils/
│   │   ├── passwordSecurity.js    # Password hashing & validation
│   │   └── inputValidation.js     # Input whitelisting & sanitization
│   ├── tests/
│   │   ├── api.test.js            # API endpoint tests
│   │   ├── inputValidation.test.js
│   │   ├── passwordSecurity.test.js
│   │   └── User.test.js
│   ├── ssl/                 # SSL certificates (for HTTPS)
│   ├── server.js            # Main server file
│   ├── package.json
│   └── jest.config.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── shared/      # Reusable components (Button, Card, Form)
│   │   │   ├── home.js
│   │   │   ├── payment.js
│   │   │   └── ...
│   │   ├── views/
│   │   │   ├── auth/        # Authentication views
│   │   │   ├── dashboard/   # Dashboard views
│   │   │   ├── transactions/# Transaction views
│   │   │   └── employee/    # Employee views
│   │   ├── utils/
│   │   │   └── inputValidation.js
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── build/               # Production build
│
├── README.md
└── sonar-project.properties # SonarQube configuration
```

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** or **yarn** package manager
- **MongoDB** (local installation or MongoDB Atlas account)
- **Git** (for cloning the repository)

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/JoseLubota/InternationalPayment.git
cd InternationalPayment
```

### 2. Backend Setup

```bash
cd backend
npm install
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Environment Configuration

Create a `.env` file in the `backend` directory:

```env
# Database
ATLAS_URI=your-mongodb-connection-string-here

# JWT Secret (generate a strong random string)
JWT_SECRET=your-secret-jwt-key-here

# Password Pepper (optional, for additional password security)
PASSWORD_PEPPER=your-password-pepper-here

# Server Configuration
PORT=4000
NODE_ENV=development
```

**Note:** For production, use strong, randomly generated values for `JWT_SECRET` and `PASSWORD_PEPPER`. You can generate them using:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. SSL Certificate Setup (Optional - for HTTPS)

To enable HTTPS in development:

1. Place your SSL certificate files in `backend/ssl/`:
   - `server.key` - Private key
   - `server.cert` - Certificate

2. The server will automatically detect and use HTTPS if certificates are present.

---

## Running the Application

### Development Mode

#### Start the Backend Server

```bash
cd backend
npm run dev
```

The backend will run on:
- `http://localhost:4000` (HTTP)
- `https://localhost:4000` (HTTPS if certificates are configured)

#### Start the Frontend Development Server

```bash
cd frontend
npm start
```

The frontend will run on `http://localhost:3000` and automatically open in your browser.

### Production Build

#### Build the Frontend

```bash
cd frontend
npm run build
```

This creates an optimized production build in the `frontend/build/` directory.

#### Start Production Server

```bash
cd backend
npm start
```

**Note:** In production, ensure:
- `NODE_ENV=production` in your `.env` file
- HTTPS is properly configured
- Strong JWT_SECRET and PASSWORD_PEPPER are set
- MongoDB connection is secure

---

## Testing

### Backend Testing

The project includes comprehensive test suites using Jest and Supertest.

#### Run All Tests

```bash
cd backend
npm test
```

#### Run Tests with Coverage

```bash
cd backend
npm test -- --coverage
```

#### Run Tests in Watch Mode

```bash
cd backend
npm run test:watch
```

#### Run API Tests Only

```bash
cd backend
npm run test:api
```

#### Run Tests in CI Mode

```bash
cd backend
npm run test:ci
```

### Frontend Testing

```bash
cd frontend
npm test
```

### Test Coverage

The project includes test coverage for:
- API endpoints
- Input validation
- Password security
- User model operations
- Authentication flows
- Payment processing

---

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | User login | No |
| `POST` | `/api/auth/change-password` | Change user password | Yes |
| `POST` | `/api/auth/recover-password` | Request password recovery code | No |
| `POST` | `/api/auth/verify-recovery-code` | Verify recovery code | No |
| `POST` | `/api/auth/reset-password` | Reset password with recovery code | No |
| `POST` | `/api/auth/recover-username` | Recover username via email | No |
| `GET` | `/api/auth/users` | Get all users (test only) | No |

### Payment Endpoints

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| `POST` | `/api/payments/create` | Create a new payment transaction | Yes | Client |
| `GET` | `/api/payments/my-payments` | Get all payments for current user | Yes | Client |
| `GET` | `/api/payments/received` | Get received payments | Yes | Client |
| `GET` | `/api/payments/:transactionId` | Get specific transaction | Yes | Client |
| `PATCH` | `/api/payments/:transactionId/status` | Update transaction status | Yes | Client |
| `GET` | `/api/payments/currencies/supported` | Get supported currencies | No | - |
| `GET` | `/api/payments/providers/supported` | Get supported payment providers | No | - |
| `POST` | `/api/payments/complete-my-payments` | Complete all pending payments (test) | Yes | Client |

### Employee Endpoints

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| `GET` | `/api/payments/pending` | Get all pending transactions | Yes | Employee |
| `GET` | `/api/payments/employee/:transactionId` | Get transaction details | Yes | Employee |
| `POST` | `/api/payments/employee/:transactionId/approve` | Approve transaction | Yes | Employee |
| `POST` | `/api/payments/employee/:transactionId/reject` | Reject transaction | Yes | Employee |

### Utility Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/test` | Health check endpoint |

---

## Supported Currencies & Payment Methods

### Currencies

- **USD** - US Dollar ($)
- **EUR** - Euro (€)
- **GBP** - British Pound (£)
- **JPY** - Japanese Yen (¥)
- **CAD** - Canadian Dollar (C$)
- **AUD** - Australian Dollar (A$)
- **CHF** - Swiss Franc (CHF)
- **CNY** - Chinese Yuan (¥)
- **SEK** - Swedish Krona (kr)
- **NZD** - New Zealand Dollar (NZ$)
- **ZAR** - South African Rand (R)

### Payment Providers

- **SWIFT** - Society for Worldwide Interbank Financial Telecommunication
  - Currently implemented and active
  - Supports international wire transfers
  - Variable fees based on amount and destination

- **SEPA** - Single Euro Payments Area (Coming Soon...)
- **ACH** - Automated Clearing House (Coming Soon...)
- **FEDWIRE** - Federal Reserve Wire Network (Coming Soon...)

---

## Development Tools

### Code Quality

- **ESLint:** Code linting with security plugin
  ```bash
  cd backend
  npm run lint
  npm run lint:fix
  ```

### Code Analysis

- **SonarQube:** Integrated for code quality and security analysis
  - Configuration: `sonar-project.properties`
  - Coverage reports: `backend/coverage/lcov.info`

### Request Logging

- **Morgan:** HTTP request logger (development mode only)
  - Combined log format
  - Disabled in production for performance

---

## Resources

### YouTube Video Links

Part 1
[![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/kYr0gMwX8T8)

Part 2
[![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/TteFEY52IQU)

### GitHub Repository

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/JoseLubota/InternationalPayment.git)

---

## References

### Security Resources

- Barracuda Networks. (2025). Barracuda. [online] Available at: https://www.barracuda.com/support/glossary/session-hijacking#:~:text=Session%20hijacking%20is%20a%20cyberattack,active%20website%20or%20application%20session. [Accessed 14 Sep. 2025].

- Cloudflare.com. (2025). What is a distributed denial-of-service (DDoS) attack? [online] Available at: https://www.cloudflare.com/learning/ddos/what-is-a-ddos-attack/ [Accessed 15 Sep. 2025].

- Fortinet. (2015). What Is a Man-in-the Middle (MITM) Attack? Types & Examples | Fortinet. [online] Available at: https://www.fortinet.com/resources/cyberglossary/man-in-the-middle-attack [Accessed 15 Sep. 2025].

- Fortinet. (2025). What is Clickjacking? Definition, Types and Prevention | Fortinet. [online] Available at: https://www.fortinet.com/resources/cyberglossary/clickjacking [Accessed 15 Sep. 2025].

- Portswigger.net. (2021a). What is cross-site scripting (XSS) and how to prevent it? | Web Security Academy. [online] Available at: https://portswigger.net/web-security/cross-site-scripting [Accessed 15 Sep. 2025].

- Portswigger.net. (2021b). What is CSRF (Cross-site request forgery)? Tutorial & Examples | Web Security Academy. [online] Available at: https://portswigger.net/web-security/csrf [Accessed 15 Sep. 2025].

- Portswigger.net. (2025). What is SQL Injection? Tutorial & Examples | Web Security Academy. [online] Available at: https://portswigger.net/web-security/sql-injection [Accessed 15 Sep. 2025].

- Qwiet A. (2024). AppSec 101 – Output Encoding. [online] Available at: https://qwiet.ai/appsec-101-output-encoding/ [Accessed 15 Sep. 2025].

### Technology Documentation

- Be A Better Dev, 2020. How to install and configure the AWS CLI on Windows 10. [Online] Available at: https://www.youtube.com/watch?v=jCHOsMPbcV0 [Accessed September 2025].

- Gavali, A., 2023. Audit AWS Cloud Security using ScoutSuite. [Online] Available at: https://medium.com/globant/audit-aws-cloud-security-using-scoutsuite-4bc9073d2fc4 [Accessed September 2025].

- Cloudflare.com. (2025). What is HTTPS? [online] Available at: https://www.cloudflare.com/learning/ssl/what-is-https/ [Accessed 10 Oct. 2025].

- Create-react-app.dev. (2022). Getting Started | Create React App. [online] Available at: https://create-react-app.dev/docs/getting-started/ [Accessed 10 Oct. 2025].

- Expressjs.com. (2025). Express - Node.js web application framework. [online] Available at: https://expressjs.com/ [Accessed 10 Oct. 2025].

- GitHub. (2025). Express Rate Limit. [online] Available at: https://github.com/express-rate-limit [Accessed 10 Oct. 2025].

- Github.io. (2025). Helmet.js. [online] Available at: https://helmetjs.github.io/ [Accessed 10 Oct. 2025].

- MongoDB. (2025). MongoDB: The World's Leading Modern Database. [online] Available at: https://www.mongodb.com/ [Accessed 10 Oct. 2025].

- Nodejs.org. (2015). Node.js — Run JavaScript Everywhere. [online] Available at: https://nodejs.org/en [Accessed 10 Oct. 2025].

- npm. (2024). helmet-csp. [online] Available at: https://www.npmjs.com/package/helmet-csp [Accessed 10 Oct. 2025].

- npm. (2025a). bcrypt. [online] Available at: https://www.npmjs.com/package/bcrypt [Accessed 10 Oct. 2025].

- npm. (2025b). react-router-dom. [online] Available at: https://www.npmjs.com/package/react-router-dom [Accessed 10 Oct. 2025].

- React.dev. (2015). React. [online] Available at: https://react.dev/ [Accessed 10 Oct. 2025].

---

## License

This project is licensed under the ISC License.

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built with ❤️ for secure international payments**
