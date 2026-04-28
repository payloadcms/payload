import type { Payload } from 'payload'

import { evaluateConditions } from '@payloadcms/ui/forms/evaluateConditions'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload

const CONDITION_PATH = './collections/Posts/conditions/showAdvanced.js#showAdvanced'

describe('Phase 3 — path-valued condition pipeline', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname, undefined, true))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('routes path-valued admin.condition to the client import map', () => {
    const clientEntries = payload.config.importMaps?.client.entries ?? []
    const conditionEntry = clientEntries.find(
      (e) => e.kind === 'admin-condition' && e.path === CONDITION_PATH,
    )
    expect(conditionEntry).toBeDefined()
    expect(conditionEntry?.fieldPath).toBe('posts.advancedNote')
  })

  it('does NOT route the condition to the server import map', () => {
    const serverEntries = payload.config.importMaps?.server.entries ?? []
    const conditionInServer = serverEntries.find((e) => e.kind === 'admin-condition')
    expect(conditionInServer).toBeUndefined()
  })

  it('the condition module loads and exports a function', async () => {
    const mod = (await import('./collections/Posts/conditions/showAdvanced.js')) as {
      showAdvanced: (data: unknown, sib: unknown, ctx: unknown) => boolean
    }
    expect(typeof mod.showAdvanced).toBe('function')
    expect(mod.showAdvanced({ showAdvanced: true }, {}, {} as any)).toBe(true)
    expect(mod.showAdvanced({ showAdvanced: false }, {}, {} as any)).toBe(false)
    expect(mod.showAdvanced({}, {}, {} as any)).toBe(false)
  })

  it('evaluateConditions returns expected visibility for the resolved condition', async () => {
    const mod = (await import('./collections/Posts/conditions/showAdvanced.js')) as {
      showAdvanced: (data: unknown, sib: unknown, ctx: unknown) => boolean
    }
    const fields = [{ condition: mod.showAdvanced, path: 'posts.advancedNote' }]
    const visibleMap = evaluateConditions({
      context: { blockData: undefined, operation: 'update', user: null },
      data: { showAdvanced: true },
      fields,
    })
    expect(visibleMap.get('posts.advancedNote')).toBe(true)

    const hiddenMap = evaluateConditions({
      context: { blockData: undefined, operation: 'update', user: null },
      data: { showAdvanced: false },
      fields,
    })
    expect(hiddenMap.get('posts.advancedNote')).toBe(false)
  })
})
