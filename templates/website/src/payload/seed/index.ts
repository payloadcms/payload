import fs from 'fs'
import path from 'path'
import type { Payload } from 'payload'

import { home } from './home'
import { image1 } from './image-1'
import { image2 } from './image-2'
import { post1 } from './post-1'
import { post2 } from './post-2'
import { post3 } from './post-3'
import { postsPage } from './posts-page'
import { project1 } from './project-1'
import { project2 } from './project-2'
import { project3 } from './project-3'
import { projectsPage } from './projects-page'

const collections = ['categories', 'media', 'pages', 'posts', 'projects', 'comments']
const globals = ['header', 'settings', 'footer']

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async (payload: Payload): Promise<void> => {
  payload.logger.info('Seeding database...')

  // we need to clear the media directory before seeding
  // as well as the collections and globals
  // this is because while `yarn seed` drops the database
  // the custom `/api/seed` endpoint does not

  payload.logger.info(`— Clearing media...`)

  const mediaDir = path.resolve(__dirname, '../../media')
  if (fs.existsSync(mediaDir)) {
    fs.rmdirSync(mediaDir, { recursive: true })
  }

  payload.logger.info(`— Clearing collections and globals...`)

  // clear the database
  await Promise.all([
    ...collections.map(async collection =>
      payload.delete({
        collection,
        where: {},
      }),
    ), // eslint-disable-line function-paren-newline
    ...globals.map(async global =>
      payload.updateGlobal({
        slug: global,
        data: {},
      }),
    ), // eslint-disable-line function-paren-newline
  ])

  payload.logger.info(`— Seeding John Doe user..`)

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: 'john-doe@payloadcms.com',
      },
    },
  })

  const { id: johnDoeUserID } = await payload.create({
    collection: 'users',
    data: {
      email: 'john-doe@payloadcms.com',
      name: 'John Doe',
      password: 'demo-public-user',
      roles: ['user'],
    },
  })

  payload.logger.info(`— Seeding media...`)

  const [image1Doc, image2Doc] = await Promise.all([
    payload.create({
      collection: 'media',
      filePath: path.resolve(__dirname, 'image-1.jpg'),
      data: image1,
    }),
    payload.create({
      collection: 'media',
      filePath: path.resolve(__dirname, 'image-2.jpg'),
      data: image2,
    }),
  ])

  payload.logger.info(`— Seeding categories...`)

  const [technologyCategory, newsCategory, lifestyleCategory] = await Promise.all([
    payload.create({
      collection: 'categories',
      data: {
        title: 'Technology',
      },
    }),
    payload.create({
      collection: 'categories',
      data: {
        title: 'News',
      },
    }),
    payload.create({
      collection: 'categories',
      data: {
        title: 'Lifestyle',
      },
    }),
  ])

  payload.logger.info(`— Seeding posts...`)

  const posts = await Promise.all([
    payload.create({
      collection: 'posts',
      data: JSON.parse(
        JSON.stringify({ ...post1, categories: [technologyCategory.id] }).replace(
          /{{IMAGE}}/g,
          image1Doc.id,
        ),
      ),
    }),
    payload.create({
      collection: 'posts',
      data: JSON.parse(
        JSON.stringify({ ...post2, categories: [newsCategory.id] }).replace(
          /{{IMAGE}}/g,
          image1Doc.id,
        ),
      ),
    }),
    payload.create({
      collection: 'posts',
      data: JSON.parse(
        JSON.stringify({ ...post3, categories: [lifestyleCategory.id] }).replace(
          /{{IMAGE}}/g,
          image1Doc.id,
        ),
      ),
    }),
  ])

  const [post1Doc, post2Doc, post3Doc] = posts

  // update each post with related posts

  await Promise.all([
    payload.update({
      collection: 'posts',
      id: post1Doc.id,
      data: {
        relatedPosts: [post2Doc.id, post3Doc.id],
      },
    }),
    payload.update({
      collection: 'posts',
      id: post2Doc.id,
      data: {
        relatedPosts: [post1Doc.id, post3Doc.id],
      },
    }),
    payload.update({
      collection: 'posts',
      id: post3Doc.id,
      data: {
        relatedPosts: [post1Doc.id, post2Doc.id],
      },
    }),
  ])

  payload.logger.info(`— Seeding comments...`)

  await Promise.all(
    posts.map(
      async (post, index) =>
        await payload.create({
          collection: 'comments',
          data: {
            comment: `This is a comment on post ${
              index + 1
            }. It was first left by a user then approved by an admin.`,
            user: johnDoeUserID,
            doc: post.id,
          },
        }),
    ),
  )

  payload.logger.info(`— Seeding projects...`)

  const [project1Doc, project2Doc, project3Doc] = await Promise.all([
    payload.create({
      collection: 'projects',
      data: JSON.parse(
        JSON.stringify({ ...project1, categories: [technologyCategory.id] }).replace(
          /{{IMAGE}}/g,
          image2Doc.id,
        ),
      ),
    }),
    payload.create({
      collection: 'projects',
      data: JSON.parse(
        JSON.stringify({ ...project2, categories: [newsCategory.id] }).replace(
          /{{IMAGE}}/g,
          image2Doc.id,
        ),
      ),
    }),
    payload.create({
      collection: 'projects',
      data: JSON.parse(
        JSON.stringify({ ...project3, categories: [lifestyleCategory.id] }).replace(
          /{{IMAGE}}/g,
          image2Doc.id,
        ),
      ),
    }),
  ])

  // update each project with related projects

  await Promise.all([
    payload.update({
      collection: 'projects',
      id: project1Doc.id,
      data: {
        relatedProjects: [project2Doc.id, project3Doc.id],
      },
    }),
    payload.update({
      collection: 'projects',
      id: project2Doc.id,
      data: {
        relatedProjects: [project1Doc.id, project3Doc.id],
      },
    }),
    payload.update({
      collection: 'projects',
      id: project3Doc.id,
      data: {
        relatedProjects: [project1Doc.id, project2Doc.id],
      },
    }),
  ])

  payload.logger.info(`— Seeding posts page...`)

  const { id: postsPageID } = await payload.create({
    collection: 'pages',
    data: JSON.parse(JSON.stringify(postsPage).replace(/{{IMAGE}}/g, image1Doc.id)),
  })

  payload.logger.info(`— Seeding projects page...`)

  const { id: projectsPageID } = await payload.create({
    collection: 'pages',
    data: JSON.parse(JSON.stringify(projectsPage).replace(/{{IMAGE}}/g, image1Doc.id)),
  })

  payload.logger.info(`— Seeding home page...`)

  await payload.create({
    collection: 'pages',
    data: JSON.parse(
      JSON.stringify(home)
        .replace(/{{IMAGE_1}}/g, image1Doc.id)
        .replace(/{{IMAGE_2}}/g, image2Doc.id)
        .replace(/{{POSTS_PAGE_ID}}/g, postsPageID)
        .replace(/{{PROJECTS_PAGE_ID}}/g, projectsPageID),
    ),
  })

  payload.logger.info(`— Seeding settings...`)

  await payload.updateGlobal({
    slug: 'settings',
    data: {
      postsPage: postsPageID,
      projectsPage: projectsPageID,
    },
  })

  payload.logger.info(`— Seeding header...`)

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
        {
          link: {
            type: 'reference',
            reference: {
              relationTo: 'pages',
              value: projectsPageID,
            },
            label: 'Projects',
          },
        },
      ],
    },
  })

  payload.logger.info('Seeded database successfully!')
}
