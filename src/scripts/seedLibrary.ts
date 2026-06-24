import { prisma } from '../config/database';

const BILARA_BASE = 'https://raw.githubusercontent.com/suttacentral/bilara-data/published';

interface SuttaSpec {
  id: string;
  title: string;
  path: string;
}

// Curated selection — Bhikkhu Sujato translations, CC0
// Actual bilara-data path: translation/en/sujato/sutta/{nikaya}/...
const BASE = 'translation/en/sujato/sutta';
const SUTTAS: SuttaSpec[] = [
  // Dīgha Nikāya (Long Discourses)
  { id: 'dn2',    title: 'Sāmaññaphala Sutta — The Fruits of the Contemplative Life',            path: `${BASE}/dn/dn2_translation-en-sujato.json` },
  { id: 'dn16',   title: 'Mahāparinibbāna Sutta — The Great Passing',                            path: `${BASE}/dn/dn16_translation-en-sujato.json` },
  { id: 'dn22',   title: 'Mahāsatipaṭṭhāna Sutta — The Great Discourse on Mindfulness',         path: `${BASE}/dn/dn22_translation-en-sujato.json` },

  // Majjhima Nikāya (Middle Length Discourses)
  { id: 'mn10',   title: 'Satipaṭṭhāna Sutta — Mindfulness Meditation',                         path: `${BASE}/mn/mn10_translation-en-sujato.json` },
  { id: 'mn26',   title: 'Ariyapariyesanā Sutta — The Noble Search',                             path: `${BASE}/mn/mn26_translation-en-sujato.json` },
  { id: 'mn36',   title: 'Mahāsaccaka Sutta — The Longer Discourse to Saccaka',                  path: `${BASE}/mn/mn36_translation-en-sujato.json` },
  { id: 'mn118',  title: 'Ānāpānasati Sutta — Mindfulness of Breathing',                         path: `${BASE}/mn/mn118_translation-en-sujato.json` },
  { id: 'mn140',  title: 'Dhātuvibhaṅga Sutta — The Analysis of the Properties',                 path: `${BASE}/mn/mn140_translation-en-sujato.json` },

  // Saṁyutta Nikāya (Connected Discourses)
  { id: 'sn12.1',  title: 'Paṭiccasamuppāda Sutta — Dependent Origination',                     path: `${BASE}/sn/sn12/sn12.1_translation-en-sujato.json` },
  { id: 'sn22.59', title: 'Anattalakkhaṇa Sutta — The Characteristic of Non-Self',               path: `${BASE}/sn/sn22/sn22.59_translation-en-sujato.json` },
  { id: 'sn35.28', title: 'Āditta Sutta — The Fire Sermon',                                      path: `${BASE}/sn/sn35/sn35.28_translation-en-sujato.json` },
  { id: 'sn56.11', title: 'Dhammacakkappavattana Sutta — Setting the Wheel of Dhamma in Motion', path: `${BASE}/sn/sn56/sn56.11_translation-en-sujato.json` },

  // Aṅguttara Nikāya (Numerical Discourses)
  { id: 'an3.65',  title: 'Kālāma Sutta — The Charter of Free Inquiry',                          path: `${BASE}/an/an3/an3.65_translation-en-sujato.json` },
  { id: 'an8.54',  title: 'Mettā Sutta — Goodwill',                                              path: `${BASE}/an/an8/an8.54_translation-en-sujato.json` },

  // Khuddaka Nikāya (Minor Collection)
  { id: 'snp1.8',  title: 'Karaṇīya Metta Sutta — The Discourse on Goodwill',                   path: `${BASE}/kn/snp/vagga1/snp1.8_translation-en-sujato.json` },
  { id: 'snp2.1',  title: 'Ratana Sutta — The Jewel Discourse',                                  path: `${BASE}/kn/snp/vagga2/snp2.1_translation-en-sujato.json` },
  { id: 'snp2.4',  title: 'Maṅgala Sutta — The Highest Blessings',                               path: `${BASE}/kn/snp/vagga2/snp2.4_translation-en-sujato.json` },
  { id: 'dhp1-20', title: 'Dhammapada — The Path of Dhamma (Chapters 1–2)',                      path: `${BASE}/kn/dhp/dhp1-20_translation-en-sujato.json` },

  // Additional Majjhima Nikāya
  { id: 'mn22',    title: 'Alagaddūpama Sutta — The Snake Simile',                               path: `${BASE}/mn/mn22_translation-en-sujato.json` },
  { id: 'mn63',    title: 'Cūḷamāluṅkya Sutta — The Shorter Discourse to Māluṅkya',             path: `${BASE}/mn/mn63_translation-en-sujato.json` },
  { id: 'mn72',    title: 'Aggivacchagotta Sutta — To Vacchagotta on Fire',                      path: `${BASE}/mn/mn72_translation-en-sujato.json` },
  { id: 'mn131',   title: 'Bhaddekaratta Sutta — One Fine Night',                                path: `${BASE}/mn/mn131_translation-en-sujato.json` },

  // Additional Dīgha Nikāya
  { id: 'dn1',     title: 'Brahmajāla Sutta — The Brahmā Net',                                   path: `${BASE}/dn/dn1_translation-en-sujato.json` },
  { id: 'dn9',     title: 'Poṭṭhapāda Sutta — About Poṭṭhapāda',                                path: `${BASE}/dn/dn9_translation-en-sujato.json` },

  // Additional Saṁyutta Nikāya
  { id: 'sn22.22', title: 'Bhāra Sutta — The Burden',                                            path: `${BASE}/sn/sn22/sn22.22_translation-en-sujato.json` },
  { id: 'sn12.15', title: 'Kaccānagotta Sutta — To Kaccānagotta',                                path: `${BASE}/sn/sn12/sn12.15_translation-en-sujato.json` },

  // Additional Aṅguttara Nikāya
  { id: 'an4.67',  title: 'Kesi Sutta — To Kesi the Horsetrainer',                               path: `${BASE}/an/an4/an4.67_translation-en-sujato.json` },
  { id: 'an11.2',  title: 'Cetanākaraṇīya Sutta — Intentional Actions',                          path: `${BASE}/an/an11/an11.2_translation-en-sujato.json` },

  // More Dīgha Nikāya
  { id: 'dn3',     title: 'Ambaṭṭha Sutta — With Ambaṭṭha',                                      path: `${BASE}/dn/dn3_translation-en-sujato.json` },
  { id: 'dn10',    title: 'Subha Sutta — With Subha',                                             path: `${BASE}/dn/dn10_translation-en-sujato.json` },
  { id: 'dn15',    title: 'Mahānidāna Sutta — The Great Discourse on Causation',                  path: `${BASE}/dn/dn15_translation-en-sujato.json` },
  { id: 'dn31',    title: 'Sigālovāda Sutta — Advice to Sigāla',                                  path: `${BASE}/dn/dn31_translation-en-sujato.json` },

  // More Majjhima Nikāya
  { id: 'mn2',     title: 'Sabbāsava Sutta — All the Taints',                                     path: `${BASE}/mn/mn2_translation-en-sujato.json` },
  { id: 'mn8',     title: 'Sallekha Sutta — The Expunge',                                         path: `${BASE}/mn/mn8_translation-en-sujato.json` },
  { id: 'mn9',     title: 'Sammādiṭṭhi Sutta — Right View',                                       path: `${BASE}/mn/mn9_translation-en-sujato.json` },
  { id: 'mn44',    title: 'Cūḷavedalla Sutta — The Shorter Set of Questions and Answers',         path: `${BASE}/mn/mn44_translation-en-sujato.json` },
  { id: 'mn117',   title: 'Mahācattārīsaka Sutta — The Great Forty',                              path: `${BASE}/mn/mn117_translation-en-sujato.json` },
  { id: 'mn121',   title: 'Cūḷasuññata Sutta — The Shorter Discourse on Emptiness',               path: `${BASE}/mn/mn121_translation-en-sujato.json` },

  // More Saṁyutta Nikāya
  { id: 'sn1.1',   title: 'Ogha Sutta — The Flood',                                               path: `${BASE}/sn/sn1/sn1.1_translation-en-sujato.json` },
  { id: 'sn22.90', title: 'Channa Sutta — With Channa',                                           path: `${BASE}/sn/sn22/sn22.90_translation-en-sujato.json` },
  { id: 'sn45.8',  title: 'Vibhaṅga Sutta — Analysis of the Eightfold Path',                     path: `${BASE}/sn/sn45/sn45.8_translation-en-sujato.json` },
  { id: 'sn47.9',  title: 'Gilāna Sutta — Sick',                                                  path: `${BASE}/sn/sn47/sn47.9_translation-en-sujato.json` },

  // Khuddaka Nikāya — additional
  { id: 'ud1.10',  title: 'Bāhiya Sutta — About Bāhiya',                                          path: `${BASE}/kn/ud/vagga1/ud1.10_translation-en-sujato.json` },
];

