import { Client } from "@opensearch-project/opensearch";
import type { Product } from "../../types/product";

const OPENSEARCH_ENDPOINT = process.env.OPENSEARCH_ENDPOINT;

let client: Client | null = null;

function getClient(): Client {
  if (!client) {
    if (!OPENSEARCH_ENDPOINT) {
      throw new Error("OPENSEARCH_ENDPOINT environment variable is required");
    }
    client = new Client({ node: OPENSEARCH_ENDPOINT });
  }
  return client;
}

const INDEX_NAME = "store_products";

export async function ensureIndex(): Promise<void> {
  const os = getClient();
  const exists = await os.indices.exists({ index: INDEX_NAME });
  if (!exists.body) {
    await os.indices.create({
      index: INDEX_NAME,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 1,
        },
        mappings: {
          properties: {
            productId: { type: "keyword" },
            name: { type: "text", analyzer: "standard" },
            description: { type: "text", analyzer: "standard" },
            categoryId: { type: "keyword" },
            categoryName: { type: "keyword" },
            basePrice: { type: "float" },
            status: { type: "keyword" },
            tags: { type: "keyword" },
            createdAt: { type: "date" },
          },
        },
      },
    });
  }
}

export async function indexProduct(product: Product): Promise<void> {
  const os = getClient();
  await os.index({
    index: INDEX_NAME,
    id: product.productId,
    body: {
      productId: product.productId,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      basePrice: product.basePrice,
      status: product.status,
      createdAt: product.createdAt,
    },
  });
}

export async function removeProduct(productId: string): Promise<void> {
  const os = getClient();
  await os.delete({
    index: INDEX_NAME,
    id: productId,
  });
}

interface SearchParams {
  query: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  from?: number;
  size?: number;
}

interface SearchResult {
  hits: Array<{
    productId: string;
    name: string;
    description: string;
    categoryId: string;
    basePrice: number;
    score: number;
  }>;
  total: number;
}

export async function searchProducts(
  params: SearchParams
): Promise<SearchResult> {
  const os = getClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const must: any[] = [
    {
      multi_match: {
        query: params.query,
        fields: ["name^3", "description"],
        fuzziness: "AUTO",
      },
    },
    { term: { status: "active" } },
  ];

  if (params.categoryId) {
    must.push({ term: { categoryId: params.categoryId } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any[] = [];
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    const range: Record<string, number> = {};
    if (params.minPrice !== undefined) range.gte = params.minPrice;
    if (params.maxPrice !== undefined) range.lte = params.maxPrice;
    filter.push({ range: { basePrice: range } });
  }

  const result = await os.search({
    index: INDEX_NAME,
    body: {
      from: params.from || 0,
      size: params.size || 20,
      query: {
        bool: {
          must,
          ...(filter.length > 0 ? { filter } : {}),
        },
      },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = result.body as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hits = body.hits.hits.map((hit: any) => ({
    productId: hit._source.productId,
    name: hit._source.name,
    description: hit._source.description,
    categoryId: hit._source.categoryId,
    basePrice: hit._source.basePrice,
    score: hit._score,
  }));

  const total =
    typeof body.hits.total === "number"
      ? body.hits.total
      : body.hits.total?.value ?? 0;

  return { hits, total };
}

export async function bulkIndexProducts(products: Product[]): Promise<void> {
  const os = getClient();
  const body = products.flatMap((product) => [
    { index: { _index: INDEX_NAME, _id: product.productId } },
    {
      productId: product.productId,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      basePrice: product.basePrice,
      status: product.status,
      createdAt: product.createdAt,
    },
  ]);

  await os.bulk({ body });
}
