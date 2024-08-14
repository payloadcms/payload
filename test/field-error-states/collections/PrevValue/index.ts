import type { CollectionConfig } from 'payload'

import * as QueryString from 'qs-esm'

import { collectionSlugs } from '../../shared.js'

export const PrevValue: CollectionConfig = {
  slug: collectionSlugs.prevValue,
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
          const relatedDocs = await fetch(
            `http://localhost:3000/api/${collectionSlugs.prevValueRelation}${query}`,
            {
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            },
          ).then((res) => res.json())
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
