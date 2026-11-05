import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { Endpoint } from 'payload'

/**
 * `GET /api/health` - used by the Docker healthcheck and load balancers.
 * Returns 200 only when the MongoDB connection answers a ping.
 */
export const healthEndpoint: Endpoint = {
  handler: async (req) => {
    try {
      const { connection } = req.payload.db as unknown as MongooseAdapter

      await connection.db?.admin().ping()

      return Response.json({ database: 'up', status: 'ok' })
    } catch (err) {
      req.payload.logger.error({ err, msg: 'Health check failed: MongoDB ping failed' })

      return Response.json({ database: 'down', status: 'error' }, { status: 503 })
    }
  },
  method: 'get',
  path: '/health',
}
