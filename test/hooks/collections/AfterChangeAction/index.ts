import type { CollectionConfig } from 'payload'

export const afterChangeActionSlug = 'after-change-action'

type CapturedAfterChangeAction = {
  action: unknown
  operation?: unknown
}

const collectionActions: CapturedAfterChangeAction[] = []
const fieldActions: CapturedAfterChangeAction[] = []

export const getAfterChangeActions = () => ({
  collection: collectionActions.at(-1),
  collections: [...collectionActions],
  field: fieldActions.at(-1),
  fields: [...fieldActions],
})

export const clearAfterChangeActions = () => {
  collectionActions.length = 0
  fieldActions.length = 0
}

export const AfterChangeActionCollection: CollectionConfig = {
  slug: afterChangeActionSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  versions: {
    drafts: true,
  },
  hooks: {
    afterChange: [
      ({ action, operation }) => {
        collectionActions.push({ action, operation })
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      hooks: {
        afterChange: [
          ({ action, operation }) => {
            fieldActions.push({ action, operation })
          },
        ],
      },
    },
  ],
}
