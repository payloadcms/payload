import type { Payload } from 'payload'

import { home } from './home'
import { parent } from './parent'
import { child } from './child'
import { grandchild } from './grandchild'

export const seed = async (payload: Payload): Promise<void> => {
  await payload.create({
    collection: 'users',
    data: {
      email: 'demo@payloadcms.com',
      password: 'demo',
    },
  })

  const [parentDoc, childDoc, grandchildDoc] = await Promise.all(
    Array.from(Array(3).keys()).map(key =>
      payload.create({
        collection: 'pages',
        data: {
          title: 'Page',
          slug: `temp-${key}`,
          richText: [],
        },
      }),
    ),
  )

  await payload.update({
    collection: 'pages',
    id: parentDoc.id,
    data: JSON.parse(
      JSON.stringify(parent)
        .replace(/{{CHILD_PAGE_ID}}/g, childDoc.id)
        .replace(/{{GRANDCHILD_PAGE_ID}}/g, grandchildDoc.id),
    ),
  })

  await payload.update({
    collection: 'pages',
    id: childDoc.id,
    data: JSON.parse(
      JSON.stringify(child)
        .replace(/{{PARENT_PAGE_ID}}/g, parentDoc.id)
        .replace(/{{GRANDCHILD_PAGE_ID}}/g, grandchildDoc.id),
    ),
  })

  await payload.update({
    collection: 'pages',
    id: grandchildDoc.id,
    data: JSON.parse(
      JSON.stringify(grandchild)
        .replace(/{{PARENT_PAGE_ID}}/g, parentDoc.id)
        .replace(/{{CHILD_PAGE_ID}}/g, childDoc.id),
    ),
  })

  const homepageJSON = JSON.parse(
    JSON.stringify(home)
      .replace(/{{PARENT_PAGE_ID}}/g, parentDoc.id)
      .replace(/{{CHILD_PAGE_ID}}/g, childDoc.id)
      .replace(/{{GRANDCHILD_PAGE_ID}}/g, grandchildDoc.id),
  )

  await payload.create({
    collection: 'pages',
    data: homepageJSON,
  })

  await payload.updateGlobal({
    slug: 'main-menu',
    data: {
      navItems: [
        {
          link: {
            type: 'reference',
            url: '',
            reference: {
              relationTo: 'pages',
              value: parentDoc.id,
            },
            label: 'Parent',
          },
        },
        {
          link: {
            type: 'reference',
            url: '',
            reference: {
              relationTo: 'pages',
              value: childDoc.id,
            },
            label: 'Child',
          },
        },
        {
          link: {
            type: 'reference',
            url: '',
            reference: {
              relationTo: 'pages',
              value: grandchildDoc.id,
            },
            label: 'Grandchild',
          },
        },
      ],
    },
  })
}
