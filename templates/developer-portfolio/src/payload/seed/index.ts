import fs from 'fs'
import path from 'path'
import type { Payload } from 'payload'

import type { Header, Profile } from '../payload-types'
import { seedForms } from './forms'
import { seedGlobals } from './globals'
import { seedMedia } from './media'
import { seedPages } from './pages'
import { seedProjects } from './projects'
import { seedTechnologies } from './technologies'

type GlobalType = 'profile' | 'header'

const collections = ['forms', 'media', 'pages', 'projects', 'technologies']
// const globals = ['profile', 'header']
const globals: GlobalType[] = ['profile', 'header']

const getDefaultData = (globalName: GlobalType): Header | Profile => {
  switch (globalName) {
    case 'profile':
      return {
        id: '',
        name: 'Default',
      }
    case 'header':
      return {
        id: '',
      }
    default:
      throw new Error('Invalid global name')
  }
}

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
    globals.map(async global => {
      const defaultData = getDefaultData(global)

      await payload.updateGlobal({
        slug: global,
        data: defaultData,
      })
    }),
  ])

  payload.logger.info(`— Seeding form...`)

  const forms = await seedForms()

  payload.logger.info(`— Seeding media...`)

  const media = await seedMedia()

  payload.logger.info(`— Seeding globals...`)

  await seedGlobals(media)

  payload.logger.info(`— Seeding technologies...`)

  const technologies = await seedTechnologies()

  payload.logger.info(`— Seeding projects...`)

  const projects = await seedProjects(media, technologies)

  payload.logger.info(`— Seeding pages...`)

  await seedPages(forms, projects)

  payload.logger.info('Seeded database successfully!')
}
