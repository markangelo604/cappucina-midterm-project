// server.js
// ===============================================
// PURPOSE:
//  • Loads environment variables from .env
//  • Connects to MongoDB
//  • Exports the connection and database handle
//  • Can be imported by other JS files
// ===============================================

require('dotenv').config();
const { MongoClient } = require('mongodb');

const mongoUri = process.env.LOCALHOST;
const database = process.env.DATABASE;

let client;
let db;

async function connectDB() {
  try {
    if (!client) {
      client = new MongoClient(mongoUri);
      await client.connect();
      db = client.db(database);
      console.log('✅ MongoDB connected (Node.js)');
    }
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

function getCollections() {
  if (!db) throw new Error('Database not connected. Call connectDB() first.');

  return {
    users: db.collection(process.env.USERCOLLECTION),
    rides: db.collection(process.env.RIDESCOLLECTION),
    bookings: db.collection(process.env.BOOKINGSCOLLECTION),
    reviews: db.collection(process.env.REVIEWSCOLLECTION)
  };
}

module.exports = {
  connectDB,
  getCollections
};
