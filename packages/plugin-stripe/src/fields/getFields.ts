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
    label: 'Stripe ID',
    type: 'text',
    saveToJWT: true,
    admin: {
      position: 'sidebar',
      readOnly: true,
    },
  }

  const skipSyncField: Field = {
    name: 'skipSync',
    label: 'Skip Sync',
    type: 'checkbox',
    admin: {
      position: 'sidebar',
      readOnly: true,
    },
  }

  const docUrlField: Field = {
    name: 'docUrl',
    type: 'ui',
    admin: {
      position: 'sidebar',
      components: {
        Field: args =>
          LinkToDoc({
            ...args,
            isTestKey: stripeConfig.isTestKey,
            stripeResourceType: syncConfig.stripeResourceType,
            nameOfIDField: 'stripeID',
          }),
      },
    },
  }

  const fields = [...collection.fields, stripeIDField, skipSyncField, docUrlField]

  return fields
}
