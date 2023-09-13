import type { Payload } from 'payload'

import { seedForms } from './forms'
import { seedGlobals } from './globals'
import { seedMedia } from './media'
import { seedPages } from './pages'
import { seedProjects } from './projects'
import { seedTechnologies } from './technologies'
import { seedUsers } from './users'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const seed = async (_payload: Payload): Promise<void> => {
  await seedUsers()

  const forms = await seedForms()
  const media = await seedMedia()

  await seedGlobals(media)

  const technologies = await seedTechnologies()
  const projects = await seedProjects(media, technologies)

  await seedPages(forms, projects)
}