export async function seedBuddhistTexts(): Promise<{ seeded: string[]; failed: string[]; total: number }> {
  const seeded: string[] = [];
  const failed: string[] = [];

  const collection = await prisma.libraryCollection.upsert({
    where:  { slug: 'suttacentral-tipitaka' },
    create: {
      slug:        'suttacentral-tipitaka',
      name:        'Tipitaka (Pali Canon)',
      tradition:   'THERAVADA',
      description: 'Early Buddhist texts — Dīgha, Majjhima, Saṁyutta, Aṅguttara, and Khuddaka Nikāyas. Translations by Bhikkhu Sujato (CC0).',
      sourceUrl:   'https://suttacentral.net',
      licence:     'CC0',
    },
    update: {},
  });

  for (const sutta of SUTTAS) {
    try {
      const res = await fetch(`${BILARA_BASE}/${sutta.path}`);
      if (!res.ok) {
        failed.push(`${sutta.id}: HTTP ${res.status}`);
        continue;
      }

      const raw = await res.json() as Record<string, string>;

      const text = await prisma.libraryText.upsert({
        where:  { externalId: sutta.id },
        create: {
          collectionId: collection.id,
          externalId:   sutta.id,
          title:        sutta.title,
          translator:   'Bhikkhu Sujato',
          language:     'en',
          licence:      'CC0',
          sourceUrl:    `https://suttacentral.net/${sutta.id}`,
          attribution:  `SuttaCentral.net · Bhikkhu Sujato · CC0`,
        },
        update: { title: sutta.title },
      });

      const segments = Object.entries(raw)
        .filter(([, content]) => typeof content === 'string' && content.trim().length > 0)
        .map(([key, content], i) => ({
          textId:     text.id,
          segmentKey: key,
          content:    content.trim(),
          sequence:   i,
        }));

      for (let i = 0; i < segments.length; i += 200) {
        await prisma.librarySegment.createMany({
          data: segments.slice(i, i + 200),
          skipDuplicates: true,
        });
      }

      seeded.push(sutta.id);
      console.log(`[Seed] ✓ ${sutta.id} — ${segments.length} segments`);
    } catch (err: any) {
      failed.push(`${sutta.id}: ${err.message}`);
      console.warn(`[Seed] ✗ ${sutta.id}: ${err.message}`);
    }
  }

  return { seeded, failed, total: seeded.length };
}
