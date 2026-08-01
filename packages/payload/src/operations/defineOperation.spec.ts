import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { z } from 'zod'

import { defineLocalAPI, defineOperation, invokeOperation } from './defineOperation.js'
import { payloadOperations } from './index.js'
import { operationsToLocalAPI } from './localAPI.js'
import { operationsToRESTEndpoints } from './rest.js'

describe('Payload operations', () => {
  it('uses one unique semantic identity per registered operation', () => {
    const identities = payloadOperations.map(({ action, target }) => `${target}:${action}`)

    expect(new Set(identities).size).toBe(identities.length)
  })

  it('validates input before invoking the shared handler', async () => {
    const handler = vi.fn(async (value: number, input: { increment: number }) => {
      return value + input.increment
    })
    const operation = defineOperation({
      action: 'add',
      handler,
      input: z.object({ increment: z.number().int().positive() }),
      target: 'root',
    })

    await expect(
      invokeOperation(operation, {
        context: 2,
        input: { increment: 3 },
      }),
    ).resolves.toBe(5)
    await expect(
      invokeOperation(operation, {
        context: 2,
        input: { increment: -1 },
      }),
    ).rejects.toThrow()
    expect(handler).toHaveBeenCalledOnce()
  })

  it('can deliberately bypass validation for backwards-compatible adapters', async () => {
    const handler = vi.fn(async (_context: undefined, input: { value: number }) => input.value)
    const operation = defineOperation({
      action: 'unvalidated',
      handler,
      input: z.object({ value: z.number().positive() }),
      target: 'root',
    })

    await expect(
      invokeOperation(operation, {
        context: undefined,
        input: { value: -1 },
        validate: false,
      }),
    ).resolves.toBe(-1)
  })

  it('materializes Local API methods from operation exposures', async () => {
    const context = { prefix: 'hello' }
    const handler = vi.fn(async (operationContext: typeof context, input: { name: string }) => {
      return `${operationContext.prefix} ${input.name}`
    })
    const local = defineLocalAPI()({
      name: 'greet',
      afterHandler: ({ result }: { result: string }) => result.toUpperCase(),
    })
    const operation = defineOperation({
      action: 'greet',
      expose: { local },
      handler,
      input: z.object({ name: z.string() }),
      target: 'root',
    })

    const localAPI = operationsToLocalAPI({
      context,
      operations: [operation],
    })

    expectTypeOf(localAPI.greet).toEqualTypeOf<(input: { name: string }) => Promise<string>>()
    await expect(localAPI.greet({ name: 'world' })).resolves.toBe('HELLO WORLD')
    expect(handler).toHaveBeenCalledWith(context, { name: 'world' })
  })

  it('materializes REST endpoints from operation exposures', () => {
    const operation = defineOperation({
      action: 'rest',
      expose: {
        rest: [
          {
            handler: async () => Response.json({ ok: true }),
            method: 'post',
            path: '/',
          },
        ],
      },
      handler: async (_context: undefined, input: { value: string }) => input.value,
      input: z.object({ value: z.string() }),
      target: 'root',
    })

    const endpoints = operationsToRESTEndpoints([operation], 'root')

    expect(endpoints).toHaveLength(1)
    expect(endpoints[0]).toMatchObject({ method: 'post', path: '/' })
  })

  it('preserves operation order for REST route precedence', () => {
    const createRESTOperation = (action: string, path: string) =>
      defineOperation({
        action,
        expose: { rest: [{ method: 'get', path }] },
        handler: async () => undefined,
        input: z.object({}),
        target: 'root',
      })
    const versions = createRESTOperation('versions', '/versions')
    const findByID = createRESTOperation('findByID', '/:id')

    const endpoints = operationsToRESTEndpoints([versions, findByID], 'root')

    expect(endpoints.map(({ path }) => path)).toEqual(['/versions', '/:id'])
  })
})
