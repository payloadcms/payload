import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
}

/**
 * Seeds a test user for e2e admin tests
 */
export async function seedTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  // Delete existing test user if any
  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  // Create fresh test user
  await payload.create({
    collection: 'users',
    data: testUser,
  })
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })
}

/**
 * Ensures a test user exists (creates if not found)
 */
export async function ensureTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  try {
    // Check if user already exists
    const existingUser = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: testUser.email,
        },
      },
      limit: 1,
    })

    if (existingUser.docs.length === 0) {
      // User doesn't exist, create it
      await payload.create({
        collection: 'users',
        data: testUser,
      })
    }
  } catch (error) {
    console.error('Error ensuring test user exists:', error)
    throw error
  }
}
