# Payload Testing Example

This example demonstrates how to get started with testing Payload using [Jest](https://jestjs.io/). You can clone this down and use it as a starting point for your own Payload projects, or you can follow the steps below to add testing to your existing Payload project.

## Add testing to your existing Payload project

1. Initial setup:

```bash
# install dependencies
yarn add --dev jest mongodb-memory-server @swc/jest @swc/core isomorphic-fetch @types/jest
```

```bash
# create a .env file
cp .env.example .env
```

2. This example uses the following folder structure:

```
root
└─ /src
    └─ payload.config.ts
    └─ /tests
```

3. Add test credentials to your project. Create a file at `src/tests/credentials.ts` with the following contents:

```ts
export default {
  email: 'test@test.com',
  password: 'test',
}
```

4. Add the global setup file to your project. This file will be run before any tests are run. It will start a MongoDB server and create a Payload instance for you to use in your tests. Create a file at `src/tests/globalSetup.ts` with the following contents:

```ts
import { resolve } from 'path'
import payload from 'payload'
import express from 'express'
import testCredentials from './credentials'

require('dotenv').config({
  path: resolve(__dirname, '../../.env'),
})

const app = express()

const globalSetup = async () => {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET_KEY,
    express: app,
  })

  app.listen(process.env.PORT, async () => {
    console.log(`Express is now listening for incoming connections on port ${process.env.PORT}.`)
  })

  const response = await fetch(
    `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/users/first-register`,
    {
      body: JSON.stringify({
        email: testCredentials.email,
        password: testCredentials.password,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'post',
    },
  )

  const data = await response.json()

  if (!data.user || !data.user.token) {
    throw new Error('Failed to register first user')
  }
}

export default globalSetup
```

5. Add a `jest.config.ts` file to the root of your project:

```ts
module.exports = {
  verbose: true,
  globalSetup: '<rootDir>/src/tests/globalSetup.ts',
  roots: ['<rootDir>/src/'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          target: 'es2021',
        },
      },
    ],
  },
}
```

6. Write your first test. Create a file at `src/tests/login.spec.ts` with the following contents:

```ts
import { User } from '../payload-types'
import testCredentials from './credentials'

describe('Users', () => {
  it('should allow a user to log in', async () => {
    const result: {
      token: string
      user: User
    } = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/users/login`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testCredentials.email,
        password: testCredentials.password,
      }),
    }).then((res) => res.json())

    expect(result.token).toBeDefined()
  })
})
```

7. Add a script to run tests via the command line. Add the following to your `package.json` scripts:

```json
"scripts": {
  "test": "jest --forceExit --detectOpenHandles"
}
```

8. Run your tests:

```bash
yarn test
```
