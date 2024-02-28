import { CollectionConfig } from 'payload/types'

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
      relationTo: ['entities', 'people'],
      access: {
        create: () => false,
        update: () => false,
      },
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            const { id } = data

            if (!req.query.children) return

            const people = await req.payload.find({
              req,
              collection: 'people',
              where: {
                'parents.parent': { equals: id },
              },
              limit: 0,
              depth: 0,
              pagination: false,
            })

            const entities = await req.payload.find({
              req,
              collection: 'entities',
              where: {
                parent: { equals: id },
              },
              limit: 0,
              depth: 0,
              pagination: false,
            })

            return [
              ...entities.docs.map(entity => {
                return {
                  relationTo: 'entity',
                  value: entity,
                }
              }),
              ...people.docs.map(person => {
                return {
                  relationTo: 'people',
                  value: person,
                }
              }),
            ]
          },
        ],
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'entities',
    },
  ],
}
