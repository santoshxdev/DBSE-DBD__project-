# Library Management System with RFID Integration

A production-grade, distributed full-stack Library Management System engineered with **React + Vite** on the frontend, **Node.js + Express** on the backend, and **MongoDB** with Mongoose for persistent data storage. Built-in support for hardware RFID scanners (e.g., **ESP32 + RC522**) via real-time REST API integration.

---

## 🏗 Architecture Overview

```
                      +-----------------------------+
                      |   React 18 + Vite (SPA)    |
                      |   Port: 5173                |
                      +--------------+--------------+
                                     |
                          REST API   | Axios (Bearer JWT)
                                     v
                      +-----------------------------+
                      |    Node.js / Express API    |
                      |    Port: 5000               |
                      +-------+--------------+------+
                              |              ^
             Mongoose ORM     |              | HTTP POST /api/rfid/scan
                              v              |
                      +---------------+   +--+------------------------+
                      | MongoDB Atlas |   | ESP32 / Arduino + RC522   |
                      | / Local DB    |   | RFID Reader Module        |
                      +---------------+   +---------------------------+
```

---

## 🚀 Key Features

1. **Authentication & Authorization**:
   - Secure JWT-based authentication with bcrypt password hashing.
   - Protected client-side routing and server-side middleware.
   - Role-based access control (Admin, Librarian).

2. **Catalog & Inventory Management**:
   - Full CRUD operations for books with ISBN uniqueness validation.
   - Search by title, author, category, or RFID UID.
   - Real-time stock tracking (`quantity` vs `availableQuantity`).

3. **Member Management**:
   - Student & faculty registration with unique Student IDs.
   - Real-time loan tracking with maximum loan caps (`maxBooksAllowed`).
   - RFID student ID card binding.

4. **Circulation & Transactions**:
   - Issue book by Book ID / Member ID or via one-tap RFID scanning.
   - Automatic due-date computation based on configurable loan periods.
   - Atomic database transactions with rollback protection.
   - Return processing with automated overdue fine calculation.

5. **RFID Hardware Integration**:
   - Direct integration endpoint (`/api/rfid/scan`, `/api/rfid/issue`, `/api/rfid/return`).
   - Interactive RFID station UI simulating hardware scanning or receiving real sensor payloads.
   - Auto-detection: identifies whether scanned UID belongs to a book or a student card.

6. **Real-time Analytics Dashboard**:
   - Live KPI cards: Total Books, Active Members, Books Issued, Overdue Loans, Fines Collected.
   - Quick action shortcuts and recent transaction feed.

---

## 💻 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router 6, Axios, Lucide React Icons, Modern CSS (Design Tokens) |
| **Backend** | Node.js, Express 4, Mongoose 8, JWT, bcryptjs, Helmet, Morgan, CORS |
| **Database** | MongoDB (with MongoMemoryServer for headless testing) |
| **Testing** | Jest, Supertest (20 automated integration tests passing) |

---

## 📁 Directory Structure

```
DBSE_project1/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB connection & environment loader
│   │   ├── controllers/     # Auth, Book, Member, Transaction, RFID controllers
│   │   ├── middlewares/     # JWT Auth and Error handling middleware
│   │   ├── models/          # User, Book, Member, Transaction Mongoose schemas
│   │   ├── routes/          # REST route handlers
│   │   ├── scripts/         # Database seeding script (seed.js)
│   │   ├── services/        # fineService, rfidService business logic
│   │   └── app.js           # Express app configuration
│   ├── tests/
│   │   └── api.test.js      # 20 Automated integration tests
│   ├── .env.example
│   ├── package.json
│   └── server.js            # Server entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/      # Sidebar, Topbar, Modal, Loading, ErrorMessage, ProtectedRoute
│   │   ├── context/         # AuthContext, ToastContext
│   │   ├── layouts/         # DashboardLayout
│   │   ├── pages/           # Dashboard, Books, BookDetails, Members, MemberDetails,
│   │   │                    # IssueBook, ReturnBook, Transactions, RFID, Login, NotFound
│   │   ├── services/        # Axios API clients for books, members, transactions, rfid
│   │   ├── App.jsx          # Route configuration
│   │   ├── index.css        # Global design tokens and styling
│   │   └── main.jsx         # App mounting
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB instance (Local or MongoDB Atlas)

---

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env and adjust if needed:
cp .env.example .env
```

