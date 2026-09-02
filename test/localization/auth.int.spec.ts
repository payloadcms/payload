import type { Payload } from 'payload'

import path from 'path'
import { createLocalReq } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import { spanishLocale, usersSlug } from './shared.js'

const englishName = 'English Name'
const spanishName = 'Nombre Español'

let payload: Payload
let restClient: NextRESTClient
let token: string
let userId: number | string

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Auth localization', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

    const user = (
      await payload.find({
        collection: usersSlug,
        limit: 1,
        where: { email: { equals: devUser.email } },
      })
    ).docs[0]

    if (!user) {
      throw new Error('Expected localization seed to create the dev user')
    }

    userId = user.id

    await payload.update({
      id: userId,
      collection: usersSlug,
      data: { name: englishName },
      locale: 'en',
    })

    await payload.update({
      id: userId,
      collection: usersSlug,
      data: { name: spanishName },
      locale: spanishLocale,
    })

    const login = await restClient.login({ slug: usersSlug })
    token = login.token
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('returns localized user fields from payload.auth() when req.locale is set', async () => {
    const req = await createLocalReq({ locale: spanishLocale }, payload)
    const { user } = await payload.auth({
      headers: new Headers({
        Authorization: `JWT ${token}`,
      }),
      req,
    })

    expect(user?.name).toBe(spanishName)
  })

  it('returns localized user fields from payload.auth() when locale is passed on AuthArgs', async () => {
    const { user } = await payload.auth({
      headers: new Headers({
        Authorization: `JWT ${token}`,
      }),
      locale: spanishLocale,
    })

    expect(user?.name).toBe(spanishName)
  })

  it('loads req.user in the request locale on HTTP requests', async () => {
    const data = await restClient
      .GET('/whoami', {
        query: { locale: spanishLocale },
      })
      .then((res) => res.json())

    expect(data.locale).toBe(spanishLocale)
    expect(data.name).toBe(spanishName)
  })
})
