# Library Management System with RFID Technology

[![Node.js](https://img.shields.io/badge/Node.js-v24.0%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-REST_API-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-Vite_Tailwind-cyan.svg)](https://react.dev/)
[![Hardware](https://img.shields.io/badge/Hardware-ESP32_RC522-orange.svg)](https://www.espressif.com/)

A full-stack, distributed database-driven **Library Management System with RFID Technology** developed for B.Tech academic demonstration and viva voce evaluation (**Subject: Database Systems Engineering and Distributed Backend Development**).

The system integrates Node.js, Express, MongoDB, React, Vite, Tailwind CSS, and ESP32 + MFRC522 RFID hardware architecture to automate library check-outs, returns, student member verification, inventory copy management, overdue fine calculation, and live sensor event monitoring.

---

## 🚀 Key Features

* **Executive Analytics Dashboard**: Aggregates total books catalog, available copy inventory, active borrowed items, total student members, pending fine totals, and today's RFID hardware scan count using MongoDB Aggregation Pipelines.
* **Dual RFID Issue / Return Workstation Kiosk**: Instant check-out and check-in processing by scanning student member RFID cards and book RFID tags.
* **Interactive Hardware RFID Simulator (`/rfid-simulator`)**: Interactive web page and terminal CLI simulator transmitting real hardware JSON payloads to allow 100% full application demonstration without physical ESP32 hardware.
* **Books Catalog Management**: Full CRUD, pagination, full-text catalog search (Title, Author, ISBN, Category), category/status filters, shelf location tracking, and RFID tag binding.
* **Student Members Registry**: Full CRUD, student roll number tracking, academic department filter, and RFID smartcard mapping.
* **Circulation Transactions Log**: Complete check-out history, due dates, return timestamps, staff accountability, and active/overdue filters.
* **Live RFID Event Stream Monitor**: Real-time telemetry log tracking hardware scan events (`BOOK_SCAN`, `MEMBER_SCAN`, `ISSUE`, `RETURN`, `UNKNOWN_TAG`), device IDs, and sensor timestamps.
* **Overdue Fines Engine**: Automatically calculates overdue penalties (`fine = overdueDays × dailyFineRate`) upon check-in and provides a payment settlement system.
* **Role-Based Security**: JWT authentication with bcrypt password hashing for Admin and Librarian staff roles.

---

## 🛠 Technology Stack

### Backend
* **Runtime**: Node.js v24+
* **Framework**: Express.js RESTful API
* **Database**: MongoDB + Mongoose ORM (with automatic fallback to `mongodb-memory-server` if local MongoDB service is offline)
* **Authentication**: JSON Web Tokens (JWT) + bcryptjs password hashing
* **Middleware**: CORS, dotenv, Express Validator, Centralized Error Handler

### Frontend
* **Core**: React 18 (Vite build tool)
* **Styling**: Tailwind CSS + Glassmorphism modern UI
* **Icons**: Lucide React
* **Client**: Axios API client with JWT interceptors
* **Routing**: React Router v6

### Hardware / IoT
* **Microcontroller**: ESP32 Dev Module
* **RFID Reader**: MFRC522 (13.56 MHz SPI Module)
* **Simulator**: Integrated web page (`/rfid-simulator`) & Node.js CLI script (`rfid/simulator/rfid_cli_simulator.js`)

---

## 🔑 Academic Demo Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@library.com` | `admin123` | Full Access (Catalog, Members, System Settings, Deletion) |
| **Librarian Staff** | `librarian@library.com` | `lib123` | Circulation Kiosk, Catalog, Members, Issues, Returns, Fines |
| **Librarian Staff 2** | `librarian2@library.com` | `lib123` | Circulation Kiosk, Catalog, Members, Issues, Returns |

---

## 📦 Project Structure

```
library-management-rfid/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection & memory fallback logic
│   │   ├── controllers/     # Auth, Book, Member, RFID, Transaction, Fine, Dashboard controllers
│   │   ├── middleware/      # JWT auth, role validation, centralized error handling
│   │   ├── models/          # 9 Mongoose schemas (User, Member, Book, RFIDTag, Transaction, etc.)
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Audit logging service
│   │   └── app.js           # Express app setup
│   ├── tests/               # Automated API test suite (api.test.js)
│   ├── server.js            # Node HTTP server entry point
│   └── .env                 # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Sidebar, Modal, StatCard, RFIDBadge, Pagination
│   │   ├── context/         # AuthContext session provider
│   │   ├── layouts/         # DashboardLayout template
│   │   ├── pages/           # Dashboard, Kiosk, Books, Members, Transactions, Simulator, Fines, Settings
│   │   ├── services/        # Axios API client
│   │   ├── App.jsx          # Protected route definitions
│   │   └── main.jsx         # React DOM entry point
│   ├── index.html           # HTML template
│   ├── tailwind.config.js   # Tailwind CSS design system
│   └── vite.config.js       # Vite development proxy
├── rfid/
│   ├── esp32/               # Arduino C++ sketch (rc522_rfid_reader.ino) & pinout setup guide
│   └── simulator/           # Terminal CLI simulator (rfid_cli_simulator.js)
├── docs/
│   └── PROJECT_DOCUMENTATION.md  # Comprehensive academic project report & viva Q&A guide
├── scripts/
│   └── seed.js              # Database seeder script
├── package.json             # Root workspace runner
└── README.md
```

---

## ⚡ Quick Start Guide

### Step 1: Install Dependencies

Open terminal in the workspace root directory and install packages for both backend and frontend:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root directory
cd ..
```

---

### Step 2: Seed Database

Populate MongoDB with realistic sample books, student members, RFID tags, sample active transactions, overdue fines, and hardware events:

```bash
# Run database seed script
npm run seed
```

*(Note: If local standalone MongoDB is not running on `mongodb://127.0.0.1:27017/library_rfid_db`, the system will automatically initialize an in-memory MongoDB server seamlessly).*

---

### Step 3: Start Application

Run both backend server and frontend development server concurrently:

```bash
# Start both backend (Port 5000) and frontend (Port 5173)
npm run dev
```

Alternatively, start servers in separate terminals:

**Terminal 1 (Backend API):**
```bash
cd backend
npm start
```
*(Backend runs at `http://localhost:5000`)*

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
```
*(Frontend runs at `http://localhost:5173`)*

---

## 🧪 Running Automated Tests

Run backend API integration test suite:

```bash
cd backend
npm test
```

---

## 📻 Demonstrating Without Hardware (RFID Simulator)

1. Open application in browser: `http://localhost:5173`.
2. Log in using `admin@library.com` / `admin123` or click **Admin Demo** button.
3. Click **RFID Simulator** in the sidebar.
4. Select preset card options (e.g. *Student: Aarav Gupta* or *Book: DB System Concepts*).
5. Click **Scan Student**, **Scan Book**, **Issue Book**, or **Return Book**.
6. View live hardware JSON requests, responses, and real-time telemetry stream.

---

## 📑 Academic Documentation

Detailed ER relationship explanations, normalization documentation, database engineering concepts, and Viva Voce questions are available in:

📂 [`docs/PROJECT_DOCUMENTATION.md`](file:///c:/Users/santo/DBSE_anti.project/docs/PROJECT_DOCUMENTATION.md)
