/**
 * Exports for Payload migrations
 *
 * This module provides database-agnostic helpers for data migrations, including
 * saved Admin filters and the predefined `localize-status` adapter migrations.
 *
 * The migration itself is invoked through the predefined migration shipped with
 * each adapter, e.g. `payload migrate:create --file @payloadcms/db-mongodb/localize-status`.
 */

export { migrateHasManyRelationshipFilters } from '../database/migrations/hasManyRelationshipFilters/index.js'

export {
  calculateVersionLocaleStatuses,
  toSnakeCase,
  type VersionLocaleStatusMap,
  type VersionRecord,
} from '../versions/migrations/localizeStatus/shared.js'
