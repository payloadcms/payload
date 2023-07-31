import fs from 'fs'
import path from 'path'
import type { Payload } from 'payload'

import { contactPage } from './contact-page'
import { home } from './home'
import { image1 } from './image-1'
import { image2 } from './image-2'
import { image3 } from './image-3'
import { post1 } from './post-1'
import { post2 } from './post-2'
import { post3 } from './post-3'
import { postsPage } from './posts-page'
import { project1 } from './project-1'
import { project2 } from './project-2'
import { project3 } from './project-3'
import { projectsPage } from './projects-page'

const collections = ['categories', 'media', 'pages', 'projects', 'posts']
const globals = ['header', 'settings', 'footer']

export const seed = async (payload: Payload): Promise<void> => {
  // remove the media directory
  const mediaDir = path.resolve(__dirname, '../../media')
  if (fs.existsSync(mediaDir)) {
    fs.rmdirSync(mediaDir, { recursive: true })
  }

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

  const [image1Doc, image2Doc, image3Doc] = await Promise.all([
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
    payload.create({
      collection: 'media',
      filePath: path.resolve(__dirname, 'image-3.jpg'),
      data: image3,
    }),
  ])

  const [designCategory, developmentCategory, videoCategory] = await Promise.all([
    payload.create({
      collection: 'categories',
      data: {
        title: 'Design',
      },
    }),
    payload.create({
      collection: 'categories',
      data: {
        title: 'Development',
      },
    }),
    payload.create({
      collection: 'categories',
      data: {
        title: 'Video',
      },
    }),
  ])

  Promise.all([
    payload.create({
      collection: 'posts',
      data: JSON.parse(
        JSON.stringify({ ...post1, categories: [designCategory.id] }).replace(
          /{{POST_IMAGE}}/g,
          image1Doc.id,
        ),
      ),
    }),
    payload.create({
      collection: 'posts',
      data: JSON.parse(
        JSON.stringify({ ...post2, categories: [developmentCategory.id] }).replace(
          /{{POST_IMAGE}}/g,
          image2Doc.id,
        ),
      ),
    }),
    payload.create({
      collection: 'posts',
      data: JSON.parse(
        JSON.stringify({ ...post3, categories: [videoCategory.id] }).replace(
          /{{POST_IMAGE}}/g,
          image3Doc.id,
        ),
      ),
    }),
    payload.create({
      collection: 'projects',
      data: JSON.parse(
        JSON.stringify({ ...project1, categories: [designCategory.id] }).replace(
          /{{PROJECT_IMAGE}}/g,
          image1Doc.id,
        ),
      ),
    }),
    payload.create({
      collection: 'projects',
      data: JSON.parse(
        JSON.stringify({ ...project2, categories: [developmentCategory.id] }).replace(
          /{{PROJECT_IMAGE}}/g,
          image2Doc.id,
        ),
      ),
    }),
    payload.create({
      collection: 'projects',
      data: JSON.parse(
        JSON.stringify({ ...project3, categories: [videoCategory.id] }).replace(
          /{{PROJECT_IMAGE}}/g,
          image3Doc.id,
        ),
      ),
    }),
  ])

  const { id: postsPageID } = await payload.create({
    collection: 'pages',
    data: postsPage,
  })

  const { id: projectsPageID } = await payload.create({
    collection: 'pages',
    data: projectsPage,
  })

  const { id: contactPageID } = await payload.create({
    collection: 'pages',
    data: contactPage,
  })

  await payload.create({
    collection: 'pages',
    data: JSON.parse(
      JSON.stringify(home)
        .replace(/{{POST1_IMAGE}}/g, image1Doc.id)
        .replace(/{{POST2_IMAGE}}/g, image2Doc.id)
        .replace(/{{POSTS_PAGE_ID}}/g, postsPageID)
        .replace(/{{PROJECTS_PAGE_ID}}/g, projectsPageID),
    ),
  })

  await payload.updateGlobal({
    slug: 'settings',
    data: {
      postsPage: postsPageID,
      projectsPage: projectsPageID,
    },
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
            label: 'Blog',
          },
        },
        {
          link: {
            type: 'reference',
            reference: {
              relationTo: 'pages',
              value: projectsPageID,
            },
            label: 'Portfolio',
          },
        },
        {
          link: {
            type: 'reference',
            reference: {
              relationTo: 'pages',
              value: contactPageID,
            },
            label: 'Contact',
          },
        },
      ],
    },
  })
}
