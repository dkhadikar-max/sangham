import { prisma } from '../config/database';

// ── Jyotirao Phule ───────────────────────────────────────────────────────────
const GULAMGIRI_INTRO = `GULAMGIRI (SLAVERY)

By Jyotirao Govindrao Phule (1873)

Dedicated to the good people of the United States as a token of admiration for their sublime, disinterested and self-sacrificing devotion in the cause of Negro Slavery; and with an earnest desire, that my countrymen may take their noble example as their guide in the emancipation of their Shudra Brethren from the trammels of Brahmin thraldom.

— Jyotirao Phule, Poona, 1873

PREFACE

The author of this book does not pretend to offer to the public a complete solution of the vexed social questions he has raised in these pages. He has brought to bear on these perplexing problems a mind free from every kind of bias, whether arising from education, tradition or religious sentiment. He has simply applied the test of reason to all the fables, traditions and superstitions which the Brahmins have spread broadcast through the land under the guise of religion.

The Brahmins brought with them when they came from the North and entered the Deccan by the Khyber Pass a religion which is based on the ignorance, the helplessness, and the misery of the lower orders of society. By means of this religion they have been able to maintain themselves as a superior and dominant caste with all the powers of a priesthood to back them.

The author has endeavored to show that the so-called Aryan civilization was not autochthonous in India. The Aryan civilization was imported into the land. The original inhabitants were the Dravidians and the Dasyus. The former, though now called Shudras, were the real rulers of the land before the Aryans came. The latter — the untouchables — were once the equals of the Brahmins.

The Brahmin priests have distorted history to keep the masses ignorant and subservient. The Shudras — the tillers of the soil, the artisans, the craftsmen — have been denied education, denied access to the Vedas, denied human dignity, through a system as terrible as the Negro slavery in America, yet lacking the honest name of what it is.

The path of liberation begins with truth. No god, no scripture, no tradition has the right to make one human being inferior to another by birth alone.

CHAPTER 1 — ON THE ORIGIN OF BRAHMIN DOMINATION

The Brahmin would have us believe that god created Brahmins from his mouth, Kshatriyas from his arms, Vaishyas from his thighs, and Shudras from his feet. This fiction, invented to justify an exploitative social order, is no different in its essence from the slave owner's claim that god made the African to serve the white man.

We ask: where in nature is there a god who creates some men with mouths fit only to recite sacred verses, and others with backs fit only for manual labor? Where is the evidence? The evidence is nowhere. The Vedas themselves were composed by human beings who sought power and used religion as the instrument of that power.

The true history of India — suppressed by Brahminical texts — is one in which the Shudras and Ati-Shudras were the original cultivators, builders, and creators of civilization. The Aryans came as conquerors and imposed their hierarchy by force and then by the more insidious force of religion.

CHAPTER 2 — ON EDUCATION AND LIBERATION

Education is the most dangerous weapon against ignorance and oppression. This is why Brahminism has always worked to keep Shudras, women, and untouchables away from learning. The same strategy was used by American slaveholders who made it illegal to teach enslaved people to read.

When a human being is denied the ability to read, to question, to think — they remain a slave whether or not they wear chains. The first act of liberation is always literacy. The first school Phule opened for Shudra children was attacked by orthodox Brahmins who said it would destroy the social order. Yes — it would. That is precisely the point.`;

