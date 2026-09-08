import { sqliteAdapter } from '@payloadcms/db-sqlite'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return new Response(null, { status: 404 })
  }

  const adapter = sqliteAdapter({ client: { url: 'file::memory:' } }).init({ payload: {} })
  const snapshot = await adapter.requireDrizzleKit().generateDrizzleJson({})

  return Response.json({ dialect: snapshot.dialect })
}
