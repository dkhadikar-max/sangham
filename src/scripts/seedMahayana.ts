import { prisma } from '../config/database';

// Heart Sutra — Max Müller translation (1894), public domain, hardcoded
const HEART_SUTRA_TEXT = `THE HEART OF PRAJNA PARAMITA SUTRA

Translated by Max Müller (1894)
From: The Sacred Books of the East, Vol. XLIX

THE BLESSED AVALOKITESVARA BODHISATTVA, when practising deeply the Prajñā Pāramitā, perceived that all five aggregates are empty. Then he overcame all suffering.

"O Śāriputra, form is emptiness, emptiness is form. Emptiness is not other than form, form is not other than emptiness. Whatever is form, that is emptiness; whatever is emptiness, that is form.

The same is true of feelings, perceptions, mental formations, and consciousness.

O Śāriputra, all dharmas are marked with emptiness; they do not appear or disappear, are not tainted or pure, do not increase or decrease.

Therefore, in emptiness there is no form, no feeling, no perception, no mental formation, no consciousness. No eye, no ear, no nose, no tongue, no body, no mind. No colour, no sound, no smell, no taste, no touch, no object of mind. No realm of eyes, and so on until no realm of mind consciousness.

No ignorance and also no extinction of it, and so on until no old age and death and also no extinction of them. No suffering, no origination, no stopping, no path, no cognition, also no attainment with nothing to attain.

The Bodhisattva depends on Prajñā Pāramitā and the mind is no hindrance; without any hindrance no fears exist. Far apart from every perverted view one dwells in Nirvāṇa.

In the three worlds all Buddhas depend on Prajñā Pāramitā and attain Anuttarā Samyak Saṃbodhi.

Therefore know that Prajñā Pāramitā is the great transcendent mantra, is the great bright mantra, is the utmost mantra, is the supreme mantra, which is able to relieve all suffering and is true, not false.

So proclaim the Prajñā Pāramitā mantra, proclaim the mantra that says:

Gate gate pāragate pārasaṃgate bodhi svāhā.

(Gone, gone, gone beyond, gone completely beyond — Enlightenment! Hail!)`;

interface ArchiveSpec {
  id: string;
  title: string;
  author: string;
  year: string;
  archiveIds: string[];
  pageStart?: number;
  hardcoded?: string;
}

const MAHAYANA_TEXTS: ArchiveSpec[] = [
  {
    id: 'heart-sutra-muller',
    title: 'Prajñāpāramitā Hṛdaya Sūtra — The Heart of Perfect Wisdom',
    author: 'Trans. Max Müller',
    year: '1894',
    archiveIds: [],
    hardcoded: HEART_SUTRA_TEXT,
  },
  {
    id: 'diamond-sutra-muller',
    title: 'Vajracchedikā Prajñāpāramitā — The Diamond Cutter Sutra',
    author: 'Trans. Max Müller',
    year: '1894',
    archiveIds: ['sacredbooksofeaste49maxmuoft', 'diamondsutra00mull'],
  },
  {
    id: 'gospel-of-buddha-carus',
    title: 'The Gospel of Buddha — According to Old Records',
    author: 'Paul Carus',
    year: '1894',
    archiveIds: ['gospelofbuddha00carurich', 'gospelofbuddha00caru', 'gospelofbuddha1894caru'],
  },
  {
    id: 'buddhism-its-history-1899',
    title: 'Buddhism: Its History and Literature',
    author: 'Paul Carus',
    year: '1899',
    archiveIds: ['buddhismitshistor00caruiala', 'buddhismitshistor00caru'],
  },
];

async function fetchFromArchive(archiveIds: string[]): Promise<string | null> {
  for (const archiveId of archiveIds) {
    const urls = [
      `https://archive.org/download/${archiveId}/${archiveId}_djvu.txt`,
      `https://archive.org/download/${archiveId}/${archiveId}.txt`,
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
        if (res.ok) {
          const text = await res.text();
          if (text.trim().length > 500) return text;
        }
      } catch { /* try next */ }
    }
    // Try metadata to find the best text file
    try {
      const metaRes = await fetch(`https://archive.org/metadata/${archiveId}`, { signal: AbortSignal.timeout(10_000) });
      if (metaRes.ok) {
        const meta = await metaRes.json() as { files?: { name: string; format: string }[] };
        const txtFile = meta.files?.find(f => f.format === 'DjVuTXT' || (f.format === 'Text' && f.name.endsWith('.txt')));
        if (txtFile) {
          const txtRes = await fetch(`https://archive.org/download/${archiveId}/${txtFile.name}`, { signal: AbortSignal.timeout(20_000) });
          if (txtRes.ok) {
            const text = await txtRes.text();
            if (text.trim().length > 500) return text;
          }
        }
      }
    } catch { /* try next id */ }
  }
  return null;
}

export async function seedMahayanaTexts(): Promise<{ seeded: string[]; failed: string[]; total: number }> {
  const seeded: string[] = [];
  const failed: string[] = [];

  const collection = await prisma.libraryCollection.upsert({
    where:  { slug: 'mahayana-texts' },
    create: {
      slug:        'mahayana-texts',
      name:        'Mahāyāna & Early Buddhist Writings',
      tradition:   'MAHAYANA',
      description: 'Heart Sūtra, Diamond Sūtra, and early Western compilations of Buddhist teachings. Public domain translations.',
      sourceUrl:   'https://archive.org',
      licence:     'PUBLIC_DOMAIN',
    },
    update: {},
  });

  for (const spec of MAHAYANA_TEXTS) {
    try {
      let rawText: string | null = spec.hardcoded ?? null;
      if (!rawText) {
        rawText = await fetchFromArchive(spec.archiveIds);
      }
      if (!rawText) {
        failed.push(`${spec.id}: could not fetch from archive.org`);
        console.warn(`[Seed] ✗ ${spec.id}: no content from archive.org`);
        continue;
      }

      const text = await prisma.libraryText.upsert({
        where:  { externalId: spec.id },
        create: {
          collectionId: collection.id,
          externalId:   spec.id,
          title:        spec.title,
          author:       spec.author,
          translator:   spec.author.startsWith('Trans.') ? spec.author.replace('Trans. ', '') : undefined,
          language:     'en',
          licence:      'PUBLIC_DOMAIN',
          sourceUrl:    spec.archiveIds[0] ? `https://archive.org/details/${spec.archiveIds[0]}` : '',
          attribution:  `${spec.author} (${spec.year}) — Public Domain via Archive.org`,
        },
        update: { title: spec.title },
      });

      // Split by paragraphs, preserving structure
      const paragraphs = rawText
        .split(/\n{2,}/)
        .map(p => p.replace(/\s+/g, ' ').trim())
        .filter(p => p.length > 20);

      const segments = paragraphs.map((content, i) => ({
        textId:     text.id,
        segmentKey: `p${i}`,
        content,
        sequence:   i,
      }));

      for (let i = 0; i < segments.length; i += 200) {
        await prisma.librarySegment.createMany({
          data: segments.slice(i, i + 200),
          skipDuplicates: true,
        });
      }

      seeded.push(spec.id);
      console.log(`[Seed] ✓ ${spec.id} — ${segments.length} segments`);
    } catch (err: any) {
      failed.push(`${spec.id}: ${err.message}`);
      console.warn(`[Seed] ✗ ${spec.id}: ${err.message}`);
    }
  }

  return { seeded, failed, total: seeded.length };
}
