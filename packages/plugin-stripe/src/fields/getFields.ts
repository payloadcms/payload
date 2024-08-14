import type { CollectionConfig, Field } from 'payload'

import type { SanitizedStripePluginConfig } from '../types.js'

interface Args {
  collection: CollectionConfig
  pluginConfig: SanitizedStripePluginConfig
  syncConfig: {
    stripeResourceType: string
  }
}

export const getFields = ({ collection, pluginConfig, syncConfig }: Args): Field[] => {
  const stripeIDField: Field = {
    name: 'stripeID',
    type: 'text',
    admin: {
      position: 'sidebar',
      readOnly: true,
    },
    label: 'Stripe ID',
    saveToJWT: true,
  }

  const skipSyncField: Field = {
    name: 'skipSync',
    type: 'checkbox',
    admin: {
      position: 'sidebar',
      readOnly: true,
    },
    label: 'Skip Sync',
  }

  const docUrlField: Field = {
    name: 'docUrl',
    type: 'ui',
    admin: {
      components: {
        Field: '@payloadcms/plugin-stripe/client#LinkToDoc',
      },
      custom: {
        isTestKey: pluginConfig.isTestKey,
        nameOfIDField: 'stripeID',
        stripeResourceType: syncConfig.stripeResourceType,
      },
      position: 'sidebar',
    },
  }

  const fields = [...collection.fields, stripeIDField, skipSyncField, docUrlField]

  return fields
}
