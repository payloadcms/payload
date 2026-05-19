import type { PayloadHandler } from 'payload'

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const evalResultsDir = path.resolve(__dirname, 'eval-results')

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css',
  '.gz': 'application/gzip',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

export const evalReportHandler: PayloadHandler = (req) => {
  const filepath = (req.routeParams?.filepath as string) ?? ''

  // Prevent path traversal
  const fullPath = path.resolve(evalResultsDir, filepath)
  if (!fullPath.startsWith(evalResultsDir + path.sep) && fullPath !== evalResultsDir) {
    return new Response('Forbidden', { status: 403 })
  }

  if (!existsSync(fullPath)) {
    return new Response('Not found', { status: 404 })
  }

  const ext = path.extname(filepath).toLowerCase()
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream'
  const content = readFileSync(fullPath)

  return new Response(content, {
    headers: { 'Content-Type': contentType },
    status: 200,
  })
}
