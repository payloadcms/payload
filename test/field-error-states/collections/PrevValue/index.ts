import type { CollectionConfig } from '../../../../packages/payload/src/exports/types'

import { slugs } from '../../shared'

import QueryString = require('qs')

export const PrevValue: CollectionConfig = {
  slug: slugs.prevValue,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      validate: async (value, options) => {
        if (options.operation === 'create') return true

        const query = QueryString.stringify(
          {
            where: {
              previousValueRelation: {
                in: [options.id],
              },
            },
          },
          {
            addQueryPrefix: true,
          },
        )

        try {
          const relatedDocs = await fetch(`/api/${slugs.prevValueRelation}${query}`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }).then((res) => res.json())
          if (relatedDocs.docs.length > 0 && value !== options.previousValue) {
            console.log({
              value,
              prev: options.previousValue,
            })
            return 'Doc is being referenced, cannot change title'
          }
        } catch (e) {
          console.log(e)
        }

        return true
      },
    },
    {
      name: 'description',
      type: 'text',
    },
  ],
}
