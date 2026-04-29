import type { Payload } from 'payload'

import { runAdminValidate } from '@payloadcms/ui/forms/runAdminValidate'
import { createClientImportRegistry } from '@payloadcms/ui/utilities/clientImportRegistry'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload

const VALIDATE_PATH = './collections/Posts/validators/handleMin3.js#handleMin3'

describe('Phase 4 — path-valued admin.validate pipeline', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname, undefined, true))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('routes path-valued admin.validate to the client import map', () => {
    const clientEntries = payload.config.importMaps?.client.entries ?? []
    const validateEntry = clientEntries.find(
      (e) => e.kind === 'admin-validate' && e.path === VALIDATE_PATH,
    )
    expect(validateEntry).toBeDefined()
    expect(validateEntry?.fieldPath).toBe('posts.handle')
  })

  it('does NOT route the admin.validate ref to the server import map', () => {
    const serverEntries = payload.config.importMaps?.server.entries ?? []
    const validateInServer = serverEntries.find((e) => e.kind === 'admin-validate')
    expect(validateInServer).toBeUndefined()
  })

  it('the validator module loads and exports a function', async () => {
    const mod = (await import('./collections/Posts/validators/handleMin3.js')) as {
      handleMin3: (value: unknown) => string | true
    }
    expect(typeof mod.handleMin3).toBe('function')
    expect(mod.handleMin3('abc')).toBe(true)
    expect(mod.handleMin3('ab')).toBe('must be at least 3 characters')
    expect(mod.handleMin3(undefined)).toBe('must be at least 3 characters')
  })

  it('runAdminValidate resolves the path-string and returns an error map', async () => {
    const mod = await import('./collections/Posts/validators/handleMin3.js')
    const registry = createClientImportRegistry({
      [VALIDATE_PATH]: () => Promise.resolve(mod),
    })

    const failingErrors = await runAdminValidate({
      context: { data: {}, operation: 'update', siblingData: undefined, user: null },
      registry,
      validators: [
        { path: 'posts.handle', ref: { exportName: 'handleMin3', path: VALIDATE_PATH } },
      ],
      values: { 'posts.handle': 'ab' },
    })
    expect(failingErrors.get('posts.handle')).toBe('must be at least 3 characters')

    const passingErrors = await runAdminValidate({
      context: { data: {}, operation: 'update', siblingData: undefined, user: null },
      registry,
      validators: [
        { path: 'posts.handle', ref: { exportName: 'handleMin3', path: VALIDATE_PATH } },
      ],
      values: { 'posts.handle': 'abcd' },
    })
    expect(passingErrors.has('posts.handle')).toBe(false)
  })
})
