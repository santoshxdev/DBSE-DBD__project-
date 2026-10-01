const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/src/models/User');
const Member = require('../backend/src/models/Member');
const Book = require('../backend/src/models/Book');
const RFIDTag = require('../backend/src/models/RFIDTag');
const Transaction = require('../backend/src/models/Transaction');
const RFIDEvent = require('../backend/src/models/RFIDEvent');
const Fine = require('../backend/src/models/Fine');
const AuditLog = require('../backend/src/models/AuditLog');
const SystemSetting = require('../backend/src/models/SystemSetting');

const seedDatabase = async () => {
  try {
    console.log('[Seed] Seeding database with academic demonstration data...');

    // Clear existing collections
    await User.deleteMany({});
    await Member.deleteMany({});
    await Book.deleteMany({});
    await RFIDTag.deleteMany({});
    await Transaction.deleteMany({});
    await RFIDEvent.deleteMany({});
    await Fine.deleteMany({});
    await AuditLog.deleteMany({});
    await SystemSetting.deleteMany({});

    console.log('[Seed] Cleared old collections.');

    // 1. Create System Settings
    await SystemSetting.create([
      { key: 'DAILY_FINE', value: 5, description: 'Daily fine amount in ₹ per day overdue' },
      { key: 'BORROWING_DAYS', value: 14, description: 'Allowed borrowing period in days' },
      { key: 'MAX_BOOKS_PER_MEMBER', value: 3, description: 'Maximum active borrowed books per member' },
      { key: 'RFID_DEVICE_ID', value: 'RFID_DEVICE_01', description: 'Primary RC522 reader identifier' }
    ]);

    // 2. Create Staff Users (Admin & Librarians)
    const adminUser = await User.create({
      userId: 'USR-1001',
      name: 'Dr. Rajesh Sharma',
      email: 'admin@library.com',
      passwordHash: 'admin123',
      role: 'ADMIN',
      phone: '+91 9876543210',
      status: 'ACTIVE'
    });

    const librarian1 = await User.create({
      userId: 'USR-1002',
      name: 'Priya Verma',
      email: 'librarian@library.com',
      passwordHash: 'lib123',
      role: 'LIBRARIAN',
      phone: '+91 9876543211',
      status: 'ACTIVE'
    });

    const librarian2 = await User.create({
      userId: 'USR-1003',
      name: 'Amit Patel',
      email: 'librarian2@library.com',
      passwordHash: 'lib123',
      role: 'LIBRARIAN',
      phone: '+91 9876543212',
      status: 'ACTIVE'
    });

    console.log('[Seed] Created Users: Admin & Librarians');

    // 3. Create Student Members
    const membersData = [
      { memberId: 'MEM-1001', studentId: 'STU-2024-001', name: 'Aarav Gupta', email: 'aarav.cs24@univ.ac.in', department: 'Computer Science', year: 3, phone: '+91 9123456701', RFIDCardId: 'CARD_E4A28B10' },
      { memberId: 'MEM-1002', studentId: 'STU-2024-002', name: 'Ananya Roy', email: 'ananya.ece24@univ.ac.in', department: 'Electronics & Comm', year: 4, phone: '+91 9123456702', RFIDCardId: 'CARD_93F1C822' },
      { memberId: 'MEM-1003', studentId: 'STU-2024-003', name: 'Rohan Mehta', email: 'rohan.mech24@univ.ac.in', department: 'Mechanical Engg', year: 2, phone: '+91 9123456703', RFIDCardId: 'CARD_A4B5C6D7' },
      { memberId: 'MEM-1004', studentId: 'STU-2024-004', name: 'Sneha Kulkarni', email: 'sneha.it24@univ.ac.in', department: 'Information Tech', year: 3, phone: '+91 9123456704', RFIDCardId: 'CARD_77E88F99' },
      { memberId: 'MEM-1005', studentId: 'STU-2024-005', name: 'Vikram Singh', email: 'vikram.eee24@univ.ac.in', department: 'Electrical Engg', year: 4, phone: '+91 9123456705', RFIDCardId: 'CARD_1234ABCD' },
      { memberId: 'MEM-1006', studentId: 'STU-2024-006', name: 'Kavya Nair', email: 'kavya.cs24@univ.ac.in', department: 'Computer Science', year: 2, phone: '+91 9123456706', RFIDCardId: 'CARD_55667788' },
      { memberId: 'MEM-1007', studentId: 'STU-2024-007', name: 'Devansh Reddy', email: 'devansh.civil24@univ.ac.in', department: 'Civil Engg', year: 1, phone: '+91 9123456707', RFIDCardId: 'CARD_99887766' },
      { memberId: 'MEM-1008', studentId: 'STU-2024-008', name: 'Ishita Sharma', email: 'ishita.ai24@univ.ac.in', department: 'Artificial Intel', year: 3, phone: '+91 9123456708', RFIDCardId: 'CARD_A1B2C3D4' },
      { memberId: 'MEM-1009', studentId: 'STU-2024-009', name: 'Aditya Joshi', email: 'aditya.mech24@univ.ac.in', department: 'Mechanical Engg', year: 4, phone: '+91 9123456709', RFIDCardId: 'CARD_11223344' },
      { memberId: 'MEM-1010', studentId: 'STU-2024-010', name: 'Riya Sen', email: 'riya.ece24@univ.ac.in', department: 'Electronics & Comm', year: 2, phone: '+91 9123456710', RFIDCardId: 'CARD_FFAABBCC' }
    ];

    const members = await Member.create(membersData);
    console.log(`[Seed] Created ${members.length} student members.`);

    // 4. Create Books Catalog
    const booksData = [
      { bookId: 'BK-1001', ISBN: '978-0131103627', title: 'Database System Concepts', author: 'Silberschatz, Korth, Sudarshan', category: 'Database Systems', publisher: 'McGraw-Hill', publicationYear: 2020, totalCopies: 5, availableCopies: 4, shelfLocation: 'A1-S3', RFIDTagId: 'TAG_B8F3D122' },
      { bookId: 'BK-1002', ISBN: '978-0133594140', title: 'Clean Code: Handbook of Software Craftsmanship', author: 'Robert C. Martin', category: 'Software Engineering', publisher: 'Prentice Hall', publicationYear: 2008, totalCopies: 4, availableCopies: 3, shelfLocation: 'B2-S1', RFIDTagId: 'TAG_11A22B33' },
      { bookId: 'BK-1003', ISBN: '978-0262033848', title: 'Introduction to Algorithms (CLRS)', author: 'Cormen, Leiserson, Rivest, Stein', category: 'Data Structures & Algorithms', publisher: 'MIT Press', publicationYear: 2009, totalCopies: 6, availableCopies: 5, shelfLocation: 'A2-S4', RFIDTagId: 'TAG_44C55D66' },
      { bookId: 'BK-1004', ISBN: '978-0134685991', title: 'Operating System Concepts', author: 'Abraham Silberschatz', category: 'Operating Systems', publisher: 'Wiley', publicationYear: 2018, totalCopies: 3, availableCopies: 2, shelfLocation: 'C1-S2', RFIDTagId: 'TAG_77E88F99' },
      { bookId: 'BK-1005', ISBN: '978-0133591620', title: 'Computer Networks', author: 'Andrew S. Tanenbaum', category: 'Networking', publisher: 'Pearson', publicationYear: 2021, totalCopies: 4, availableCopies: 4, shelfLocation: 'B1-S3', RFIDTagId: 'TAG_9900AABB' },
      { bookId: 'BK-1006', ISBN: '978-0201633610', title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Erich Gamma, Richard Helm', category: 'Software Engineering', publisher: 'Addison-Wesley', publicationYear: 1994, totalCopies: 3, availableCopies: 3, shelfLocation: 'B2-S2', RFIDTagId: 'TAG_CCDD1122' },
      { bookId: 'BK-1007', ISBN: '978-0131101630', title: 'The C Programming Language', author: 'Brian W. Kernighan, Dennis M. Ritchie', category: 'Programming Languages', publisher: 'Prentice Hall', publicationYear: 1988, totalCopies: 5, availableCopies: 5, shelfLocation: 'A1-S1', RFIDTagId: 'TAG_33445566' },
      { bookId: 'BK-1008', ISBN: '978-0321573513', title: 'Algorithms in C++', author: 'Robert Sedgewick', category: 'Data Structures & Algorithms', publisher: 'Addison-Wesley', publicationYear: 2015, totalCopies: 3, availableCopies: 3, shelfLocation: 'A2-S2', RFIDTagId: 'TAG_77889900' },
      { bookId: 'BK-1009', ISBN: '978-0262035613', title: 'Deep Learning', author: 'Ian Goodfellow, Yoshua Bengio', category: 'Artificial Intelligence', publisher: 'MIT Press', publicationYear: 2016, totalCopies: 4, availableCopies: 3, shelfLocation: 'D1-S1', RFIDTagId: 'TAG_AABBCCDD' },
      { bookId: 'BK-1010', ISBN: '978-0073380544', title: 'Distributed Systems: Principles and Paradigms', author: 'Andrew S. Tanenbaum', category: 'Distributed Systems', publisher: 'Pearson', publicationYear: 2017, totalCopies: 3, availableCopies: 2, shelfLocation: 'C2-S1', RFIDTagId: 'TAG_EEFF0011' },
      { bookId: 'BK-1011', ISBN: '978-0132145213', title: 'Embedded Systems Architecture', author: 'Tammy Noergaard', category: 'Embedded & IoT', publisher: 'Newnes', publicationYear: 2012, totalCopies: 4, availableCopies: 4, shelfLocation: 'E1-S2', RFIDTagId: 'TAG_22334455' },
      { bookId: 'BK-1012', ISBN: '978-1118991350', title: 'Internet of Things: Architecture and Design', author: 'Raj Kamal', category: 'Embedded & IoT', publisher: 'McGraw-Hill', publicationYear: 2017, totalCopies: 5, availableCopies: 5, shelfLocation: 'E1-S3', RFIDTagId: 'TAG_66778899' },
      { bookId: 'BK-1013', ISBN: '978-0134444321', title: 'Digital Design and Computer Architecture', author: 'David Harris, Sarah Harris', category: 'Computer Architecture', publisher: 'Morgan Kaufmann', publicationYear: 2021, totalCopies: 3, availableCopies: 3, shelfLocation: 'E2-S1', RFIDTagId: 'TAG_A1B2C3D4' },
      { bookId: 'BK-1014', ISBN: '978-0132354189', title: 'Clean Architecture', author: 'Robert C. Martin', category: 'Software Engineering', publisher: 'Prentice Hall', publicationYear: 2017, totalCopies: 4, availableCopies: 4, shelfLocation: 'B2-S3', RFIDTagId: 'TAG_E5F6A7B8' },
      { bookId: 'BK-1015', ISBN: '978-0596009205', title: 'Head First Design Patterns', author: 'Eric Freeman, Elisabeth Robson', category: 'Software Engineering', publisher: 'O\'Reilly', publicationYear: 2004, totalCopies: 4, availableCopies: 4, shelfLocation: 'B2-S4', RFIDTagId: 'TAG_C9D0E1F2' }
    ];

    const books = await Book.create(booksData);
    console.log(`[Seed] Created ${books.length} books catalog.`);

    // 5. Create RFID Tags Registry
    const tagEntries = [];
    let tCount = 1;

    members.forEach((m) => {
      if (m.RFIDCardId) {
        tagEntries.push({
          tagId: `TAG-${1000 + tCount++}`,
          UID: m.RFIDCardId,
          tagType: 'MEMBER_CARD',
          assignedEntity: 'MEMBER',
          assignedMember: m._id,
          status: 'ACTIVE',
          lastScannedAt: new Date(Date.now() - Math.floor(Math.random() * 86400000))
        });
      }
    });

    books.forEach((b) => {
      if (b.RFIDTagId) {
        tagEntries.push({
          tagId: `TAG-${1000 + tCount++}`,
          UID: b.RFIDTagId,
          tagType: 'BOOK_TAG',
          assignedEntity: 'BOOK',
          assignedBook: b._id,
          status: 'ACTIVE',
          lastScannedAt: new Date(Date.now() - Math.floor(Math.random() * 86400000))
        });
      }
    });

    await RFIDTag.create(tagEntries);
    console.log(`[Seed] Created ${tagEntries.length} RFID tag registry entries.`);

    // 6. Create Transactions (Active, Overdue, Returned)
    const now = new Date();
    
    // Active transaction (issued 5 days ago, due in 9 days)
    const issueDateActive = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const dueDateActive = new Date(issueDateActive.getTime() + 14 * 24 * 60 * 60 * 1000);

    const txActive = await Transaction.create({
      transactionId: 'TXN-10001',
      memberId: members[0]._id, // Aarav Gupta
      bookId: books[0]._id, // Database System Concepts
      issueDate: issueDateActive,
      dueDate: dueDateActive,
      status: 'ISSUED',
      fineAmount: 0,
      issuedBy: librarian1._id
    });

    // Overdue transaction (issued 20 days ago, due 6 days ago)
    const issueDateOverdue = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
    const dueDateOverdue = new Date(issueDateOverdue.getTime() + 14 * 24 * 60 * 60 * 1000);

    const txOverdue = await Transaction.create({
      transactionId: 'TXN-10002',
      memberId: members[1]._id, // Ananya Roy
      bookId: books[1]._id, // Clean Code
      issueDate: issueDateOverdue,
      dueDate: dueDateOverdue,
      status: 'OVERDUE',
      fineAmount: 30, // 6 days * ₹5/day
      issuedBy: librarian1._id
    });

    // Returned transaction (issued 25 days ago, returned 10 days ago)
    const issueDateReturned = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000);
    const dueDateReturned = new Date(issueDateReturned.getTime() + 14 * 24 * 60 * 60 * 1000);
    const returnDateReturned = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    const txReturned = await Transaction.create({
      transactionId: 'TXN-10003',
      memberId: members[2]._id, // Rohan Mehta
      bookId: books[3]._id, // Operating System Concepts
      issueDate: issueDateReturned,
      dueDate: dueDateReturned,
      returnDate: returnDateReturned,
      status: 'RETURNED',
      fineAmount: 5, // 1 day overdue * ₹5
      issuedBy: librarian2._id,
      returnedBy: librarian1._id
    });

    console.log('[Seed] Created Transactions (Active, Overdue, Returned).');

    // 7. Create Fines
    await Fine.create([
      {
        fineId: 'FINE-10001',
        transactionId: txOverdue._id,
        memberId: members[1]._id,
        amount: 30,
        reason: 'Overdue 6 days for Clean Code',
        status: 'PENDING',
        createdAt: new Date()
      },
      {
        fineId: 'FINE-10002',
        transactionId: txReturned._id,
        memberId: members[2]._id,
        amount: 5,
        reason: 'Overdue 1 day for Operating System Concepts',
        status: 'PAID',
        createdAt: returnDateReturned,
        paidAt: returnDateReturned
      }
    ]);

    console.log('[Seed] Created Fines records.');

    // 8. Create RFID Hardware Activity Events
    await RFIDEvent.create([
      {
        eventId: 'EVT-10001',
        UID: members[0].RFIDCardId,
        eventType: 'MEMBER_SCAN',
        deviceId: 'RFID_DEVICE_01',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000),
        processed: true,
        relatedMember: members[0]._id
      },
      {
        eventId: 'EVT-10002',
        UID: books[0].RFIDTagId,
        eventType: 'ISSUE',
        deviceId: 'RFID_DEVICE_01',
        timestamp: issueDateActive,
        processed: true,
        relatedBook: books[0]._id,
        relatedMember: members[0]._id,
        transactionId: txActive._id
      },
      {
        eventId: 'EVT-10003',
        UID: 'UNKNOWN_99FF00',
        eventType: 'UNKNOWN_TAG',
        deviceId: 'RFID_DEVICE_01',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000),
        processed: true
      },
      {
        eventId: 'EVT-10004',
        UID: books[3].RFIDTagId,
        eventType: 'RETURN',
        deviceId: 'RFID_DEVICE_01',
        timestamp: returnDateReturned,
        processed: true,
        relatedBook: books[3]._id,
        relatedMember: members[2]._id,
        transactionId: txReturned._id
      }
    ]);

    console.log('[Seed] Created RFID scan activity event logs.');

    // 9. Create Audit Logs
    await AuditLog.create([
      {
        logId: 'LOG-10001',
        userId: adminUser._id,
        action: 'SYSTEM_INIT',
        entityType: 'SYSTEM',
        description: 'Library Management System initialized with default academic schema',
        timestamp: new Date(now.getTime() - 86400000 * 30)
      },
      {
        logId: 'LOG-10002',
        userId: librarian1._id,
        action: 'ISSUE_BOOK',
        entityType: 'TRANSACTION',
        entityId: 'TXN-10001',
        description: `Issued book "${books[0].title}" to student ${members[0].name}`,
        timestamp: issueDateActive
      }
    ]);

    console.log('[Seed] Database seeding completed successfully!');
  } catch (error) {
    console.error('[Seed Error] Seeding failed:', error);
    throw error;
  }
};

// Allow running directly from terminal: node scripts/seed.js
if (require.main === module) {
  const connectDB = require('../backend/src/config/db');
  connectDB().then(async () => {
    await seedDatabase();
    process.exit(0);
  });
}

module.exports = seedDatabase;
