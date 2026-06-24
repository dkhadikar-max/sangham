import { prisma } from '../config/database';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function openLibraryCover(title: string, author?: string | null): Promise<string | null> {
  try {
    const params = new URLSearchParams({ title, limit: '1', fields: 'cover_i,title' });
    if (author) params.set('author', author);
    const res = await fetch(`https://openlibrary.org/search.json?${params}`, {
      headers: { 'User-Agent': 'Sangham/1.0 (sangham.online; contact@sangham.online)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { docs?: { cover_i?: number }[] };
    const cover_i = data?.docs?.[0]?.cover_i;
    if (!cover_i) return null;
    return `https://covers.openlibrary.org/b/id/${cover_i}-L.jpg`;
  } catch {
    return null;
  }
}

export async function fetchCovers(): Promise<{ updated: number; failed: number; total: number }> {
  const texts = await prisma.libraryText.findMany({
    where: { coverUrl: null },
    select: { id: true, title: true, author: true },
    orderBy: { title: 'asc' },
  });

  console.log(`[Covers] ${texts.length} texts need covers`);

  let updated = 0;
  let failed  = 0;

  for (const text of texts) {
    const url = await openLibraryCover(text.title, text.author);
    if (url) {
      await prisma.libraryText.update({ where: { id: text.id }, data: { coverUrl: url } });
      console.log(`[Covers] ✓ ${text.title.slice(0, 60)}`);
      updated++;
    } else {
      console.log(`[Covers] ✗ ${text.title.slice(0, 60)}`);
      failed++;
    }
    await delay(600); // ~1.6 req/s — polite to OpenLibrary
  }

  return { updated, failed, total: texts.length };
}

// Standalone entrypoint: railway run npx ts-node --transpile-only src/scripts/fetchCovers.ts
if (require.main === module) {
  fetchCovers()
    .then(r => {
      console.log(`\n[Covers] Done — ${r.updated} updated, ${r.failed} no cover found, ${r.total} total`);
      return prisma.$disconnect();
    })
    .catch(err => {
      console.error('[Covers] Fatal:', err.message);
      process.exit(1);
    });
}
