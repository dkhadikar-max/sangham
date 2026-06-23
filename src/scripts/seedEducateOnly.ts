import { prisma } from '../config/database';
import { seedEducatePaths } from './seedEducate';

async function main() {
  console.log('[SeedEducate] Connecting to database...');
  await prisma.$connect();
  console.log('[SeedEducate] Connected.\n');

  const result = await seedEducatePaths();
  console.log(`[SeedEducate] Seeded:  ${result.seeded.join(', ') || 'none'}`);
  if (result.failed.length) console.log(`[SeedEducate] Failed:  ${result.failed.join(', ')}`);
  console.log(`[SeedEducate] Done. ${result.seeded.length}/${result.total} paths seeded.`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('[SeedEducate] Fatal:', err);
  process.exit(1);
});
