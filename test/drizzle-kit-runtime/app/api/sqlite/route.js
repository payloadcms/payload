import { sqliteAdapter } from '@payloadcms/db-sqlite'

export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({ sqlite: sqliteAdapter({ client: { url: 'file::memory:' } }).name })
}
