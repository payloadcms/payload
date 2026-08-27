import type { CollectionConfig, SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { Config } from '../../config/types.js'
import type { Field, JoinField } from '../../fields/config/types.js'

import { sanitizeJoinField } from '../../fields/config/sanitizeJoinField.js'
import { fieldAffectsData } from '../../fields/config/types.js'
import { getAPIKeyStorageMode } from '../getAPIKeyStorageMode.js'
import {
  apiKeysCreateAccess,
  apiKeysOwnerOnlyAccess,
  apiKeysOwnerOrManageAccess,
  apiKeysOwnerOrReadAccess,
} from './access.js'
import {
  assignAPIKeyCredential,
  assignAPIKeyOwner,
  surfaceGeneratedAPIKeySecret,
} from './credentialService.js'

export const payloadAPIKeysCollectionSlug = 'payload-api-keys'

/**
 * Builds the shared `payload-api-keys` collection, or `null` when no configured
 * collection has API keys enabled (in either storage mode - the collection is staged
 * early so relational projects can create its schema before a legacy-to-collection
 * cutover; see the "Schema staging" section of the API keys design spec).
 */
export const getAPIKeysCollection = (config: Config): CollectionConfig | null => {
  const apiKeyEnabledCollectionSlugs = (config.collections ?? [])
    .filter((collectionConfig) => getAPIKeyStorageMode(collectionConfig.auth))
    .map((collectionConfig) => collectionConfig.slug)

  if (apiKeyEnabledCollectionSlugs.length === 0) {
    return null
  }

  return {
    slug: payloadAPIKeysCollectionSlug,
    access: {
      create: apiKeysCreateAccess,
      delete: apiKeysOwnerOrManageAccess,
      read: apiKeysOwnerOrReadAccess,
      update: apiKeysOwnerOnlyAccess,
    },
    admin: {
      hidden: true,
    },
    fields: [
      {
        name: 'name',
        type: 'text',
        defaultValue: 'API key',
        required: true,
      },
      {
        name: 'owner',
        type: 'relationship',
        admin: {
          readOnly: true,
        },
        hooks: {
          beforeValidate: [assignAPIKeyOwner],
        },
        index: true,
        relationTo: apiKeyEnabledCollectionSlugs,
        required: true,
      },
      {
        name: 'apiKeyHash',
        type: 'text',
        access: {
          create: () => false,
          read: () => false,
          update: () => false,
        },
        hidden: true,
        unique: true,
      },
      {
        name: 'apiKey',
        type: 'text',
        access: {
          create: () => false,
          update: () => false,
        },
        admin: {
          description:
            'Shown only once, right after creating or regenerating this key. Copy it now - it cannot be viewed again.',
          readOnly: true,
        },
        hooks: {
          afterRead: [surfaceGeneratedAPIKeySecret],
        },
        // Never persisted - only its one-way apiKeyHash is stored. This field's value
        // exists purely in the response of the request that just generated it (see
        // surfaceGeneratedAPIKeySecret), sourced from req.context, not the database.
        virtual: true,
      },
      {
        name: 'regenerate',
        type: 'checkbox',
        access: {
          create: () => false,
          read: () => false,
        },
        admin: {
          hidden: true,
        },
        // A write-only sentinel: setting this to true on update (see the
        // RegenerateAPIKeyButton admin component below) tells assignAPIKeyCredential to
        // issue a fresh secret for an existing key, exactly like create does for a new
        // one. Virtual since it has no meaning to persist.
        virtual: true,
      },
      {
        name: 'regenerateAction',
        type: 'ui',
        admin: {
          components: {
            Field: '@payloadcms/ui#RegenerateAPIKeyButton',
          },
        },
      },
      {
        name: 'migratedFrom',
        type: 'group',
        access: {
          create: () => false,
          update: () => false,
        },
        admin: {
          hidden: true,
        },
        fields: [
          {
            name: 'collection',
            type: 'text',
          },
          {
            // Not `id`: Mongoose gives object subdocuments an automatic `id` virtual
            // getter, which shadows a same-named field and silently drops its value.
            name: 'documentID',
            type: 'text',
          },
        ],
      },
    ],
    hooks: {
      beforeValidate: [assignAPIKeyCredential],
    },
    lockDocuments: false,
    trash: false,
    versions: false,
  }
}

/**
 * A `join` field back onto `payload-api-keys` via its polymorphic `owner` relationship,
 * added to collection-mode auth collections so the Admin UI's built-in relationship
 * table (create/edit-via-drawer, delete, access-controlled listing) replaces the legacy
 * single-key UI without any bespoke key-manager component.
 */
export const getAPIKeysJoinField = (): Field => ({
  name: 'apiKeys',
  type: 'join',
  admin: {
    defaultColumns: ['name', 'createdAt'],
  },
  collection: payloadAPIKeysCollectionSlug,
  label: 'API Keys',
  on: 'owner',
})

/**
 * Registers each collection-mode auth collection's `apiKeys` join field into that
 * collection's `joins` map, once `payload-api-keys` exists in `config.collections`.
 *
 * This is necessary because a collection's own `sanitizeCollection` call runs the
 * general field sanitizer (which is what normally validates and registers join fields)
 * before the auth-injected fields - including this join field - are merged into its
 * field list. At that point `payload-api-keys` doesn't exist in `config.collections` yet
 * either (it's added afterward, since it needs to know which collections enabled API
 * keys). Without this retroactive step the join field renders in the Admin UI and
 * generated types but silently returns no related documents, since nothing populated it.
 */
export const registerAPIKeysJoinFields = (config: Config): void => {
  for (const collectionConfig of (config.collections ?? []) as SanitizedCollectionConfig[]) {
    if (getAPIKeyStorageMode(collectionConfig.auth) !== 'collection' || !collectionConfig.joins) {
      continue
    }

    const joinField = collectionConfig.fields.find(
      (field) => fieldAffectsData(field) && field.name === 'apiKeys' && field.type === 'join',
    ) as JoinField | undefined

    if (!joinField) {
      continue
    }

    sanitizeJoinField({
      config,
      field: joinField,
      joins: collectionConfig.joins,
      parentIsLocalized: false,
    })
  }
}
