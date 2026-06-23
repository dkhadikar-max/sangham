import { PrismaClient } from '@prisma/client';
import * as fs     from 'fs';
import * as path   from 'path';
import * as crypto from 'crypto';
import { seedEducatePaths } from './scripts/seedEducate';

// Split a SQL file into individual executable statements.
// Handles dollar-quoted blocks (DO $$ ... END $$;) correctly.
function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inDollarQuote = false;

  for (const line of sql.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--')) continue; // skip comment-only lines

    current += line + '\n';

    // Toggle dollar-quote state for each $$ on the line
    const ddCount = (line.match(/\$\$/g) || []).length;
    if (ddCount % 2 !== 0) inDollarQuote = !inDollarQuote;

    // End of statement: semicolon at end of line, not inside a dollar-quote block
    if (!inDollarQuote && trimmed.endsWith(';')) {
      const stmt = current.trim();
      if (stmt.length > 0) statements.push(stmt);
      current = '';
    }
  }

  const tail = current.trim();
  if (tail.length > 0) statements.push(tail);

  return statements.filter(s => s.length > 0);
}

async function applyPendingMigrations(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL || '';
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

  try {
    // Ensure tracking table exists
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

    const rows = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL
    `;
    const applied = new Set(rows.map(r => r.migration_name));

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

      // Execute each statement directly — no execSync, no npx, no shell
      const statements = splitSqlStatements(sql);
      for (const stmt of statements) {
        await prisma.$executeRawUnsafe(stmt);
      }

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

async function seedStaticContent(): Promise<void> {
  const result = await seedEducatePaths();
  if (result.seeded.length) console.log(`Seeded educate paths: ${result.seeded.join(', ')}`);
  if (result.failed.length) console.warn(`Educate seed failed: ${result.failed.join(', ')}`);
}

async function main(): Promise<void> {
  console.log('Running database migrations...');
  await applyPendingMigrations();
  console.log('Seeding static content...');
  await seedStaticContent();
  console.log('Starting server...');
  require('./index');
}

main().catch(err => {
  console.error('Startup failed:', err.message);
  process.exit(1);
});
