import type { Payload } from 'payload'

import crypto from 'crypto'
import { expect } from 'vitest'

import { test } from '../../__helpers/int/vitest.js'
import { passwordHashIterationsUsersSlug } from './shared.js'

const email = 'password-hash-iterations@example.com'
const password = 'test-password'

const createUserWithStoredHash = async ({
  hash,
  payload,
  salt,
}: {
  hash: string
  payload: Payload
  salt: string
}): Promise<number | string> => {
  const user = await payload.create({
    collection: passwordHashIterationsUsersSlug,
    data: { email, password },
    overrideAccess: true,
  })

  await payload.db.updateOne({
    id: user.id,
    collection: passwordHashIterationsUsersSlug,
    data: { hash, salt },
  })

  return user.id
}

const loginAndFindStoredHash = async ({
  id,
  payload,
}: {
  id: number | string
  payload: Payload
}): Promise<string | undefined> => {
  await payload.login({
    collection: passwordHashIterationsUsersSlug,
    data: { email, password },
    overrideAccess: true,
  })

  const user = await payload.db.findOne<{ hash?: string; id: number | string }>({
    collection: passwordHashIterationsUsersSlug,
    select: { hash: true },
    where: { id: { equals: id } },
  })

  return user?.hash
}

test.suite('Password hash iterations', { config: './config.ts' }, () => {
  test('should store 100k password hashes for new users', async ({ payload }) => {
    const user = await payload.create({
      collection: passwordHashIterationsUsersSlug,
      data: { email, password },
      overrideAccess: true,
    })

    const storedUser = await payload.db.findOne<{ hash?: string; id: number | string }>({
      collection: passwordHashIterationsUsersSlug,
      select: { hash: true },
      where: { id: { equals: user.id } },
    })

    expect(storedUser?.hash).toMatch(/^pbkdf2-sha256-100k-v1:[a-f0-9]{64}$/)
  })

  test('should rehash a 600k password hash to 100k after login', async ({ payload }) => {
    const salt = crypto.randomBytes(32).toString('hex')
    const hash = `pbkdf2-sha256-v1:${crypto.pbkdf2Sync(password, salt, 600000, 32, 'sha256').toString('hex')}`
    const id = await createUserWithStoredHash({ hash, payload, salt })

    const storedHash = await loginAndFindStoredHash({ id, payload })

    expect(storedHash).toMatch(/^pbkdf2-sha256-100k-v1:[a-f0-9]{64}$/)
  })

  test('should rehash a legacy password hash to 100k after login', async ({ payload }) => {
    const salt = crypto.randomBytes(32).toString('hex')
    const hash = crypto.pbkdf2Sync(password, salt, 25000, 512, 'sha256').toString('hex')
    const id = await createUserWithStoredHash({ hash, payload, salt })

    const storedHash = await loginAndFindStoredHash({ id, payload })

    expect(storedHash).toMatch(/^pbkdf2-sha256-100k-v1:[a-f0-9]{64}$/)
  })
})
