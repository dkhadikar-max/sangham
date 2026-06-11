#!/usr/bin/env node
'use strict';
// Strips ?pgbouncer=true from DATABASE_URL so Prisma's schema engine can use
// the transaction-mode pooler for migrations (schema engine runs raw DDL, no
// prepared statements). The app process keeps the original DATABASE_URL.
const { execSync } = require('child_process');

const originalUrl = process.env.DATABASE_URL || '';
const migrateUrl  = originalUrl.replace('?pgbouncer=true', '');

process.env.DATABASE_URL = migrateUrl;
process.env.DIRECT_URL   = migrateUrl;

console.log('Running database migrations...');
execSync('npx prisma migrate deploy', { stdio: 'inherit' });

// Restore original URL so the app's PrismaClient uses pgbouncer mode
process.env.DATABASE_URL = originalUrl;
console.log('Starting server...');
require('../dist/index.js');
