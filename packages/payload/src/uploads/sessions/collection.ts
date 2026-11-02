import type { CollectionConfig } from '../../collections/config/types.js'

import { uploadSessionEndpoints } from './endpoints.js'
import { uploadSessionsCollectionSlug } from './slug.js'

export { uploadSessionsCollectionSlug }

const denyAccess = () => false

/**
 * Internal record of an in-progress browser upload. Generic CRUD, GraphQL and the Admin list are
 * all closed; the session endpoints run their own ownership and collection access checks.
 *
 * Fields that sessions are listed or cleaned up by are top-level and indexed so every database
 * adapter can query them. Provider-dependent shapes live in JSON so adding an upload collection
 * never changes this schema.
 */
export const getUploadSessionsCollection = (): CollectionConfig => ({
  slug: uploadSessionsCollectionSlug,
  access: {
    create: denyAccess,
    delete: denyAccess,
    read: denyAccess,
    update: denyAccess,
  },
  admin: {
    hidden: true,
  },
  authorship: false,
  endpoints: uploadSessionEndpoints,
  fields: [
    {
      name: 'status',
      type: 'select',
      index: true,
      options: ['pending', 'active', 'completed', 'failed', 'cancelled'],
      required: true,
    },
    { name: 'ownerCollection', type: 'text', index: true, required: true },
    { name: 'ownerID', type: 'text', index: true, required: true },
    { name: 'collectionSlug', type: 'text', required: true },
    { name: 'operation', type: 'select', options: ['create', 'update'], required: true },
    { name: 'targetID', type: 'text' },
    /** The `-original` filename this session's object key uses, held until the session ends. */
    { name: 'reservedFilename', type: 'text', index: true },
    /**
     * `<collection>/<reservedFilename>` while the session holds the name, otherwise a random
     * placeholder. The unique index stops two sessions from reserving the same name at once.
     */
    { name: 'reservationKey', type: 'text', required: true, unique: true },
    { name: 'file', type: 'json', required: true },
    { name: 'storage', type: 'json', required: true },
    { name: 'transfer', type: 'json', required: true },
    { name: 'error', type: 'json' },
    { name: 'intent', type: 'json' },
    { name: 'cancelReason', type: 'select', options: ['user', 'expired'] },
    { name: 'documentID', type: 'text' },
    { name: 'expiresAt', type: 'date', index: true, required: true },
    { name: 'lastActivityAt', type: 'date', required: true },
    { name: 'finalizingUntil', type: 'date' },
    { name: 'storageCompletedAt', type: 'date' },
    { name: 'completedAt', type: 'date' },
    { name: 'cancelledAt', type: 'date' },
    { name: 'cleanupCompletedAt', type: 'date', index: true },
  ],
  graphQL: false,
  lockDocuments: false,
  versions: false,
})
