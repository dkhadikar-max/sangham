import { prisma } from '../config/database';
import { seedBuddhistTexts } from './seedLibrary';

async function main() {
  console.log('[Seed] Connecting to database...');
  await prisma.$connect();

  console.log('[Seed] Starting Buddhist text seed...');
  const result = await seedBuddhistTexts();

  console.log('\n[Seed] ─────────────────────────────');
  console.log(`[Seed] Seeded:  ${result.seeded.join(', ') || 'none'}`);
  if (result.failed.length) {
    console.log(`[Seed] Skipped: ${result.failed.join(', ')}`);
  }
  console.log(`[Seed] Total:   ${result.total} texts`);
  console.log('[Seed] ─────────────────────────────\n');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[Seed] Fatal:', err);
  process.exit(1);
});
