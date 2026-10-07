const mongoose = require('mongoose');

/**
 * Database Connection Handler for Library Management System
 * Connects to MongoDB with fallback to MongoDB Memory Server if local Mongo service is offline.
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/library_rfid_db';
    
    // Attempt standard connection with 3-second timeout
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[Database] Local MongoDB connection failed (${error.message}). Initializing fallback MongoDB Memory Server...`);
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'library_rfid_db',
          port: 27017
        }
      });
      const memoryUri = mongoServer.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`[Database] MongoDB Memory Server connected successfully at ${memoryUri}`);
      return conn;
    } catch (memError) {
      console.error(`[Database] Critical Error: Unable to initialize MongoDB Memory Server: ${memError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