Default `.env` configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/library_rfid_db
JWT_SECRET=supersecretjwtkey_rfid_library_2025
JWT_EXPIRES_IN=7d
FINE_PER_DAY=5
LOAN_PERIOD_DAYS=14
```

#### Seed Demo Data:
```bash
npm run seed
```
> Populates the database with:
> - **Default Admin**: `admin@library.com` / `adminpassword123`
> - **Default Librarian**: `librarian@library.com` / `librarianpassword123`
> - Sample books with pre-assigned RFID UIDs
> - Sample student members with RFID cards
> - Sample transactions and overdue loan records

#### Run Backend Tests:
```bash
npm test
```
*(Runs 20 automated integration tests against an in-memory MongoDB server)*

#### Start Backend Server:
```bash
npm start
# or for auto-reload during development:
npm run dev
```
Backend will start on `http://localhost:5000`.

---

### 2. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend will be accessible at `http://localhost:5173`.

---

## 📡 API Reference

### Authentication
- `POST /api/auth/login` — Login user and return JWT token
- `GET /api/auth/me` — Get current logged-in user profile (Bearer Token required)

### Books
- `GET /api/books` — List books with pagination and search query (`?page=1&limit=10&search=...`)
- `GET /api/books/:id` — Get single book details and borrowing history
- `POST /api/books` — Create new book entry
- `PUT /api/books/:id` — Update book metadata
- `DELETE /api/books/:id` — Remove book from catalog
- `PATCH /api/books/:id/rfid` — Assign or update RFID UID to book

### Members
- `GET /api/members` — List registered members (`?page=1&limit=10&search=...`)
- `GET /api/members/:id` — Get member profile and active borrowings
- `POST /api/members` — Register new student/faculty member
- `PUT /api/members/:id` — Update member information
- `DELETE /api/members/:id` — Delete member record
- `PATCH /api/members/:id/rfid` — Assign or update RFID card UID

### Transactions
- `GET /api/transactions` — List circulation transactions (`?status=issued|returned|overdue`)
- `GET /api/transactions/:id` — Get transaction details
- `POST /api/transactions/issue` — Issue book (`bookId`, `memberId`, `dueDate`)
- `POST /api/transactions/return` — Return book (`transactionId` or `bookId`)

### RFID Hardware Integration
- `POST /api/rfid/scan` — Identify entity by RFID UID (`{ "rfidUid": "E280689400004018" }`)
- `POST /api/rfid/issue` — Complete issue via RFID (`{ "bookRfid": "...", "memberRfid": "..." }`)
- `POST /api/rfid/return` — Complete return via RFID (`{ "bookRfid": "..." }`)

### Analytics
- `GET /api/dashboard/stats` — Aggregated library statistics for dashboard metrics

---

## 🏷 RFID Hardware Setup (ESP32 / Arduino RC522)

To connect an ESP32 microcontroller with an MFRC522 RFID reader to this system:
1. Connect RC522 via SPI to ESP32:
   - `SDA (SS) -> GPIO 5`
   - `SCK -> GPIO 18`
   - `MOSI -> GPIO 23`
   - `MISO -> GPIO 19`
   - `RST -> GPIO 22`
   - `3.3V & GND`
2. In the ESP32 firmware, on detecting a card/tag, perform an HTTP POST request:
   ```json
   POST http://<SERVER_IP>:5000/api/rfid/scan
   Content-Type: application/json

   { "rfidUid": "04AABBCCDDEE" }
   ```
3. The response will return whether the tag corresponds to a book or a member, or if it is unassigned.

---

## 🛡 License
ISC License. Designed for academic and production library deployment.
