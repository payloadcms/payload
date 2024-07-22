import type { GlobalConfig } from 'payload'

export const dataHooksGlobalSlug = 'data-hooks-global'

export const DataHooksGlobal: GlobalConfig = {
  slug: dataHooksGlobalSlug,
  access: {
    read: () => true,
    update: () => true,
  },
  hooks: {
    beforeChange: [
      ({ data, global, context }) => {
        context['global_beforeChange_global'] = JSON.stringify(global)

        return data
      },
    ],
    beforeRead: [
      ({ context, global }) => {
        context['global_beforeRead_global'] = JSON.stringify(global)
      },
    ],
    afterRead: [
      ({ context, global, doc }) => {
        context['global_afterRead_global'] = JSON.stringify(global)

        // Needs to be done for both afterRead (for findOne test) and afterChange (for update test)
        for (const contextKey in context) {
          if (contextKey.startsWith('global_')) {
            doc[contextKey] = context[contextKey]
          }
        }
        return doc
      },
    ],
    afterChange: [
      ({ context, global, doc }) => {
        context['global_afterChange_global'] = JSON.stringify(global)

        // Needs to be done for both afterRead (for findOne test) and afterChange (for update test), as afterChange is called after afterRead
        for (const contextKey in context) {
          if (contextKey.startsWith('global_')) {
            doc[contextKey] = context[contextKey]
          }
        }

        return doc
      },
    ],
  },
  fields: [
    {
      name: 'field_globalAndField',
      type: 'text',
      hooks: {
        beforeChange: [
          ({ global, field, context, value }) => {
            context['field_beforeChange_GlobalAndField'] =
              JSON.stringify(global) + JSON.stringify(field)

            return value
          },
        ],

        afterRead: [
          ({ global, field, context }) => {
            if (context['field_beforeChange_GlobalAndField_override']) {
              return context['field_beforeChange_GlobalAndField_override']
            }

            return (
              (context['field_beforeChange_GlobalAndField'] as string) +
              JSON.stringify(global) +
              JSON.stringify(field)
            )
          },
        ],
      },
    },

    {
      name: 'global_beforeChange_global',
      type: 'text',
    },
    {
      name: 'global_afterChange_global',
      type: 'text',
    },
    {
      name: 'global_beforeRead_global',
      type: 'text',
    },
    {
      name: 'global_afterRead_global',
      type: 'text',
    },
  ],
}
