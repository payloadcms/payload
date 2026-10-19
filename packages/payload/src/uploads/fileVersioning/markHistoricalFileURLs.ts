import type { PayloadRequest } from '../../types/index.js'

export const markHistoricalFileURLs = <T extends Record<string, unknown>>({
  collectionSlug,
  doc,
  req,
  versionID,
}: {
  collectionSlug: string
  doc: T
  req: PayloadRequest
  versionID: number | string
}): T => {
  const serverURL = req.payload.config.serverURL
  const apiRoute = req.payload.config.routes.api
  const filePath = `${apiRoute}/${collectionSlug}/file/`
  const mark = (value: unknown): unknown => {
    if (typeof value !== 'string') {
      return value
    }
    if (!value.startsWith('/') && !(serverURL && value.startsWith(serverURL))) {
      return value
    }

    const url = new URL(value, serverURL || 'http://payload.local')

    if (!url.pathname.startsWith(filePath) || url.searchParams.has('version')) {
      return value
    }

    return `${value}${value.includes('?') ? '&' : '?'}version=${encodeURIComponent(String(versionID))}`
  }

  const marked: Record<string, unknown> = { ...doc }

  if (typeof doc.url === 'string') {
    marked.url = mark(doc.url)
  }

  if (doc.original && typeof doc.original === 'object' && !Array.isArray(doc.original)) {
    const original = doc.original as Record<string, unknown>
    marked.original =
      typeof original.url === 'string' ? { ...original, url: mark(original.url) } : original
  }

  if (doc.variants && typeof doc.variants === 'object' && !Array.isArray(doc.variants)) {
    marked.variants = Object.fromEntries(
      Object.entries(doc.variants).map(([name, size]) =>
        size &&
        typeof size === 'object' &&
        !Array.isArray(size) &&
        typeof (size as Record<string, unknown>).url === 'string'
          ? [name, { ...size, url: mark((size as Record<string, unknown>).url) }]
          : [name, size],
      ),
    )
  }

  if (typeof doc.thumbnailURL === 'string') {
    marked.thumbnailURL = mark(doc.thumbnailURL)
  }

  return marked as T
}
