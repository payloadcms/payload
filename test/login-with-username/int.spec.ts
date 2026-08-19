import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'

test.suite({ config: './config.ts' })('Login With Username Feature', () => {
  test('should not allow creation with neither email nor username', async ({ payload }) => {
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

  test('should not allow removing both username and email fields', async ({ payload }) => {
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

  test('should allow login with either username or email', async ({ payload }) => {
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

  test('should allow mutliple creates with optional email and username', async ({ payload }) => {
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
