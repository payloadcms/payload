import type { Payload, SanitizedCollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { Page } from './payload-types.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { pagesSlug } from './slugs.js'

const sharedFilterCollection = 'payload-shared-filters'

let payload: Payload
let token: string
let restClient: NextRESTClient

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Shared Filters', () => {
  let page: Page
  let postConfig: SanitizedCollectionConfig

  beforeAll(async () => {
    // @ts-expect-error: initPayloadInt does not have a proper type definition
    ;({ payload, restClient } = await initPayloadInt(dirname))

    const loginResult = await payload.login({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    user = loginResult.user

    token = loginResult.token as string

    page = await payload.create({
      collection: pagesSlug,
      data: {
        text: 'some page',
      },
    })
  })

  describe('access control', () => {
    it.todo('should only allow read access to readers')
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  it.todo('should')
})
