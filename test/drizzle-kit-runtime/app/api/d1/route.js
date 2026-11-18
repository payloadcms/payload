import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'

export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({ d1: typeof sqliteD1Adapter({ binding: {} }).init })
}
