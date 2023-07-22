import path from 'path'
import type { Payload } from 'payload'

import { courseImage } from './course'
import { home } from './home'
import { post1 } from './post-1'
import { post2 } from './post-2'
import { posts } from './posts-page'
import { shirtImage } from './shirt-image'

export const seed = async (payload: Payload): Promise<void> => {
  await payload.create({
    collection: 'users',
    data: {
      email: 'dev@payloadcms.com',
      name: 'Payload Dev',
      password: 'test',
      roles: ['admin'],
    },
  })

  const { id: shirtDocID } = await payload.create({
    collection: 'media',
    filePath: path.resolve(__dirname, 'shirts.jpg'),
    data: shirtImage,
  })

  const { id: courseDocID } = await payload.create({
    collection: 'media',
    filePath: path.resolve(__dirname, 'shirts.jpg'),
    data: courseImage,
  })

  const postsPageJSON = JSON.parse(JSON.stringify(posts).replace(/{{SHIRTS_IMAGE}}/g, shirtDocID))

  const { id: postsPageID } = await payload.create({
    collection: 'pages',
    data: postsPageJSON,
  })

  const homePageJSON = JSON.parse(
    JSON.stringify(home)
      .replace(/{{SHIRTS_IMAGE}}/g, shirtDocID)
      .replace(/{{COURSE_IMAGE}}/g, courseDocID),
  )

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: homePageID } = await payload.create({
    collection: 'pages',
    data: homePageJSON,
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: postOneID } = await payload.create({
    collection: 'posts',
    data: JSON.parse(JSON.stringify(post1)),
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: postTwoID } = await payload.create({
    collection: 'posts',
    data: JSON.parse(JSON.stringify(post2)),
  })

  await payload.updateGlobal({
    slug: 'header',
    data: {
      navItems: [
        {
          link: {
            type: 'reference',
            reference: {
              relationTo: 'pages',
              value: postsPageID,
            },
            label: 'Posts',
          },
        },
      ],
    },
  })
}
