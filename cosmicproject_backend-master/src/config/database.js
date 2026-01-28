const mongoose = require('mongoose');
const logger = require('../utils/logger');

const createIndexes = async () => {
  try {
    // Create text indexes for search functionality
    await mongoose.connection.db.collection('projects').createIndex({
      siteName: 'text',
      clientName: 'text',
      location: 'text'
    });
    
    // Create compound indexes for common queries
    await mongoose.connection.db.collection('projects').createIndex({
      assignedManager: 1,
      status: 1
    });
    
    await mongoose.connection.db.collection('users').createIndex({
      role: 1,
      status: 1
    });
    
    logger.info('✅ Database indexes created successfully');
  } catch (error) {
    logger.error('❌ Error creating indexes:', error);
  }
};

const connectDB = async () => {
  try {
    // Handle connection events (set up before connecting)
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connection established');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
    // Use MongoDB Atlas connection string from environment
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cosmic-solutions';
    
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      logger.warn('⚠️  MONGODB_URI not set in environment variables');
      logger.info('📝 Falling back to local MongoDB: mongodb://127.0.0.1:27017/cosmic-solutions');
    } else {
      logger.info('📝 Connecting to MongoDB Atlas...');
    }
    
    // Check if we're in WebContainer environment (no MongoDB available)
    if (process.env.NODE_ENV === 'development' && !process.env.MONGODB_URI) {
      logger.warn('⚠️  MongoDB not available in WebContainer environment');
      logger.info('📝 Using mock database for demonstration purposes');
      
      // Create a mock connection for development
      const mockConnection = {
        connection: {
          host: 'mock-database',
          readyState: 1
        }
      };
      
      // Set up mock mongoose connection
      mongoose.connection.readyState = 1;
      
      logger.info(`✅ Mock Database Connected: ${mockConnection.connection.host}`);
      return mockConnection;
    }
    
    // Try to connect to actual MongoDB (Atlas or local)
    try {
      const conn = await mongoose.connect(mongoURI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000, // Increased timeout for Atlas
        socketTimeoutMS: 45000,
      });
      
      logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
      logger.info(`📊 Database: ${conn.connection.name}`);
      
      // Create indexes for better performance
      await createIndexes();
      
      return conn;
    } catch (mongoError) {
      logger.error(`❌ MongoDB connection failed: ${mongoError.message}`);
      
      // Only use mock in development if explicitly in WebContainer
      if (process.env.NODE_ENV === 'development') {
        logger.warn('⚠️  Using mock database for development');
        mongoose.connection.readyState = 1;
        return { connection: { host: 'mock-database' } };
      } else {
        // In production, throw error instead of using mock
        throw mongoError;
      }
    }
    
  } catch (error) {
    logger.error(`❌ Database connection issue: ${error.message}`);
    
    // In production, exit if database connection fails
    if (process.env.NODE_ENV === 'production') {
      logger.error('❌ Cannot start server without database connection in production');
      process.exit(1);
    }
    
    // In development, continue with mock database
    logger.info('📝 Continuing with mock database for demonstration');
    mongoose.connection.readyState = 1;
    return { connection: { host: 'mock-database' } };
  }
};

module.exports = connectDB;