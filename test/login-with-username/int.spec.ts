import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Login With Username Feature', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should not allow creation with neither email nor username', async () => {
    let errors = []
    try {
      await payload.create({
        collection: 'login-with-either',
        data: {
          email: null,
          username: null,
        },
        overrideAccess: true,
      })
    } catch (error) {
      errors = error.data.errors
    }
    expect(errors).toHaveLength(2)
  })

  it('should not allow removing both username and email fields', async () => {
    const emailToUse = 'example@email.com'
    const usernameToUse = 'exampleUser'

    const exampleUser = await payload.create({
      collection: 'login-with-either',
      data: {
        email: emailToUse,
        username: usernameToUse,
        password: 'test',
      },
      overrideAccess: true,
    })

    let errors = []
    try {
      await payload.update({
        collection: 'login-with-either',
        id: exampleUser.id,
        data: {
          email: null,
          username: null,
        },
        overrideAccess: true,
      })
    } catch (error) {
      errors = error.data.errors
    }
    expect(errors).toHaveLength(2)

    errors = []
    await payload.update({
      collection: 'login-with-either',
      id: exampleUser.id,
      data: {
        username: null,
      },
      overrideAccess: true,
    })
    expect(errors).toHaveLength(0)

    try {
      await payload.update({
        collection: 'login-with-either',
        id: exampleUser.id,
        data: {
          email: null,
        },
        overrideAccess: true,
      })
    } catch (error) {
      errors = error.data.errors
    }
    expect(errors).toHaveLength(2)
  })

  it('should allow login with either username or email', async () => {
    await payload.create({
      collection: 'login-with-either',
      data: {
        email: devUser.email,
        username: 'dev',
        password: devUser.password,
      },
      overrideAccess: true,
    })

    const loginWithEmail = await payload.login({
      collection: 'login-with-either',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
      overrideAccess: true,
    })
    expect(loginWithEmail).toHaveProperty('token')

    const loginWithUsername = await payload.login({
      collection: 'login-with-either',
      data: {
        username: 'dev',
        password: devUser.password,
      },
      overrideAccess: true,
    })
    expect(loginWithUsername).toHaveProperty('token')
  })

  it('should allow mutliple creates with optional email and username', async () => {
    // create a user with just email
    await payload.create({
      collection: 'login-with-either',
      data: {
        email: 'email1@mail.com',
        password: 'test',
      },
      overrideAccess: true,
    })

    // create second user with just email
    const emailUser2 = await payload.create({
      collection: 'login-with-either',
      data: {
        email: 'email2@mail.com',
        password: 'test',
      },
      overrideAccess: true,
    })
    expect(emailUser2).toHaveProperty('id')

    // create user with just username
    await payload.create({
      collection: 'login-with-either',
      data: {
        username: 'username1',
        password: 'test',
      },
      overrideAccess: true,
    })

    // create second user with just username
    const usernameUser2 = await payload.create({
      collection: 'login-with-either',
      data: {
        username: 'username2',
        password: 'test',
      },
      overrideAccess: true,
    })
    expect(usernameUser2).toHaveProperty('id')
  })
})
