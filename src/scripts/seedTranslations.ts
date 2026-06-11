import { prisma } from '../config/database';

/**
 * Seeds translated Ambedkarite texts into the library.
 * Languages: Hindi (hi), Telugu (te)
 * Sources: Internet Archive (Public Domain)
 *
 * Run via: railway run npm run seed
 */

// ---------------------------------------------------------------------------
// Shared fetch/clean helpers (archive.org)
// ---------------------------------------------------------------------------

async function fetchArchiveFile(archiveId: string, fileName: string): Promise<string> {
  const url = `https://archive.org/download/${archiveId}/${encodeURIComponent(fileName)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'SanghamLibrarySeed/1.0' } });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status} — ${url}`);
  return res.text();
}

async function fetchArchiveText(archiveId: string): Promise<string> {
  const metaRes = await fetch(
    `https://archive.org/metadata/${archiveId}/files`,
    { headers: { 'User-Agent': 'SanghamLibrarySeed/1.0' } },
  );
  if (!metaRes.ok) throw new Error(`Metadata failed: HTTP ${metaRes.status}`);

  const meta = await metaRes.json() as { result?: Array<{ name: string; format: string }> };
  const files = meta.result ?? [];

  const candidate =
    files.find(f => f.name.endsWith('_djvu.txt')) ||
    files.find(f => f.format === 'DjVuTXT') ||
    files.find(f => f.name.endsWith('_fulltext.txt')) ||
    files.find(f => f.name.endsWith('.txt') && !/scandata|meta|README/i.test(f.name));

  if (!candidate) {
    throw new Error(
      `No text file in ${archiveId}. Files: ${files.slice(0, 8).map(f => f.name).join(', ')}`,
    );
  }

  return fetchArchiveFile(archiveId, candidate.name);
}

