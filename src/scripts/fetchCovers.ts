import { prisma } from '../config/database';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// Strip subtitle so "Ants Among Elephants: An Untouchable Family..." → "Ants Among Elephants"
function shortTitle(title: string): string {
  return title.split(/[:—]|\s—\s/)[0].trim();
}

// Pali/Sanskrit sutta titles follow the pattern "XxxxSutta — English subtitle".
// There is no bookcover for individual suttas — skip them.
function isSuttaOrVerse(title: string): boolean {
  return /Sutta —|Sūtra —|Sutra —|\bSutta\b|\bSūtra\b/.test(title);
}

// Extract archive.org item identifier from a sourceUrl like
// "https://archive.org/details/ambedkar-baws-te-vol-1"
function archiveId(sourceUrl: string): string | null {
  const m = sourceUrl.match(/archive\.org\/details\/([^/?#\s]+)/);
  return m ? m[1] : null;
}

async function googleBooksCover(title: string, author?: string | null): Promise<string | null> {
  try {
    const q = author
      ? `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}`
      : `intitle:${encodeURIComponent(title)}`;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1&fields=items(id,volumeInfo/imageLinks)`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json() as { items?: { id: string; volumeInfo?: { imageLinks?: { thumbnail?: string } } }[] };
    const thumb = data?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
    if (!thumb) return null;
    // Upgrade to https + increase zoom for larger image
    return thumb.replace(/^http:\/\//, 'https://').replace('zoom=1', 'zoom=0');
  } catch {
    return null;
  }
}

async function openLibraryCover(title: string, author?: string | null): Promise<string | null> {
  try {
    const params = new URLSearchParams({ title, limit: '1', fields: 'cover_i' });
    if (author) params.set('author', author);
    const res = await fetch(`https://openlibrary.org/search.json?${params}`, {
      headers: { 'User-Agent': 'Sangham/1.0 (sangham.online)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { docs?: { cover_i?: number }[] };
    const cover_i = data?.docs?.[0]?.cover_i;
    return cover_i ? `https://covers.openlibrary.org/b/id/${cover_i}-L.jpg` : null;
  } catch {
    return null;
  }
}

export async function fetchCovers(): Promise<{ updated: number; skipped: number; failed: number; total: number }> {
  const texts = await prisma.libraryText.findMany({
    where: { coverUrl: null },
    select: { id: true, title: true, author: true, sourceUrl: true },
    orderBy: { title: 'asc' },
  });

  console.log(`[Covers] ${texts.length} texts need covers`);

  let updated = 0, skipped = 0, failed = 0;

  for (const text of texts) {
    // 1. Pali suttas — skip, no real book cover exists
    if (isSuttaOrVerse(text.title)) {
      skipped++;
      continue;
    }

    // 2. Archive.org texts — thumbnail is served directly by archive.org
    const aid = archiveId(text.sourceUrl);
    if (aid) {
      const coverUrl = `https://archive.org/services/img/${aid}`;
      await prisma.libraryText.update({ where: { id: text.id }, data: { coverUrl } });
      console.log(`[Covers] ✓ [archive] ${text.title.slice(0, 55)}`);
      updated++;
      continue;
    }

    // 3. Try Google Books → OpenLibrary with cleaned short title
    const st = shortTitle(text.title);
    if (st.length < 3) { skipped++; continue; }

    await delay(300);
    let url = await googleBooksCover(st, text.author);
    if (!url) {
      await delay(300);
      url = await openLibraryCover(st, text.author);
    }

    if (url) {
      await prisma.libraryText.update({ where: { id: text.id }, data: { coverUrl: url } });
      console.log(`[Covers] ✓ ${st.slice(0, 55)}`);
      updated++;
    } else {
      console.log(`[Covers] ✗ ${st.slice(0, 55)}`);
      failed++;
    }

    await delay(300);
  }

  return { updated, skipped, failed, total: texts.length };
}

// Standalone: railway run npx ts-node --transpile-only src/scripts/fetchCovers.ts
if (require.main === module) {
  fetchCovers()
    .then(r => {
      console.log(`\n[Covers] Done — ${r.updated} covers found, ${r.skipped} skipped (suttas), ${r.failed} no cover, ${r.total} total`);
      return prisma.$disconnect();
    })
    .catch(err => {
      console.error('[Covers] Fatal:', err.message);
      process.exit(1);
    });
}
