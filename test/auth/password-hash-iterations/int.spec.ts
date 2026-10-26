import type { Payload } from 'payload'

import crypto from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../../__helpers/shared/initPayloadInt.js'
import { passwordHashIterationsUsersSlug } from './shared.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const email = 'password-hash-iterations@example.com'
const password = 'test-password'

const createUserWithStoredHash = async ({
  hash,
  salt,
}: {
  hash: string
  salt: string
}): Promise<number | string> => {
  const user = await payload.create({
    collection: passwordHashIterationsUsersSlug,
    data: { email, password },
  })

  await payload.db.updateOne({
    collection: passwordHashIterationsUsersSlug,
    data: { hash, salt },
    id: user.id,
  })

  return user.id
}

const loginAndFindStoredHash = async (id: number | string): Promise<string | undefined> => {
  await payload.login({
    collection: passwordHashIterationsUsersSlug,
    data: { email, password },
  })

  const user = await payload.db.findOne<{ hash?: string; id: number | string }>({
    collection: passwordHashIterationsUsersSlug,
    select: { hash: true },
    where: { id: { equals: id } },
  })

  return user?.hash
}

describe('Password hash iterations', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname, 'auth/password-hash-iterations'))
  })

  afterEach(async () => {
    await payload.delete({
      collection: passwordHashIterationsUsersSlug,
      where: { email: { equals: email } },
    })
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should store 100k password hashes for new users', async () => {
    const user = await payload.create({
      collection: passwordHashIterationsUsersSlug,
      data: { email, password },
    })

    const storedUser = await payload.db.findOne<{ hash?: string; id: number | string }>({
      collection: passwordHashIterationsUsersSlug,
      select: { hash: true },
      where: { id: { equals: user.id } },
    })

    expect(storedUser?.hash).toMatch(/^pbkdf2-sha256-100k-v1:[a-f0-9]{64}$/)
  })

  it('should rehash a 600k password hash to 100k after login', async () => {
    const salt = crypto.randomBytes(32).toString('hex')
    const hash = `pbkdf2-sha256-v1:${crypto.pbkdf2Sync(password, salt, 600000, 32, 'sha256').toString('hex')}`
    const id = await createUserWithStoredHash({ hash, salt })

    const storedHash = await loginAndFindStoredHash(id)

    expect(storedHash).toMatch(/^pbkdf2-sha256-100k-v1:[a-f0-9]{64}$/)
  })

  it('should rehash a legacy password hash to 100k after login', async () => {
    const salt = crypto.randomBytes(32).toString('hex')
    const hash = crypto.pbkdf2Sync(password, salt, 25000, 512, 'sha256').toString('hex')
    const id = await createUserWithStoredHash({ hash, salt })

    const storedHash = await loginAndFindStoredHash(id)

    expect(storedHash).toMatch(/^pbkdf2-sha256-100k-v1:[a-f0-9]{64}$/)
  })
})
