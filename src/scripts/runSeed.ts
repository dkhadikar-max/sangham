import { prisma } from '../config/database';
import { seedBuddhistTexts } from './seedLibrary';
import { seedAmbedkarTexts } from './seedAmbedkar';
import { seedAmbedkarTranslations } from './seedTranslations';

async function main() {
  console.log('[Seed] Connecting to database...');
  await prisma.$connect();

  console.log('\n[Seed] ── Pali Canon (SuttaCentral) ──');
  const pali = await seedBuddhistTexts();
  console.log(`[Seed] Seeded:  ${pali.seeded.join(', ') || 'none'}`);
  if (pali.failed.length) console.log(`[Seed] Failed:  ${pali.failed.join(', ')}`);
  console.log(`[Seed] Total:   ${pali.total} texts\n`);

  console.log('[Seed] ── Navayana (Ambedkar) ──');
  const navayana = await seedAmbedkarTexts();
  console.log(`[Seed] Seeded:  ${navayana.seeded.join(', ') || 'none'}`);
  if (navayana.failed.length) console.log(`[Seed] Failed:  ${navayana.failed.join(', ')}`);
  console.log(`[Seed] Total:   ${navayana.total} texts\n`);

  console.log('[Seed] ── Translations (hi / te) ──');
  const translations = await seedAmbedkarTranslations();
  console.log(`[Seed] Seeded:  ${translations.seeded.join(', ') || 'none'}`);
  if (translations.failed.length) console.log(`[Seed] Failed:  ${translations.failed.join(', ')}`);
  console.log(`[Seed] Total:   ${translations.total} texts\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[Seed] Fatal:', err);
  process.exit(1);
});
