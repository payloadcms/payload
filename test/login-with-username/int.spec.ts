import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import testConfig from './config.js'

test.suite({ config: testConfig })('Login With Username Feature', () => {
  test('should not allow creation with neither email nor username', async ({ payload }) => {
    let errors = []
    try {
      await payload.create({
        collection: 'login-with-either',
        data: {
          email: null,
          username: null,
        },
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
    })
    expect(errors).toHaveLength(0)

    try {
      await payload.update({
        collection: 'login-with-either',
        id: exampleUser.id,
        data: {
          email: null,
        },
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
    })

    const loginWithEmail = await payload.login({
      collection: 'login-with-either',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
    expect(loginWithEmail).toHaveProperty('token')

    const loginWithUsername = await payload.login({
      collection: 'login-with-either',
      data: {
        username: 'dev',
        password: devUser.password,
      },
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
    })

    // create second user with just email
    const emailUser2 = await payload.create({
      collection: 'login-with-either',
      data: {
        email: 'email2@mail.com',
        password: 'test',
      },
    })
    expect(emailUser2).toHaveProperty('id')

    // create user with just username
    await payload.create({
      collection: 'login-with-either',
      data: {
        username: 'username1',
        password: 'test',
      },
    })

    // create second user with just username
    const usernameUser2 = await payload.create({
      collection: 'login-with-either',
      data: {
        username: 'username2',
        password: 'test',
      },
    })
    expect(usernameUser2).toHaveProperty('id')
  })
})
