import { prisma } from '../config/database';
import { seedBuddhistTexts } from './seedLibrary';
import { seedAmbedkarTexts } from './seedAmbedkar';
import { seedAmbedkarTranslations } from './seedTranslations';
import { seedEducatePaths } from './seedEducate';
import { seedMahayanaTexts } from './seedMahayana';
import { seedPoliticalTexts } from './seedPolitical';
import { seedDalitLiterature } from './seedDalitLiterature';

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

  console.log('[Seed] ── Mahāyāna & Early Buddhist Writings ──');
  const mahayana = await seedMahayanaTexts();
  console.log(`[Seed] Seeded:  ${mahayana.seeded.join(', ') || 'none'}`);
  if (mahayana.failed.length) console.log(`[Seed] Failed:  ${mahayana.failed.join(', ')}`);
  console.log(`[Seed] Total:   ${mahayana.total} texts\n`);

  console.log('[Seed] ── Political, History & Social Justice ──');
  const political = await seedPoliticalTexts();
  console.log(`[Seed] Seeded:  ${political.seeded.join(', ') || 'none'}`);
  if (political.failed.length) console.log(`[Seed] Failed:  ${political.failed.join(', ')}`);
  console.log(`[Seed] Total:   ${political.total} texts\n`);

  console.log('[Seed] ── Educate Learning Paths ──');
  const educate = await seedEducatePaths();
  console.log(`[Seed] Seeded:  ${educate.seeded.join(', ') || 'none'}`);
  if (educate.failed.length) console.log(`[Seed] Failed:  ${educate.failed.join(', ')}`);
  console.log(`[Seed] Total:   ${educate.total} paths\n`);

  console.log('[Seed] ── Dalit Literature & Social Justice Library ──');
  const dalit = await seedDalitLiterature();
  console.log(`[Seed] Seeded:  ${dalit.seeded.join(', ') || 'none'}`);
  if (dalit.failed.length) console.log(`[Seed] Failed:  ${dalit.failed.join(', ')}`);
  console.log(`[Seed] Total:   ${dalit.total} texts\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[Seed] Fatal:', err);
  process.exit(1);
});
