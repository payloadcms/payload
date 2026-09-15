import type { GlobalConfig } from 'payload'

export const afterChangeActionGlobalSlug = 'after-change-action-global'

type CapturedAfterChangeAction = {
  action: unknown
}

const globalActions: CapturedAfterChangeAction[] = []
const fieldActions: CapturedAfterChangeAction[] = []

export const getGlobalAfterChangeActions = () => ({
  field: fieldActions.at(-1),
  fields: [...fieldActions],
  global: globalActions.at(-1),
  globals: [...globalActions],
})

export const clearGlobalAfterChangeActions = () => {
  fieldActions.length = 0
  globalActions.length = 0
}

export const AfterChangeActionGlobal: GlobalConfig = {
  slug: afterChangeActionGlobalSlug,
  access: {
    read: () => true,
    update: () => true,
  },
  versions: {
    drafts: true,
  },
  hooks: {
    afterChange: [
      ({ action }) => {
        globalActions.push({ action })
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
          ({ action }) => {
            fieldActions.push({ action })
          },
        ],
      },
    },
  ],
}
