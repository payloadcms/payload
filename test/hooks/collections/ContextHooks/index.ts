/* eslint-disable no-param-reassign */
import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'
import type { PayloadRequest } from '../../../../packages/payload/src/types'

export const contextHooksSlug = 'context-hooks'
const ContextHooks: CollectionConfig = {
  slug: contextHooksSlug,
  access: {
    read: () => true,
    create: () => true,
    delete: () => true,
    update: () => true,
  },
  hooks: {
    beforeOperation: [
      async ({ context, args }) => {
        // eslint-disable-next-line prefer-destructuring
        const req: PayloadRequest = args.req

        if (!req.query || !Object.keys(req.query).length) {
          return args
        }

        Object.keys(req.query).forEach((key) => {
          if (key.startsWith('context_')) {
            // Strip 'context_' from key, add it to context object and remove it from query params
            const newKey = key.substring('context_'.length)
            context[newKey] = req.query[key]
            delete req.query[key]
          }
        })

        return args
      },
    ],
    beforeChange: [
      ({ context, data, req }) => {
        if (!context.secretValue) {
          context.secretValue = 'secret'
        }
        if (req.context !== context) {
          throw new Error('req.context !== context')
        }
        return data
      },
    ],
    afterChange: [
      async ({ context, doc, req }) => {
        if (context.triggerAfterChange === false) {
          // Make sure we don't trigger afterChange again and again in an infinite loop
          return
        }
        await req.payload.update({
          collection: contextHooksSlug,
          id: doc.id,
          data: {
            value: context.secretValue ?? '',
          },
          req,
          context: {
            triggerAfterChange: false, // Make sure we don't trigger afterChange again and again in an infinite loop. This should be done via context and not a potential disableHooks property, as we want to specifically test the context functionality here
          },
        })
      },
    ],
  },
  fields: [
    {
      name: 'value',
      type: 'text',
    },
  ],
}

export default ContextHooks
