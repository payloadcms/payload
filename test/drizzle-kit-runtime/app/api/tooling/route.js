import { sqliteAdapter } from '@payloadcms/db-sqlite'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return new Response(null, { status: 404 })
  }

  const adapter = sqliteAdapter({ client: { url: 'file::memory:' } }).init({ payload: {} })
  const tooling = adapter.requireDrizzleKit()
  const snapshot = await tooling.generateDrizzleJson({})

  return Response.json({ dialect: snapshot.dialect })
}
