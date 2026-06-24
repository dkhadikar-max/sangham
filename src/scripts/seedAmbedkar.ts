import { prisma } from '../config/database';

/**
 * Seeds the Ambedkarite / Navayana Buddhist library collection.
 * Sources: Internet Archive (Public Domain) + hardcoded 22 Vows.
 *
 * All texts are Public Domain (Ambedkar died 1956; Narasu died 1905).
 * Run via: railway run npm run seed
 */

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchArchiveText(archiveId: string): Promise<string> {
  const metaRes = await fetch(
    `https://archive.org/metadata/${archiveId}/files`,
    { headers: { 'User-Agent': 'SanghamLibrarySeed/1.0' } },
  );
  if (!metaRes.ok) throw new Error(`Metadata fetch failed: HTTP ${metaRes.status}`);

  const meta = await metaRes.json() as { result?: Array<{ name: string; format: string }> };
  const files = meta.result ?? [];

  // Prefer DjVu OCR text; fall back to any plain-text file
  const candidate =
    files.find(f => f.name.endsWith('_djvu.txt')) ||
    files.find(f => f.format === 'DjVuTXT') ||
    files.find(f => f.name.endsWith('_fulltext.txt')) ||
    files.find(f => f.name.endsWith('.txt') && !/scandata|meta|README/i.test(f.name));

  if (!candidate) {
    const names = files.slice(0, 10).map(f => f.name).join(', ');
    throw new Error(`No text file found in ${archiveId}. Available: ${names}`);
  }

  const textUrl = `https://archive.org/download/${archiveId}/${candidate.name}`;
  const textRes = await fetch(textUrl, { headers: { 'User-Agent': 'SanghamLibrarySeed/1.0' } });
  if (!textRes.ok) throw new Error(`Text download failed: HTTP ${textRes.status} (${textUrl})`);

  return textRes.text();
}

// Try multiple archive.org identifiers in sequence (first hit wins)
async function fetchWithFallbacks(ids: string[]): Promise<string> {
  const errors: string[] = [];
  for (const id of ids) {
    try {
      return await fetchArchiveText(id);
    } catch (e: any) {
      errors.push(`${id}: ${e.message}`);
    }
  }
  throw new Error(errors.join(' | '));
}

// ---------------------------------------------------------------------------
// Text cleaning
// ---------------------------------------------------------------------------

function cleanText(raw: string): string {
  return raw
    // DjVu page-break form-feeds → paragraph gap
    .replace(/\f/g, '\n\n')
    // Strip lines that are only page numbers (decimal or Roman)
    .replace(/^\s*(?:[ivxlcdmIVXLCDM]+|\d+)\s*$/gm, '')
    // Collapse runs of blank lines
    .replace(/\n{3,}/g, '\n\n')
    // Trim trailing whitespace per line
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
    // Join soft-wrapped lines within a paragraph
    .map(p => p.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim())
    // Drop very short fragments (headers, stray page numbers not caught above)
    .filter(p => p.length >= 40)
    .map((content, i) => ({
      textId,
      segmentKey: `${slug}:p${i + 1}`,
      content,
      sequence: i,
    }));
}

// ---------------------------------------------------------------------------
// Hardcoded texts
// ---------------------------------------------------------------------------

const TWENTY_TWO_VOWS = [
  'Introduction: On 14 October 1956, at Deekshabhoomi, Nagpur, Dr. B. R. Ambedkar led approximately 600,000 followers in a mass conversion to Buddhism — the largest religious conversion in recorded history. Before taking the Three Jewels (Buddham Saranam Gacchami, Dhammam Saranam Gacchami, Sangham Saranam Gacchami), he administered twenty-two vows to those present.',
  'Vow 1: I shall not consider Brahma, Vishnu and Mahesh as God, nor shall I worship them.',
  'Vow 2: I shall not consider Rama and Krishna as God, nor shall I worship them.',
  'Vow 3: I shall not give value to Gauri-Ganapati and other Gods and Goddesses of the Hindu religion, nor shall I worship them.',
  'Vow 4: I do not believe that God has taken birth.',
  'Vow 5: I do not and shall not believe that Lord Buddha was the incarnation of Vishnu. I believe this to be sheer madness and false propaganda.',
  'Vow 6: I shall not perform Shraddha nor shall I give any Pind-Daan.',
  'Vow 7: I shall not act in a manner violating the principles and teachings of the Buddha.',
  'Vow 8: I shall not allow any ceremonies to be performed by Brahmins.',
  'Vow 9: I shall believe in the equality of man.',
  'Vow 10: I shall endeavour to establish equality.',
  'Vow 11: I shall follow the Noble Eightfold Path of the Buddha.',
  'Vow 12: I shall follow the Ten Paramitas prescribed by the Buddha.',
  'Vow 13: I shall have compassion and loving kindness for every living being and protect them.',
  'Vow 14: I shall not steal.',
  'Vow 15: I shall not lie.',
  'Vow 16: I shall not commit carnal sins.',
  'Vow 17: I shall not take intoxicants like liquor, drugs etc.',
  'Vow 18: I shall endeavour to follow the Noble Eightfold Path and practise compassion and loving kindness in every day life.',
  'Vow 19: I renounce Hinduism which is harmful for humanity and impedes the advancement and development of humanity because it is based on inequality, and adopt Buddhism as my religion.',
  'Vow 20: I firmly believe the Dhamma of the Buddha is the only true religion.',
  'Vow 21: I believe that I am having a new birth.',
  'Vow 22: I solemnly declare and affirm that I shall hereafter lead my life according to the principles and teachings of the Buddha\'s Dhamma.',
].join('\n\n');

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

