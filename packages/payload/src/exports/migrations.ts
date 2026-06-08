/**
 * Exports for Payload migrations
 *
 * This module provides migration utilities that users can import in their migration files.
 *
 * @example
 * ```ts
 * import { localizeStatus } from 'payload/migrations'
 *
 * export async function up({ payload }) {
 *   await localizeStatus.up({
 *     collectionSlug: 'posts',
 *     payload,
 *   })
 * }
 * ```
 */

export { batchTransform } from '../database/migrations/config/batchTransform.js'
export { localizeStatus } from '../versions/migrations/localizeStatus/index.js'
