import type { Payload } from 'payload'

import path from 'path'
import { getFileByPath } from 'payload'
import { fileURLToPath } from 'url'

import { devUser } from '../credentials.js'
import { seedDB } from '../helpers/seed.js'
import { collectionSlugs } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const _seed = async (_payload: Payload) => {
  await _payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
  })
}

export async function seed(_payload: Payload) {
  return await _seed(_payload)
}
