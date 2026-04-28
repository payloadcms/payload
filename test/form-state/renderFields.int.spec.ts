import type { Payload } from 'payload'

import { renderFields } from '@payloadcms/ui/utilities/renderFields'
import path from 'path'
import { createLocalReq } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { ArrayRowLabel } from './collections/Posts/ArrayRowLabel.js'
import { RenderTracker } from './collections/Posts/RenderTracker.js'
import { CustomTextField } from './collections/Posts/TextField.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload

describe('renderFields server function', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname, undefined, true))

    // Integration tests run outside Next.js, so the admin layout never loads
    // the generated `app/(payload)/admin/importMap.js` into `payload.importMap`.
    // Build the map directly from the components referenced by the form-state
    // config — the auto-injected `@payloadcms/next/rsc` entries aren't
    // resolvable in the int runtime, but they are not exercised by these tests.
    payload.importMap = {
      './collections/Posts/RenderTracker.js#RenderTracker': RenderTracker,
      './collections/Posts/TextField.js#CustomTextField': CustomTextField,
      './collections/Posts/ArrayRowLabel.js#ArrayRowLabel': ArrayRowLabel,
    }
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('renders a single component and returns its element', async () => {
    const req = await createLocalReq({ user: null }, payload)
    const result = await renderFields({
      req,
      request: {
        collectionSlug: 'posts',
        render: [{ path: 'posts.renderTracker', slot: 'Field' }],
      },
    })

    expect(result.rendered).toHaveLength(1)
    expect(result.rendered[0]).toMatchObject({
      path: 'posts.renderTracker',
      slot: 'Field',
    })
    expect(result.rendered[0]!.payload).toBeDefined()
    expect(result.errors).toBeUndefined()
  })

  it('isolates per-component errors', async () => {
    const req = await createLocalReq({ user: null }, payload)
    const result = await renderFields({
      req,
      request: {
        collectionSlug: 'posts',
        render: [
          { path: 'posts.renderTracker', slot: 'Field' },
          { path: 'posts.does-not-exist', slot: 'Field' },
        ],
      },
    })

    expect(result.rendered).toHaveLength(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors![0]!.path).toBe('posts.does-not-exist')
  })

  it('returns one error per target when componentIndex is missing', async () => {
    const req = await createLocalReq({ user: null }, payload)
    const original = payload.config.componentIndex
    // @ts-expect-error -- temporarily clear to exercise defensive branch
    payload.config.componentIndex = undefined
    try {
      const result = await renderFields({
        req,
        request: {
          collectionSlug: 'posts',
          render: [
            { path: 'posts.renderTracker', slot: 'Field' },
            { path: 'posts.title', slot: 'Field' },
          ],
        },
      })
      expect(result.rendered).toEqual([])
      expect(result.errors).toHaveLength(2)
      expect(result.errors!.every((e) => /componentIndex/i.test(e.message))).toBe(true)
    } finally {
      payload.config.componentIndex = original
    }
  })

  it('stays under 200ms after warm-up for a single component', async () => {
    const req = await createLocalReq({ user: null }, payload)
    // Warm up to avoid first-call import/cache penalties.
    await renderFields({
      req,
      request: {
        collectionSlug: 'posts',
        render: [{ path: 'posts.renderTracker', slot: 'Field' }],
      },
    })

    const t0 = performance.now()
    await renderFields({
      req,
      request: {
        collectionSlug: 'posts',
        render: [{ path: 'posts.renderTracker', slot: 'Field' }],
      },
    })
    const elapsed = performance.now() - t0
    expect(elapsed).toBeLessThan(200)
  })
})
