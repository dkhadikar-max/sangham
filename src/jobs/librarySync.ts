/**
 * Library Sync Job
 * Pulls latest bilara-data (SuttaCentral CC0) from GitHub and upserts into DB.
 * Run nightly via cron.
 *
 * Usage: ts-node src/jobs/librarySync.ts
 *
 * In production: AWS EventBridge → Lambda → this script
 */
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/database';

const BILARA_REPO = 'https://github.com/suttacentral/bilara-data.git';
const LOCAL_PATH  = path.resolve('/tmp/bilara-data');

export async function syncSuttaCentral(): Promise<void> {
  console.log('[LibrarySync] Starting SuttaCentral sync...');

  // Clone or pull
  if (!fs.existsSync(LOCAL_PATH)) {
    execSync(`git clone --depth=1 --branch=published ${BILARA_REPO} ${LOCAL_PATH}`);
  } else {
    execSync(`git -C ${LOCAL_PATH} pull --ff-only`);
  }

  // Ensure the Tipitaka collection exists
  const collection = await prisma.libraryCollection.upsert({
    where: { id: 'suttacentral-tipitaka' } as any,
    create: {
      name: 'Tipitaka (Pali Canon)',
      tradition: 'THERAVADA',
      description: 'Early Buddhist texts — Dīgha, Majjhima, Saṁyutta, Aṅguttara Nikāyas and Vinaya.',
      sourceUrl: 'https://suttacentral.net',
      licence: 'CC0',
    },
    update: {},
  });

  // Walk translation/en directory for English suttas
  const translationDir = path.join(LOCAL_PATH, 'translation', 'en');
  if (!fs.existsSync(translationDir)) { console.warn('[LibrarySync] Translation dir not found'); return; }

  let imported = 0;
  const dirs = fs.readdirSync(translationDir);

  for (const authorDir of dirs.slice(0, 5)) { // limit in dev
    const authorPath = path.join(translationDir, authorDir);
    const files = fs.readdirSync(authorPath, { withFileTypes: true, recursive: true } as any)
      .filter((f: any) => f.name?.endsWith('.json'))
      .slice(0, 20); // limit in dev

    for (const file of files as any[]) {
      const filePath = path.join(authorPath, file.name);
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, string>;
      const externalId = file.name.replace('.json', '').split('_')[0];

      const text = await prisma.libraryText.upsert({
        where: { id: `sc-${externalId}-en` } as any,
        create: {
          collectionId: collection.id,
          externalId,
          title: externalId.toUpperCase(),
          translator: authorDir,
          language: 'en',
          licence: 'CC0',
          sourceUrl: `https://suttacentral.net/${externalId}`,
          attribution: `Source: SuttaCentral.net | Translator: ${authorDir} | Licence: CC0`,
        },
        update: {},
      });

      const segments = Object.entries(raw).map(([key, content], i) => ({
        textId: text.id,
        segmentKey: key,
        content,
        sequence: i,
      }));

      // Upsert segments in batches of 100
      for (let i = 0; i < segments.length; i += 100) {
        await prisma.librarySegment.createMany({ data: segments.slice(i, i + 100), skipDuplicates: true });
      }
      imported++;
    }
  }
  console.log(`[LibrarySync] Done. Imported ${imported} texts.`);
}
