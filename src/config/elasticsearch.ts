import { env } from './env';

export const ES_INDEX = 'sangham_library';

type EsClient = import('@elastic/elasticsearch').Client;
let _client: EsClient | null = null;

/**
 * Returns an Elasticsearch client when ELASTICSEARCH_URL is configured, null otherwise.
 * Library search falls back to Postgres ILIKE when this returns null.
 */
export function getEsClient(): EsClient | null {
  if (!env.ELASTICSEARCH_URL) return null;
  if (_client) return _client;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Client } = require('@elastic/elasticsearch');
    _client = new Client({ node: env.ELASTICSEARCH_URL }) as EsClient;
    return _client;
  } catch {
    return null;
  }
}

/** Index a batch of library texts into Elasticsearch. */
export async function indexLibraryTexts(
  texts: Array<{ id: string; title: string; author?: string | null; content?: string | null; tradition?: string | null; language?: string | null }>
): Promise<void> {
  const client = getEsClient();
  if (!client) return;

  const operations = texts.flatMap(doc => [
    { index: { _index: ES_INDEX, _id: doc.id } },
    {
      id: doc.id,
      title: doc.title,
      author: doc.author ?? '',
      content: (doc.content ?? '').slice(0, 50_000), // cap at 50k chars per doc
      tradition: doc.tradition ?? '',
      language: doc.language ?? 'en',
    },
  ]);

  if (operations.length) {
    await client.bulk({ operations, refresh: true });
  }
}

/** Search texts in Elasticsearch. Returns null when ES is not available. */
export async function searchEsLibrary(
  query: string,
  filters: { tradition?: string; language?: string; collectionId?: string },
  limit: number,
  skip: number,
): Promise<{ ids: string[]; total: number } | null> {
  const client = getEsClient();
  if (!client) return null;

  const must: unknown[] = [
    {
      multi_match: {
        query,
        fields: ['title^4', 'author^2', 'content'],
        type: 'best_fields',
        fuzziness: 'AUTO',
      },
    },
  ];

  const filter: unknown[] = [];
  if (filters.tradition) filter.push({ term: { tradition: filters.tradition } });
  if (filters.language)  filter.push({ term: { language: filters.language } });

  try {
    const result = await client.search({
      index: ES_INDEX,
      from: skip,
      size: limit,
      query: { bool: { must, filter } },
    });
    const hits = result.hits.hits;
    const total = typeof result.hits.total === 'number'
      ? result.hits.total
      : (result.hits.total as { value: number }).value;
    return { ids: hits.map((h: { _id: string }) => h._id), total };
  } catch {
    return null;
  }
}