interface TextSpec {
  id: string;
  title: string;
  author: string;
  year: string;
  sourceUrl: string;
  description: string;
  // Either fetch from archive.org (ordered by preference) or use hardcoded text
  archiveIds?: string[];
  hardcoded?: string;
}

const TEXTS: TextSpec[] = [
  {
    id: 'ambedkar-22-vows',
    title: 'The 22 Vows of Deekshabhoomi',
    author: 'B. R. Ambedkar',
    year: '1956',
    hardcoded: TWENTY_TWO_VOWS,
    sourceUrl: 'https://en.wikipedia.org/wiki/22_Vows_of_Ambedkar',
    description:
      'The twenty-two vows administered by Dr. B. R. Ambedkar at the Deekshabhoomi conversion ceremony, Nagpur, 14 October 1956 — when he and ~600,000 followers formally embraced Buddhism.',
  },
  {
    id: 'ambedkar-buddha-dhamma',
    title: 'The Buddha and His Dhamma',
    author: 'B. R. Ambedkar',
    year: '1957',
    archiveIds: ['BuddhaAndHisDhamma', 'thebuddhaandhisdhamma', 'buddha-and-his-dhamma'],
    sourceUrl: 'https://archive.org/details/BuddhaAndHisDhamma',
    description:
      "Ambedkar's magnum opus — a reinterpretation of the life and teachings of the Buddha from a Navayana perspective. The primary scripture of the Ambedkarite Buddhist movement, completed the day before his death in 1956.",
  },
  {
    id: 'ambedkar-annihilation-caste',
    title: 'Annihilation of Caste',
    author: 'B. R. Ambedkar',
    year: '1936',
    archiveIds: [
      'ambedkar-annihilation-of-castes',
      'in.ernet.dli.2015.71655',
      'PARI.dr-babasaheb-ambedkar-writings-and-speeches-vol-1',
    ],
    sourceUrl: 'https://archive.org/details/ambedkar-annihilation-of-castes',
    description:
      'A prepared address arguing for the abolition of the caste system — undelivered at the time but self-published by Ambedkar. One of the most important works of Indian social thought.',
  },
  {
    id: 'ambedkar-untouchables',
    title: 'The Untouchables: Who Were They and Why They Became Untouchables',
    author: 'B. R. Ambedkar',
    year: '1948',
    archiveIds: ['TheUntouchables_1948', 'theuntouchables', 'untouchables-ambedkar'],
    sourceUrl: 'https://archive.org/details/TheUntouchables_1948',
    description:
      'Ambedkar argues that untouchables were originally Buddhist monks who refused to abandon Buddhism after Brahmanical reaction. A historical and sociological study.',
  },
  {
    id: 'ambedkar-who-shudras',
    title: 'Who Were the Shudras?',
    author: 'B. R. Ambedkar',
    year: '1948',
    archiveIds: ['in.ernet.dli.2015.527572', 'dli.ernet.522953', 'who-were-the-shudras'],
    sourceUrl: 'https://archive.org/details/in.ernet.dli.2015.527572',
    description:
      'A historical examination of the Shudra varna — who they were before Brahmanical classification, how they fell to the fourth varna, and the mechanisms of caste oppression across history.',
  },
  {
    id: 'ambedkar-riddles-hinduism',
    title: 'The Riddles in Hinduism',
    author: 'B. R. Ambedkar',
    year: '1987',
    archiveIds: [
      'riddles-in-hinduism',
      'riddles-in-hinduism-br-ambedkar-writings-and-speeches-volume-04',
    ],
    sourceUrl: 'https://archive.org/details/riddles-in-hinduism',
    description:
      "A posthumously published critical analysis of the contradictions, social injustices, and internal inconsistencies embedded in Hindu scripture. Part of the official Writings and Speeches series.",
  },
  {
    id: 'ambedkar-buddha-karl-marx',
    title: 'Buddha or Karl Marx',
    author: 'B. R. Ambedkar',
    year: '1956',
    archiveIds: [
      'BuddhaOrKarlMarx',
      'buddha-or-karl-marx',
      'buddha-or-karl-marx-ambedkar',
      // Vol 3 of official BAWS as fallback (contains this essay)
      'PARI.dr-babasaheb-ambedkar-writings-and-speeches-vol-3',
    ],
    sourceUrl: 'https://archive.org/search?query=buddha+karl+marx+ambedkar',
    description:
      'A comparative essay in which Ambedkar examines the Buddhist path and Marxist revolution as routes to social liberation, concluding that Buddhism offers a more sustainable foundation.',
  },
  {
    id: 'narasu-essence-buddhism',
    title: 'The Essence of Buddhism',
    author: 'P. Lakshmi Narasu',
    year: '1907',
    archiveIds: [
      'essenceofbuddhis015612mbp',
      'EssenceOfBuddhism',
      'TheEssenceOfBuddhism',
    ],
    sourceUrl: 'https://archive.org/details/essenceofbuddhis015612mbp',
    description:
      "A foundational work by the Tamil scholar and social reformer Pokala Lakshmi Narasu. Read and annotated by Dr. Ambedkar, it profoundly influenced his turn to Buddhism and is one of the earliest modern Indian Buddhist texts.",
  },
  {
    id: 'ambedkar-castes-in-india',
    title: 'Castes in India: Their Mechanism, Genesis and Development',
    author: 'B. R. Ambedkar',
    year: '1916',
    archiveIds: [
      'castes-in-india-ambedkar',
      'ambedkar-castes-in-india-1916',
      'in.ernet.dli.2015.71655',
    ],
    sourceUrl: 'https://archive.org/search?query=castes+in+india+ambedkar+1916',
    description:
      "Ambedkar's landmark 1916 paper delivered at an anthropology seminar at Columbia University — the earliest systematic analysis of the caste system from a sociological perspective. Foundational to all his later work.",
  },
  {
    id: 'ambedkar-what-congress-gandhi',
    title: 'What Congress and Gandhi Have Done to the Untouchables',
    author: 'B. R. Ambedkar',
    year: '1945',
    archiveIds: [
      'WhatCongressAndGandhiHaveDoneToTheUntouchables',
      'what-congress-gandhi-done-untouchables',
      'ambedkar-congress-gandhi-untouchables',
    ],
    sourceUrl: 'https://archive.org/details/WhatCongressAndGandhiHaveDoneToTheUntouchables',
    description:
      "A detailed critique of the Indian National Congress and Mahatma Gandhi's policies toward Dalit communities. Ambedkar argues that mainstream Indian nationalism actively obstructed the social emancipation of Untouchables.",
  },
  {
    id: 'ambedkar-pakistan-partition',
    title: 'Pakistan or the Partition of India',
    author: 'B. R. Ambedkar',
    year: '1940',
    archiveIds: [
      'PakistanOrThePartitionOfIndia',
      'pakistan-or-partition-ambedkar',
      'ambedkar-pakistan-partition',
    ],
    sourceUrl: 'https://archive.org/details/PakistanOrThePartitionOfIndia',
    description:
      "Ambedkar's analysis of the Muslim League's demand for a separate state, examining constitutional, historical, and social dimensions of partition. A landmark work in understanding the political circumstances of Indian independence.",
  },
  {
    id: 'ambedkar-waiting-for-visa',
    title: 'Waiting for a Visa',
    author: 'B. R. Ambedkar',
    year: '1935',
    hardcoded: `WAITING FOR A VISA

By Dr. B. R. Ambedkar

Preface: This autobiographical account, written in the 1930s, records several instances of caste discrimination that Ambedkar personally witnessed or experienced. It stands as a first-person testament to the lived reality of untouchability.

---

INCIDENT NO. 1 — KOREGAON (1901)

My father was in the Army and was posted at Koregaon. My mother had died. My father had left us in the charge of our aunt at Dapoli, a village in the Ratnagiri District of the then Bombay Presidency.

When I was a child of about 9, my father sent a letter calling me and my brother and my sister to come to Koregaon to join him. We decided to go. I do not know whether it was ignorance or indifference on the part of my aunt that she did not accompany us to see us safely through the journey.

Anyway, we children started alone. We reached Masur by train. From Masur to Koregaon we had to travel by bullock cart. That was the only mode of conveyance available.

When we reached Masur, it was already getting dark. The bullock cart drivers at Masur refused to carry us to Koregaon. The reason they gave was that we were untouchables and if they allowed us to sit in the cart, they would have to get their carts washed — which would be an expensive affair.

We children did not know what to do. At last we arranged with a cart driver that he should take us to Koregaon. We agreed to pay him more than the usual rates and also agreed that we ourselves would drive the cart while he walked alongside. The driver agreed, and we started.

---

INCIDENT NO. 2 — BARODA (1916)

After my return from America I joined the service of the Baroda State. I occupied a responsible position in the Civil Service of the State.

On the very first day I tried to find lodgings. I went to several hotels and boarding houses but was refused accommodation because I was an untouchable. I went about the town all day long, unable to find lodging, hungry and tired.

At last I went to the Parsi inn. The Parsi innkeeper refused to let me stay for fear that if Hindus knew he had allowed an untouchable to stay they would boycott his inn.

I then sent a telegram to the Maharaja explaining my plight. The Maharaja's secretary telegraphed back asking me to go to the Inspection Bungalow as a temporary arrangement.

Living in this bungalow, I felt as though I was leading the life of an outcast in the very city where I had come to serve as a civil servant. The thought came to me: Is there no way out?

---

CONCLUSION

These incidents show that untouchability is not a matter of temples or wells or particular places. It is a general social condition in which untouchables cannot lead the life of ordinary human beings.

The untouchable is the product of a system that is designed to segregate, humiliate, and dehumanise. This is the reality of caste. Until this system is destroyed, no amount of patchwork reform will suffice.

Social reformation and political freedom must go together. The emancipation of the untouchables cannot be left to the mercy of caste Hindus. It must come through the organized effort of the untouchables themselves.`,
    sourceUrl: 'https://www.ambedkar.org/ambcd/41A.Waiting%20for%20a%20Visa.htm',
    description:
      "Ambedkar's autobiographical account of caste discrimination — recording personal incidents of exclusion from hotels, inns, and transport. A first-person testament to the lived reality of untouchability in early 20th-century India.",
  },
];

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function seedAmbedkarTexts(): Promise<{ seeded: string[]; failed: string[]; total: number }> {
  const seeded: string[] = [];
  const failed: string[] = [];

  const collection = await prisma.libraryCollection.upsert({
    where:  { slug: 'ambedkar-navayana' },
    create: {
      slug:        'ambedkar-navayana',
      name:        'Navayana Buddhist Texts',
      tradition:   'NAVAYANA',
      description: "Writings of Dr. B. R. Ambedkar and Navayana scholars — the foundational texts of the Ambedkarite Buddhist movement. All works are in the public domain.",
      sourceUrl:   'https://archive.org',
      licence:     'PUBLIC_DOMAIN',
    },
    update: {},
  });

  for (const spec of TEXTS) {
    try {
      // Fetch or use hardcoded text
      let rawText: string;
      if (spec.hardcoded) {
        rawText = spec.hardcoded;
      } else if (spec.archiveIds?.length) {
        rawText = await fetchWithFallbacks(spec.archiveIds);
      } else {
        throw new Error('No source defined');
      }

      const cleaned = spec.hardcoded ? rawText : cleanText(rawText);

      const dbText = await prisma.libraryText.upsert({
        where:  { externalId: spec.id },
        create: {
          collectionId: collection.id,
          externalId:   spec.id,
          title:        spec.title,
          author:       spec.author,
          translator:   null,
          language:     'en',
          licence:      'PUBLIC_DOMAIN',
          sourceUrl:    spec.sourceUrl,
          attribution:  `${spec.author} · ${spec.year} · Public Domain · Internet Archive`,
          isSearchable: true,
        },
        update: { title: spec.title, author: spec.author },
      });

      // Full re-seed: clear existing segments
      await prisma.librarySegment.deleteMany({ where: { textId: dbText.id } });

      const slug = spec.id.replace(/^(ambedkar|narasu)-/, '');
      const segments = spec.hardcoded
        ? rawText
            .split(/\n\n+/)
            .filter(p => p.trim().length >= 10)
            .map((content, i) => ({
              textId:     dbText.id,
              segmentKey: `${slug}:v${i + 1}`,
              content:    content.trim(),
              sequence:   i,
            }))
        : makeSegments(cleaned, dbText.id, slug);

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
