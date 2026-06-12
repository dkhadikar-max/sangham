import { execSync }  from 'child_process';
import { PrismaClient } from '@prisma/client';
import * as fs     from 'fs';
import * as path   from 'path';
import * as crypto from 'crypto';

// Applies pending Prisma migrations without advisory locks.
// prisma migrate deploy uses pg_advisory_lock which blocks indefinitely when
// a previous crashed deploy left a stale lock on a PgBouncer server connection.
// prisma db execute runs raw SQL directly with no locking overhead.
async function applyPendingMigrations(): Promise<void> {
  const dbUrl  = process.env.DATABASE_URL || '';
  const execUrl = dbUrl.replace('?pgbouncer=true', '');

  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

  try {
    // Ensure tracking table exists (Prisma normally creates this; safe to repeat)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id"                  TEXT        NOT NULL,
        "checksum"            TEXT        NOT NULL,
        "finished_at"         TIMESTAMPTZ,
        "migration_name"      TEXT        NOT NULL,
        "logs"                TEXT,
        "rolled_back_at"      TIMESTAMPTZ,
        "started_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "applied_steps_count" INTEGER     NOT NULL DEFAULT 0,
        PRIMARY KEY ("id")
      )
    `);

    // Fetch already-applied migration names
    const rows = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL
    `;
    const applied = new Set(rows.map(r => r.migration_name));

    // Walk prisma/migrations in order
    const migDir = path.join(process.cwd(), 'prisma', 'migrations');
    const dirs = fs.readdirSync(migDir)
      .filter(f => !f.endsWith('.toml') && fs.statSync(path.join(migDir, f)).isDirectory())
      .sort();

    let count = 0;
    for (const name of dirs) {
      if (applied.has(name)) continue;

      const sqlPath = path.join(migDir, name, 'migration.sql');
      if (!fs.existsSync(sqlPath)) continue;

      const sql      = fs.readFileSync(sqlPath, 'utf-8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      const id       = crypto.randomUUID();

      console.log(`Applying: ${name}`);

      // Execute SQL via pooler — no advisory locks
      execSync(`npx prisma db execute --url "${execUrl}" --file "${sqlPath}"`, {
        stdio:   'inherit',
        timeout: 60_000,
      });

      // Record as applied (skip if already recorded by a concurrent process)
      await prisma.$executeRawUnsafe(`
        INSERT INTO "_prisma_migrations"
          (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
        SELECT $1,$2,NOW(),$3,''::text,NULL,NOW(),1
        WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name=$3)
      `, id, checksum, name);

      console.log(`  ✓ ${name}`);
      count++;
    }

    if (count === 0) console.log('All migrations already applied.');
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  const originalUrl = process.env.DATABASE_URL || '';
  console.log('Running database migrations...');
  await applyPendingMigrations();
  process.env.DATABASE_URL = originalUrl;
  console.log('Starting server...');
  require('./index');
}

main().catch(err => {
  console.error('Startup failed:', err.message);
  process.exit(1);
});
