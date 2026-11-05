import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { fallbackDisabledPagesSlug } from './fallbackDisabled.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload
let restClient: NextRESTClient

describe('Localization with fallback disabled', () => {
  const createdIDs: (number | string)[] = []

  beforeAll(async () => {
    const result = await initPayloadInt(dirname, undefined, undefined, 'fallbackDisabled.config.ts')
    payload = result.payload
    restClient = result.restClient
  })

  afterEach(async () => {
    for (const id of createdIDs) {
      await payload.delete({ id, collection: fallbackDisabledPagesSlug })
    }

    createdIDs.length = 0
  })

  afterAll(async () => {
    if (payload?.db && typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  it('should query a localized field over REST without a locale param', async () => {
    const page = await payload.create({
      collection: fallbackDisabledPagesSlug,
      data: { slug: 'hallo' },
      locale: 'de',
    })

    createdIDs.push(page.id)

    const response = await restClient.GET(`/${fallbackDisabledPagesSlug}`, {
      query: { where: { slug: { equals: 'hallo' } } },
    })

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.docs).toHaveLength(1)
    expect(body.docs[0].id).toBe(page.id)
  })

  it('should return localized values in the default locale when no locale param is sent', async () => {
    const page = await payload.create({
      collection: fallbackDisabledPagesSlug,
      data: { slug: 'hallo' },
      locale: 'de',
    })

    createdIDs.push(page.id)

    const response = await restClient.GET(`/${fallbackDisabledPagesSlug}/${page.id}`)

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.slug).toBe('hallo')
  })

  it('should still return the requested locale when a locale param is sent', async () => {
    const page = await payload.create({
      collection: fallbackDisabledPagesSlug,
      data: { slug: 'hallo' },
      locale: 'de',
    })

    createdIDs.push(page.id)

    await payload.update({
      id: page.id,
      collection: fallbackDisabledPagesSlug,
      data: { slug: 'hello' },
      locale: 'en',
    })

    const response = await restClient.GET(`/${fallbackDisabledPagesSlug}/${page.id}`, {
      query: { locale: 'en' },
    })

    const body = await response.json()

    expect(body.slug).toBe('hello')
  })
})
