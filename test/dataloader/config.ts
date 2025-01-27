import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'

export default buildConfigWithDefaults({
  collections: [
    {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'owner',
          type: 'relationship',
          relationTo: 'users',
          hooks: {
            beforeChange: [({ req: { user } }) => user?.id],
          },
        },
      ],
    },
    {
      slug: 'relation-a',
      labels: {
        singular: 'Relation A',
        plural: 'Relation As',
      },
      fields: [
        {
          name: 'relationship',
          type: 'relationship',
          relationTo: 'relation-b',
        },
        {
          name: 'richText',
          type: 'richText',
        },
      ],
    },
    {
      slug: 'relation-b',
      labels: {
        singular: 'Relation B',
        plural: 'Relation Bs',
      },
      fields: [
        {
          name: 'relationship',
          type: 'relationship',
          relationTo: 'relation-a',
        },
        {
          name: 'richText',
          type: 'richText',
        },
      ],
    },
    {
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'items',
          type: 'relationship',
          relationTo: 'items',
          hasMany: true,
        },
      ],
      slug: 'shops',
      access: { read: () => true },
    },
    {
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'itemTags',
          type: 'relationship',
          relationTo: 'itemTags',
          hasMany: true,
        },
      ],
      slug: 'items',
      access: { read: () => true },
    },
    {
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
      slug: 'itemTags',
      access: { read: () => true },
    },
  ],
  onInit: async (payload) => {
    const user = await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    await payload.create({
      user,
      collection: 'posts',
      data: postDoc,
    })

    const tag = await payload.create({
      collection: 'itemTags',
      data: { name: 'tag1' },
    })
    const item = await payload.create({
      collection: 'items',
      data: { name: 'item1', itemTags: [tag.id] },
    })
    const shop = await payload.create({
      collection: 'shops',
      data: { name: 'shop1', items: [item.id] },
    })
  },
})

export const postDoc = {
  title: 'test post',
}
