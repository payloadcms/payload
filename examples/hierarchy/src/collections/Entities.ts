import type { CollectionConfig } from 'payload/types'

export const Entities: CollectionConfig = {
  slug: 'entities',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    // - This field is populated by setting the query parameter 'children=true'
    // - This is a virtual field used to track a child relationship
    // - Only relationship information is returned by this field
    // - Data beyond relationships is not stored in this field
    {
      name: 'children',
      type: 'relationship',
      access: {
        create: () => false,
        update: () => false,
      },
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            if (!req.query.children || !data) return

            const { id } = data

            const people = await req.payload.find({
              collection: 'people',
              depth: 0,
              limit: 0,
              pagination: false,
              req,
              where: {
                'parents.parent': { equals: id },
              },
            })

            const entities = await req.payload.find({
              collection: 'entities',
              depth: 0,
              limit: 0,
              pagination: false,
              req,
              where: {
                parent: { equals: id },
              },
            })

            return [
              ...entities.docs.map((entity) => {
                return {
                  relationTo: 'entity',
                  value: entity,
                }
              }),
              ...people.docs.map((person) => {
                return {
                  relationTo: 'people',
                  value: person,
                }
              }),
            ]
          },
        ],
      },
      relationTo: ['entities', 'people'],
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'entities',
    },
  ],
}