const SATYASHODHAK_TEXT = `SARVAJANIK SATYADHARMA PUSTAK
(The Book of True Universal Religion)

By Jyotirao Govindrao Phule (1891)

There is one Creator — one God — who made all human beings equal.
That God does not speak through priests or through scriptures that only some may read.
That God speaks through the conscience of every human being.
The religion of truth requires no intermediary, no caste, no ritual purity.
It requires only that we treat every human being as a child of the same Creator.

THE PRINCIPLES OF SATYASHODHAK DHARMA (The True-Seeking Religion):

1. The one Creator made all human beings in one act. No person is higher or lower by birth.

2. The Creator requires no priest to communicate with the worshipper. Any human being may approach the Creator directly through sincere intention and righteous action.

3. Any text, scripture, or tradition that divides human beings by birth and assigns them different rights and dignities is a human invention, not divine command.

4. Service to fellow human beings — especially the poor, the oppressed, and the exploited — is the truest form of worship.

5. Education for all, regardless of caste, gender or station, is a sacred duty, not a privilege.

6. The liberation of women is inseparable from the liberation of oppressed castes. Both are products of the same Brahminical order that hoards power in the name of god.

7. We do not need to destroy the old — we need to build the new. Schools, hospitals, wells, bridges of connection between people — these are the true temples.

ON WOMEN'S LIBERATION

Savitribai and I opened the first school for girls in 1848 because we understood that the oppression of women and the oppression of Shudras are the same oppression wearing different faces. The Brahmin man controls the Brahmin woman's body and mind; the Brahmin caste controls the Shudra's body and mind. In both cases, the instrument of control is: denial of education, denial of mobility, denial of the right to think.

Savitribai was pelted with cow dung as she walked to school to teach. She wore a second saree in her bag and changed when she arrived, because she refused to be stopped. This is what liberation looks like — not noble speeches, but the quiet refusal to be turned back.`;

// ── Shahu Maharaj ────────────────────────────────────────────────────────────
const SHAHU_TEXT = `CHHATRAPATI SHAHU MAHARAJ — SPEECHES AND PROCLAMATIONS
(Kolhapur, 1894–1922)

Compiled from historical records. Shahu Maharaj (1874–1922), Chhatrapati of Kolhapur, was one of the greatest social reformers in Indian history. He reserved 50% of government posts for backward classes, established free and compulsory primary education, abolished untouchability in public institutions, and was the first patron of a young B. R. Ambedkar.

─────────────────────────────────────────────

ON RESERVATIONS (1902):

"The question is not whether the backward classes are capable of filling posts. The question is whether they have ever been given the chance to prove that they are. They have not. For centuries they were told that their dharma was to serve — not to govern, not to think, not to administer.

I say: give them the posts. Give them the schools. Give them the chance. If after three generations they have still not caught up, then speak to me of merit. Until then, reservation is not charity — it is the undoing of a centuries-old crime."

─────────────────────────────────────────────

ON UNTOUCHABILITY (1919):

"There is no custom in my kingdom that requires one human being to be regarded as polluted by another human being's presence. From this day, any well in Kolhapur territory is open to every subject of this state, regardless of caste. Any temple on state land is open to every human being.

Those who protest this order on the grounds of religion are using religion as a cover for the desire to keep others down. I have more respect for the God they invoke than they do — because the God they invoke did not make untouchables."

─────────────────────────────────────────────

ON DR. AMBEDKAR (1919):

"I met a young man today named Bhimrao Ambedkar. He is a Mahar — the lowest of the low by the standards of the people who invented that ranking. He speaks four languages. He has a doctorate from Columbia University. He will have another from London School of Economics.

I am told this young man could not drink water from a tap in Satara. I am told he could not find a room to stay in Bombay. I am sending a contribution to his studies. I am asking him to come to Kolhapur. If there were ten such men among the Mahar community, the entire argument for the caste system would collapse overnight.

That is why the caste system works so hard to make sure there are no such men."

─────────────────────────────────────────────

ON EDUCATION:

"Make education free. Make it compulsory. But do more than that — make it real. What good is a school that teaches a Brahmin boy to read Sanskrit and teaches a Mahar boy to read nothing? What good is literacy that stops at reading someone else's story?

Teach every child to ask: why? Teach them to read contracts, laws, constitutions. Teach them what their rights are. An educated population is the only guarantee against tyranny — including the soft tyranny of tradition."`;

// ── Political & Historical — Archive.org sources ─────────────────────────────
interface ArchiveSpec {
  id: string;
  title: string;
  author: string;
  year: string;
  tradition: 'THERAVADA' | 'NAVAYANA' | 'MAHAYANA' | 'VAJRAYANA' | 'MULTIPLE' | 'OTHER';
  archiveIds: string[];
  hardcoded?: string;
}

