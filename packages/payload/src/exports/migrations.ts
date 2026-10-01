/**
 * Exports for Payload migrations
 *
 * This module provides the database-agnostic helpers shared by the predefined
 * `localize-status` migrations in each database adapter.
 *
 * The migration itself is invoked through the predefined migration shipped with
 * each adapter, e.g. `payload migrate:create --file @payloadcms/db-mongodb/localize-status`.
 */

export {
  calculateVersionLocaleStatuses,
  toSnakeCase,
  type VersionLocaleStatusMap,
  type VersionRecord,
} from '../versions/migrations/localizeStatus/shared.js'
