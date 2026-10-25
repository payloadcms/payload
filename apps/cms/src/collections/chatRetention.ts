import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { Payload } from 'payload'

/** VgemsAI app conversations are kept this long after their last message, then MongoDB deletes them */
export const CHAT_RETENTION_DAYS = 90

/** `expiresAt` of a chat message or session saved now */
export const chatExpiresAt = (from = new Date()) =>
  new Date(from.getTime() + CHAT_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()

/**
 * Lets MongoDB delete chat messages and sessions once their `expiresAt` has passed (a TTL index; MongoDB
 * checks about once a minute). Payload's own index options have no TTL, so it's created here, at startup.
 */
export const ensureChatRetentionIndexes = async (payload: Payload) => {
  const { collections, connection } = payload.db as unknown as MongooseAdapter

  // Not connected, e.g. while building: nothing to do
  if (connection?.readyState !== 1) {
    return
  }

  try {
    for (const slug of ['chat-messages', 'chat-sessions']) {
      await collections[slug]?.collection.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, name: 'expiresAt_ttl' },
      )
    }
  } catch (err) {
    payload.logger.error({ err, msg: 'Could not create the TTL index that deletes old chats' })
  }
}
