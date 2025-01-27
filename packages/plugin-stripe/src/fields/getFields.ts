import type { CollectionConfig, Field } from 'payload/types'

import type { SanitizedStripeConfig } from '../types'

import { LinkToDoc } from '../ui/LinkToDoc'

interface Args {
  collection: CollectionConfig
  stripeConfig: SanitizedStripeConfig
  syncConfig: {
    stripeResourceType: string
  }
}

export const getFields = ({ collection, stripeConfig, syncConfig }: Args): Field[] => {
  const stripeIDField: Field = {
    name: 'stripeID',
    admin: {
      position: 'sidebar',
      readOnly: true,
    },
    label: 'Stripe ID',
    saveToJWT: true,
    type: 'text',
  }

  const skipSyncField: Field = {
    name: 'skipSync',
    admin: {
      position: 'sidebar',
      readOnly: true,
    },
    label: 'Skip Sync',
    type: 'checkbox',
  }

  const docUrlField: Field = {
    name: 'docUrl',
    admin: {
      components: {
        Field: (args) =>
          LinkToDoc({
            ...args,
            isTestKey: stripeConfig.isTestKey,
            nameOfIDField: 'stripeID',
            stripeResourceType: syncConfig.stripeResourceType,
          }),
      },
      position: 'sidebar',
    },
    type: 'ui',
  }

  const fields = [...collection.fields, stripeIDField, skipSyncField, docUrlField]

  return fields
}
