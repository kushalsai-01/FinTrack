import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * Database connection configuration
 * Uses connection pooling and proper error handling
 */
class Database {
  constructor() {
    this.connection = null;
  }

  async connect(uri) {
    try {
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      this.connection = await mongoose.connect(uri, options);
      
      logger.info('MongoDB connected successfully', {
        host: this.connection.connection.host,
        database: this.connection.connection.name,
      });

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      return this.connection;
    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      logger.info('MongoDB disconnected');
    }
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

export default new Database();
