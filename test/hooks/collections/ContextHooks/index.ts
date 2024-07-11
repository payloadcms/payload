import type { CollectionConfig, PayloadRequest } from 'payload'

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
      ({ context, args }) => {
        const req: PayloadRequest = args.req

        if (req.searchParams.size === 0) {
          return args
        }

        req.searchParams.forEach((value, key) => {
          if (key.startsWith('context_')) {
            // Strip 'context_' from key, add it to context object and remove it from query params
            const newKey = key.substring('context_'.length)
            context[newKey] = value
            req.searchParams.delete(key)
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
