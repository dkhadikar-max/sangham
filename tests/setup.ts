import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://sangham:password@localhost:5432/sangham_test';
process.env.JWT_SECRET    = 'test-secret-key-minimum-32-characters-long';
process.env.REDIS_URL     = process.env.REDIS_URL || 'redis://localhost:6379';
