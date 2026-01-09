#!/usr/bin/env node

/**
 * Database Initialization Script
 * Run this after starting the backend to initialize database tables
 */

const { initializeDatabase } = require('../backend/dist/config/database');

console.log('🏀 Initializing OpenSportsAnalytics Database...\n');

initializeDatabase()
  .then(() => {
    console.log('\n✅ Database initialized successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Database initialization failed:', error);
    process.exit(1);
  });