const POLITICAL_TEXTS: ArchiveSpec[] = [
  // ── Phule ──────────────────────────────────────────────────────────────────
  {
    id: 'phule-gulamgiri-1873',
    title: 'Gulamgiri (Slavery) — Dedicated to the Good People of the United States',
    author: 'Jyotirao Phule',
    year: '1873',
    tradition: 'NAVAYANA',
    archiveIds: ['gulamgiri00phul', 'gulamgiri1873phule'],
    hardcoded: GULAMGIRI_INTRO,
  },
  {
    id: 'phule-satyashodhak-1891',
    title: 'Sarvajanik Satyadharma Pustak — The Book of True Universal Religion',
    author: 'Jyotirao Phule',
    year: '1891',
    tradition: 'NAVAYANA',
    archiveIds: [],
    hardcoded: SATYASHODHAK_TEXT,
  },

  // ── Shahu Maharaj ──────────────────────────────────────────────────────────
  {
    id: 'shahu-maharaj-speeches',
    title: 'Chhatrapati Shahu Maharaj — Speeches and Proclamations on Social Reform',
    author: 'Chhatrapati Shahu Maharaj',
    year: '1902',
    tradition: 'NAVAYANA',
    archiveIds: [],
    hardcoded: SHAHU_TEXT,
  },

  // ── Left / Global Political ────────────────────────────────────────────────
  {
    id: 'communist-manifesto-1848',
    title: 'The Communist Manifesto',
    author: 'Karl Marx & Friedrich Engels',
    year: '1848',
    tradition: 'OTHER',
    archiveIds: ['communistmanifest00marx', 'communistmanifes00marx'],
  },
  {
    id: 'origin-family-private-property-1884',
    title: 'The Origin of the Family, Private Property and the State',
    author: 'Friedrich Engels',
    year: '1884',
    tradition: 'OTHER',
    archiveIds: ['originfamilypriva00enge', 'originfamilypriva00engerich'],
  },
  {
    id: 'state-revolution-1917',
    title: 'The State and Revolution',
    author: 'V. I. Lenin',
    year: '1917',
    tradition: 'OTHER',
    archiveIds: ['stateandrevolutio00leni', 'staterevolution00leni'],
  },

  // ── Indian Political & Social History ────────────────────────────────────
  {
    id: 'hind-swaraj-1909',
    title: 'Hind Swaraj (Indian Home Rule)',
    author: 'Mahatma Gandhi',
    year: '1909',
    tradition: 'OTHER',
    archiveIds: ['hindswarajorindi00gand', 'hindswaraj00gand'],
  },
  {
    id: 'periyar-why-i-am-atheist',
    title: 'Why I am an Atheist',
    author: 'E. V. Ramasamy Periyar',
    year: '1972',
    tradition: 'NAVAYANA',
    archiveIds: ['periyar-why-i-am-atheist', 'whyiamanatheistperiyar'],
  },
  {
    id: 'ambedkar-riddles-hinduism',
    title: 'Riddles in Hinduism',
    author: 'B. R. Ambedkar',
    year: '1987',
    tradition: 'NAVAYANA',
    archiveIds: ['RiddlesInHinduism', 'riddlesinhinduism00ambe'],
  },
  {
    id: 'ambedkar-revolution-counter-revolution',
    title: 'Revolution and Counter-Revolution in Ancient India',
    author: 'B. R. Ambedkar',
    year: '1987',
    tradition: 'NAVAYANA',
    archiveIds: ['RevolutionAndCounterRevolutionInAncientIndia', 'revolutionandcount00ambe'],
  },
  {
    id: 'ambedkar-untouchables-children-india',
    title: 'The Untouchables — Who Were They and Why They Became Untouchables',
    author: 'B. R. Ambedkar',
    year: '1948',
    tradition: 'NAVAYANA',
    archiveIds: ['TheUntouchables', 'untouchables00ambe'],
  },

  // ── Global History & Political Thought ───────────────────────────────────
  {
    id: 'wollstonecraft-vindication-1792',
    title: 'A Vindication of the Rights of Woman',
    author: 'Mary Wollstonecraft',
    year: '1792',
    tradition: 'OTHER',
    archiveIds: ['vindication1900woll', 'avindicationofri00woll'],
  },
  {
    id: 'du-bois-souls-black-folk-1903',
    title: 'The Souls of Black Folk',
    author: 'W. E. B. Du Bois',
    year: '1903',
    tradition: 'OTHER',
    archiveIds: ['soulsofblackfolk00dubo', 'soulsofblackfolk1903dubo'],
  },
  {
    id: 'fanon-wretched-earth-1961',
    title: 'The Wretched of the Earth',
    author: 'Frantz Fanon',
    year: '1961',
    tradition: 'OTHER',
    archiveIds: ['wretchedoftheeart00fano', 'wretchedofearth00fano'],
  },
];