function cleanText(raw: string): string {
  return raw
    .replace(/\f/g, '\n\n')
    .replace(/^\s*(?:[ivxlcdmIVXLCDM]+|\d+)\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n').map(l => l.trimEnd()).join('\n')
    .trim();
}

function makeSegments(
  text: string,
  textId: string,
  slug: string,
): Array<{ textId: string; segmentKey: string; content: string; sequence: number }> {
  return text
    .split(/\n\n+/)
    .map(p => p.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim())
    .filter(p => p.length >= 40)
    .map((content, i) => ({
      textId,
      segmentKey: `${slug}:p${i + 1}`,
      content,
      sequence: i,
    }));
}

async function upsertText(
  collectionId: string,
  spec: {
    externalId: string;
    title: string;
    author: string;
    translator?: string;
    year: string;
    language: string;
    sourceUrl: string;
  },
  segments: Array<{ textId: string; segmentKey: string; content: string; sequence: number }>,
) {
  const dbText = await prisma.libraryText.upsert({
    where:  { externalId: spec.externalId },
    create: {
      collectionId,
      externalId:   spec.externalId,
      title:        spec.title,
      author:       spec.author,
      translator:   spec.translator ?? null,
      language:     spec.language,
      licence:      'PUBLIC_DOMAIN',
      sourceUrl:    spec.sourceUrl,
      attribution:  `${spec.author} · ${spec.year} · Public Domain · Internet Archive`,
      isSearchable: true,
    },
    update: { title: spec.title, author: spec.author },
  });

  await prisma.librarySegment.deleteMany({ where: { textId: dbText.id } });

  // Re-create segments, correcting textId now that we have the DB id
  const rows = segments.map((s, i) => ({ ...s, textId: dbText.id, sequence: i }));
  for (let i = 0; i < rows.length; i += 200) {
    await prisma.librarySegment.createMany({ data: rows.slice(i, i + 200), skipDuplicates: true });
  }

  return dbText;
}

// ---------------------------------------------------------------------------
// Hindi translations
// ---------------------------------------------------------------------------

interface HindiSpec {
  id: string;
  title: string;
  titleHi: string;
  translator?: string;
  year: string;
  archiveIds: string[];
  sourceUrl: string;
}

const HINDI_TEXTS: HindiSpec[] = [
  {
    id: 'ambedkar-buddha-dhamma-hi',
    title: 'Buddha Aur Unka Dhamma',
    titleHi: 'बुद्ध और उनका धम्म',
    translator: 'Bhikkhu Anand Kausalyayan',
    year: '1957',
    archiveIds: ['buddha-aur-unka-dhamma', 'qogf_bhagwan-buddha-aur-unka-dharma-by-dr-bhimrao-ambedkar-translated-into-hindi-by-b'],
    sourceUrl: 'https://archive.org/details/buddha-aur-unka-dhamma',
  },
  {
    id: 'ambedkar-untouchables-hi',
    title: 'Achoot Kaun Aur Kaise',
    titleHi: 'अछूत — कौन और कैसे?',
    year: '1948',
    archiveIds: ['achoot-kaun-aur-kaise-h-dr.-bhimrao-ambedkar'],
    sourceUrl: 'https://archive.org/details/achoot-kaun-aur-kaise-h-dr.-bhimrao-ambedkar',
  },
  {
    id: 'ambedkar-riddles-hinduism-hi',
    title: 'Hindu Dharm Ki Paheliyan',
    titleHi: 'हिंदू धर्म की पहेलियाँ',
    year: '1987',
    archiveIds: ['bk1363'],
    sourceUrl: 'https://archive.org/details/bk1363',
  },
  {
    id: 'ambedkar-waiting-visa-hi',
    title: 'Visa Ke Liye Intzaar',
    titleHi: 'वीज़ा के लिए इंतज़ार',
    year: '1935',
    archiveIds: ['VisaKeLiyeIntzaar-Hindi-BhimraoAmbedkar'],
    sourceUrl: 'https://archive.org/details/VisaKeLiyeIntzaar-Hindi-BhimraoAmbedkar',
  },
];

async function seedHindiTexts(
  seeded: string[],
  failed: string[],
): Promise<void> {
  const collection = await prisma.libraryCollection.upsert({
    where:  { slug: 'ambedkar-navayana-hi' },
    create: {
      slug:        'ambedkar-navayana-hi',
      name:        'नवयान बौद्ध ग्रंथ (हिंदी)',
      tradition:   'NAVAYANA',
      description: 'डॉ. बी. आर. अम्बेडकर की रचनाएँ — नवयान बौद्ध आंदोलन के मूल ग्रंथ। Hindi translations of Dr. B. R. Ambedkar\'s foundational Navayana Buddhist texts.',
      sourceUrl:   'https://archive.org',
      licence:     'PUBLIC_DOMAIN',
    },
    update: {},
  });

  for (const spec of HINDI_TEXTS) {
    try {
      let raw = '';
      const errors: string[] = [];
      for (const id of spec.archiveIds) {
        try { raw = await fetchArchiveText(id); break; }
        catch (e: any) { errors.push(`${id}: ${e.message}`); }
      }
      if (!raw) throw new Error(errors.join(' | '));

      const cleaned = cleanText(raw);
      const segments = makeSegments(cleaned, 'PLACEHOLDER', spec.id);

      await upsertText(
        collection.id,
        {
          externalId:  spec.id,
          title:       `${spec.titleHi} — ${spec.title}`,
          author:      'B. R. Ambedkar',
          translator:  spec.translator,
          year:        spec.year,
          language:    'hi',
          sourceUrl:   spec.sourceUrl,
        },
        segments,
      );

      seeded.push(spec.id);
      console.log(`[Seed] ✓ ${spec.id} — ${segments.length} segments`);
    } catch (err: any) {
      failed.push(`${spec.id}: ${err.message}`);
      console.warn(`[Seed] ✗ ${spec.id}: ${err.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Telugu translations — full BAWS series from baws-telugu-all
// ---------------------------------------------------------------------------

// Each entry maps to a _djvu.txt file within the baws-telugu-all archive item.
// BAWS = Babasaheb Ambedkar Writings and Speeches (Telugu: Rachanalu Prasangalu)
// Volume ordering follows the official Telugu publication.
const TELUGU_VOLUMES: Array<{ vol: string; fileName: string; title: string }> = [
  { vol: '1',    fileName: 'Telugu_Volume_1_djvu.txt',     title: 'రచనలు-ప్రసంగాలు సంపుటం 1 (Writings & Speeches Vol. 1)' },
  { vol: '2',    fileName: 'Telugu_Volume_2_djvu.txt',     title: 'రచనలు-ప్రసంగాలు సంపుటం 2 (Writings & Speeches Vol. 2)' },
  { vol: '3',    fileName: 'Telugu_Volume_3_djvu.txt',     title: 'రచనలు-ప్రసంగాలు సంపుటం 3 (Writings & Speeches Vol. 3)' },
  { vol: '4',    fileName: 'Telugu_Volume_4_djvu.txt',     title: 'రచనలు-ప్రసంగాలు సంపుటం 4 (Writings & Speeches Vol. 4)' },
  { vol: '5',    fileName: 'Telugu_Volume_5_djvu.txt',     title: 'రచనలు-ప్రసంగాలు సంపుటం 5 (Writings & Speeches Vol. 5)' },
  { vol: '6',    fileName: 'Telugu_Volume_6_djvu.txt',     title: 'రచనలు-ప్రసంగాలు సంపుటం 6 (Writings & Speeches Vol. 6)' },
  { vol: '7',    fileName: 'Telugu_Volume_7_djvu.txt',     title: 'రచనలు-ప్రసంగాలు సంపుటం 7 (Writings & Speeches Vol. 7)' },
  { vol: '8',    fileName: 'Telugu_Volume_8_djvu.txt',     title: 'రచనలు-ప్రసంగాలు సంపుటం 8 (Writings & Speeches Vol. 8)' },
  { vol: '9',    fileName: 'Telugu_Volume_9_djvu.txt',     title: 'రచనలు-ప్రసంగాలు సంపుటం 9 (Writings & Speeches Vol. 9)' },
  { vol: '10-1', fileName: 'Telugu_Volume_10_1__djvu.txt', title: 'రచనలు-ప్రసంగాలు సంపుటం 10 (భాగం 1) (Writings & Speeches Vol. 10, Part 1)' },
  { vol: '10-2', fileName: 'Telugu_Volume_10_2__djvu.txt', title: 'రచనలు-ప్రసంగాలు సంపుటం 10 (భాగం 2) (Writings & Speeches Vol. 10, Part 2)' },
  { vol: '10-3', fileName: 'Telugu_Volume_10_3__djvu.txt', title: 'రచనలు-ప్రసంగాలు సంపుటం 10 (భాగం 3) (Writings & Speeches Vol. 10, Part 3)' },
  { vol: '10-4', fileName: 'Telugu_Volume_10_4__djvu.txt', title: 'రచనలు-ప్రసంగాలు సంపుటం 10 (భాగం 4) (Writings & Speeches Vol. 10, Part 4)' },
  { vol: '11',   fileName: 'Telugu_Volume_11_djvu.txt',    title: 'రచనలు-ప్రసంగాలు సంపుటం 11 — బుద్ధుడు మరియు అతని ధమ్మ (Writings & Speeches Vol. 11 — The Buddha and His Dhamma)' },
  { vol: '12',   fileName: 'Telugu_Volume_12_djvu.txt',    title: 'రచనలు-ప్రసంగాలు సంపుటం 12 (Writings & Speeches Vol. 12)' },
];

const ARCHIVE_ID_TE = 'baws-telugu-all';

async function seedTeluguTexts(
  seeded: string[],
  failed: string[],
): Promise<void> {
  const collection = await prisma.libraryCollection.upsert({
    where:  { slug: 'ambedkar-baws-te' },
    create: {
      slug:        'ambedkar-baws-te',
      name:        'అంబేద్కర్ రచనలు-ప్రసంగాలు (BAWS Telugu)',
      tradition:   'NAVAYANA',
      description: 'బాబాసాహెబ్ అంబేద్కర్ రచనలు మరియు ప్రసంగాలు — పూర్తి తెలుగు సంపుటి. Complete Telugu translation of Dr. B. R. Ambedkar\'s Writings and Speeches (12 volumes).',
      sourceUrl:   `https://archive.org/details/${ARCHIVE_ID_TE}`,
      licence:     'PUBLIC_DOMAIN',
    },
    update: {},
  });

  for (const vol of TELUGU_VOLUMES) {
    const externalId = `ambedkar-baws-te-vol-${vol.vol}`;
    try {
      const raw = await fetchArchiveFile(ARCHIVE_ID_TE, vol.fileName);
      const cleaned = cleanText(raw);
      const segments = makeSegments(cleaned, 'PLACEHOLDER', externalId);

      await upsertText(
        collection.id,
        {
          externalId,
          title:     vol.title,
          author:    'B. R. Ambedkar',
          year:      '1987',
          language:  'te',
          sourceUrl: `https://archive.org/details/${ARCHIVE_ID_TE}`,
        },
        segments,
      );

      seeded.push(externalId);
      console.log(`[Seed] ✓ ${externalId} — ${segments.length} segments`);
    } catch (err: any) {
      failed.push(`${externalId}: ${err.message}`);
      console.warn(`[Seed] ✗ ${externalId}: ${err.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function seedAmbedkarTranslations(): Promise<{ seeded: string[]; failed: string[]; total: number }> {
  const seeded: string[] = [];
  const failed: string[] = [];

  await seedHindiTexts(seeded, failed);
  await seedTeluguTexts(seeded, failed);

  return { seeded, failed, total: seeded.length };
}
