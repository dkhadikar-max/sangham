import { execSync } from 'child_process';

const originalUrl = process.env.DATABASE_URL || '';
const migrateUrl  = originalUrl.replace('?pgbouncer=true', '');

process.env.DATABASE_URL = migrateUrl;
process.env.DIRECT_URL   = migrateUrl;

console.log('Running database migrations...');
execSync('npx prisma migrate deploy', { stdio: 'inherit' });

// Restore so PrismaClient in index uses pgbouncer mode
process.env.DATABASE_URL = originalUrl;
console.log('Starting server...');

require('./index');