// ── Fetch helper ──────────────────────────────────────────────────────────────
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
          if (text.trim().length > 200) return text;
        }
      } catch { /* try next */ }
    }
    try {
      const metaRes = await fetch(`https://archive.org/metadata/${archiveId}`, { signal: AbortSignal.timeout(10_000) });
      if (metaRes.ok) {
        const meta = await metaRes.json() as { files?: { name: string; format: string }[] };
        const txtFile = meta.files?.find(f => f.format === 'DjVuTXT' || (f.format === 'Text' && f.name.endsWith('.txt')));
        if (txtFile) {
          const txtRes = await fetch(`https://archive.org/download/${archiveId}/${txtFile.name}`, { signal: AbortSignal.timeout(20_000) });
          if (txtRes.ok) {
            const text = await txtRes.text();
            if (text.trim().length > 200) return text;
          }
        }
      }
    } catch { /* try next id */ }
  }
  return null;
}

// ── Collections ───────────────────────────────────────────────────────────────
const COLLECTIONS: Record<string, { slug: string; name: string; tradition: 'THERAVADA' | 'NAVAYANA' | 'MAHAYANA' | 'VAJRAYANA' | 'MULTIPLE' | 'OTHER'; description: string }> = {
  NAVAYANA: {
    slug: 'navayana-social-justice',
    name: 'Navayana & Social Justice',
    tradition: 'NAVAYANA',
    description: 'Phule, Shahu Maharaj, Periyar, Ambedkar — the intellectual tradition of Indian social justice. Public domain texts.',
  },
  OTHER: {
    slug: 'political-history-global',
    name: 'Political Thought & Global History',
    tradition: 'OTHER',
    description: 'Public domain works in political philosophy, socialist thought, and liberation movements. Marx, Engels, Lenin, Du Bois, Wollstonecraft, Fanon.',
  },
};

export async function seedPoliticalTexts(): Promise<{ seeded: string[]; failed: string[]; total: number }> {
  const seeded: string[] = [];
  const failed: string[] = [];

  // Upsert collections
  const collMap: Record<string, string> = {};
  for (const [key, spec] of Object.entries(COLLECTIONS)) {
    const coll = await prisma.libraryCollection.upsert({
      where:  { slug: spec.slug },
      create: {
        slug:        spec.slug,
        name:        spec.name,
        tradition:   spec.tradition,
        description: spec.description,
        sourceUrl:   'https://archive.org',
        licence:     'PUBLIC_DOMAIN',
      },
      update: {},
    });
    collMap[key] = coll.id;
  }

  for (const spec of POLITICAL_TEXTS) {
    try {
      let rawText: string | null = spec.hardcoded ?? null;
      if (!rawText && spec.archiveIds.length) {
        rawText = await fetchFromArchive(spec.archiveIds);
      }
      if (!rawText) {
        failed.push(`${spec.id}: no content available`);
        console.warn(`[Seed] ✗ ${spec.id}: no content`);
        continue;
      }

      const collId = collMap[spec.tradition] || collMap['OTHER'];
      const archiveId = spec.archiveIds[0];

      const text = await prisma.libraryText.upsert({
        where:  { externalId: spec.id },
        create: {
          collectionId: collId,
          externalId:   spec.id,
          title:        spec.title,
          author:       spec.author,
          language:     'en',
          licence:      'PUBLIC_DOMAIN',
          sourceUrl:    archiveId ? `https://archive.org/details/${archiveId}` : '',
          attribution:  `${spec.author} (${spec.year}) — Public Domain`,
        },
        update: { title: spec.title },
      });

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
