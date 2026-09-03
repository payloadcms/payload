import type { CollectionConfig } from 'payload'

import { postsSlug } from '../Posts/index.js'

export const registrationsSlug = 'registrations'

export const Registrations: CollectionConfig = {
  slug: registrationsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'post',
      type: 'relationship',
      relationTo: postsSlug,
      required: true,
    },
  ],
  hooks: {
    afterChange: [
      // Mirrors a common userland pattern: look up the related doc and tolerate it being
      // gone. `doc.post` is already nulled out when the target is trashed, so read the id
      // off the incoming data.
      async ({ data, doc, req }) => {
        const postID = data?.post

        if (postID) {
          await req.payload.findByID({ id: postID, collection: postsSlug, req }).catch(() => null)
        }

        return doc
      },
    ],
  },
}
