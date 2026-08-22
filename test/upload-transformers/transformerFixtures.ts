import type { UploadTransformer } from 'payload'

/**
 * Call counters for the fake transformers below, reset by each test that needs
 * them. Each transformer's `canTransform` recognizes its own dedicated query
 * parameter so a single collection/MIME type can exercise every pipeline shape
 * from `test/upload-transformers/int.spec.ts` without needing a transformer per
 * collection.
 */
export const transformerCallCounts = {
  appendSuffix: 0,
  noop: 0,
  redirect: 0,
  sourceConsumingError: 0,
  throwing: 0,
  uppercase: 0,
}

export function resetTransformerCallCounts(): void {
  for (const key of Object.keys(transformerCallCounts) as (keyof typeof transformerCallCounts)[]) {
    transformerCallCounts[key] = 0
  }
}

/**
 * Counts `TransformerMedia` collection hook invocations, so a test can prove a
 * dynamic-transform request never enters the document-mutation pipeline.
 */
export const transformerMediaHookCallCounts = {
  afterChange: 0,
  beforeChange: 0,
  beforeDelete: 0,
}

export function resetTransformerMediaHookCallCounts(): void {
  for (const key of Object.keys(
    transformerMediaHookCallCounts,
  ) as (keyof typeof transformerMediaHookCallCounts)[]) {
    transformerMediaHookCallCounts[key] = 0
  }
}

const hasQueryParam = (paramName: string) => (args: { req: { searchParams?: URLSearchParams } }) =>
  args.req.searchParams?.has(paramName) ?? false

export const appendSuffixTransformer: UploadTransformer = {
  slug: 'append-suffix',
  canTransform: hasQueryParam('suffix'),
  handleRequest: async ({ getSourceFile }) => {
    transformerCallCounts.appendSuffix += 1
    const source = await getSourceFile()
    const text = await source.text()
    return {
      response: new Response(`${text}-suffix`, { headers: source.headers }),
      status: 'continue',
    }
  },
  mimeTypes: ['application/pdf'],
}

export const uppercaseTransformer: UploadTransformer = {
  slug: 'uppercase',
  canTransform: hasQueryParam('uppercase'),
  handleRequest: async ({ getSourceFile }) => {
    transformerCallCounts.uppercase += 1
    const source = await getSourceFile()
    const text = await source.text()
    return {
      response: new Response(text.toUpperCase(), { headers: source.headers }),
      status: 'complete',
    }
  },
  mimeTypes: ['application/pdf'],
}

export const redirectTransformer: UploadTransformer = {
  slug: 'redirect',
  canTransform: hasQueryParam('redirect'),
  handleRequest: () => {
    transformerCallCounts.redirect += 1
    return Promise.resolve({
      response: Response.redirect('https://example.com/redirected', 302),
      status: 'complete',
    })
  },
  mimeTypes: ['application/pdf'],
}

export const noopTransformer: UploadTransformer = {
  slug: 'noop',
  canTransform: hasQueryParam('noop'),
  handleRequest: () => {
    transformerCallCounts.noop += 1
    return Promise.resolve({ status: 'continue' })
  },
  mimeTypes: ['application/pdf'],
}

export const throwingTransformer: UploadTransformer = {
  slug: 'throw',
  canTransform: hasQueryParam('throwerror'),
  handleRequest: () => {
    transformerCallCounts.throwing += 1
    throw new Error('fake transformer failure')
  },
  mimeTypes: ['application/pdf'],
}

export const sourceConsumingErrorTransformer: UploadTransformer = {
  slug: 'source-error',
  canTransform: hasQueryParam('sourceerror'),
  handleRequest: async ({ getSourceFile }) => {
    transformerCallCounts.sourceConsumingError += 1
    await getSourceFile()
    throw new Error('fake failure after consuming the source')
  },
  mimeTypes: ['application/pdf'],
}

export const testTransformers: UploadTransformer[] = [
  appendSuffixTransformer,
  uppercaseTransformer,
  redirectTransformer,
  noopTransformer,
  throwingTransformer,
  sourceConsumingErrorTransformer,
]
