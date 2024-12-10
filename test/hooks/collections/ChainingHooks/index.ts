import type { CollectionConfig } from 'payload'

export const chainingHooksSlug = 'chaining-hooks'

const AppendTextHook = ({ doc }) => ({
  ...doc,
  text: `${doc.text}!`,
})

const ChainingHooks: CollectionConfig = {
  slug: chainingHooksSlug,
  hooks: {
    afterRead: [AppendTextHook, AppendTextHook],
  },
  fields: [
    {
      type: 'text',
      name: 'text',
    },
  ],
}

export default ChainingHooks
