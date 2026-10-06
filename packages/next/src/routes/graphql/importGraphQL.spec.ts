import { describe, expect, it } from 'vitest'

import {
  importConfigToSchema,
  importCreateHandler,
  importOptional,
  importRenderPlaygroundPage,
} from './importGraphQL.js'

const moduleNotFound = (packageName: string) =>
  Object.assign(new Error(`Cannot find package '${packageName}' imported from /app/route.js`), {
    code: 'ERR_MODULE_NOT_FOUND',
  })

describe('importGraphQL', () => {
  describe('importOptional', () => {
    it('should return the imported module when the package is installed', async () => {
      const result = await importOptional({
        importer: () => Promise.resolve({ ok: true }),
        packageName: 'graphql-http',
      })

      expect(result).toStrictEqual({ ok: true })
    })

    it('should explain how to install the package when it is missing', async () => {
      const promise = importOptional({
        importer: () => Promise.reject(moduleNotFound('graphql-http')),
        packageName: 'graphql-http',
      })

      await expect(promise).rejects.toThrow(
        /Cannot find module 'graphql-http', required to serve GraphQL\. GraphQL is opt-in\./,
      )
    })

    it('should rethrow a missing-module error for a different package untouched', async () => {
      const err = moduleNotFound('some-transitive-dep')

      await expect(
        importOptional({
          importer: () => Promise.reject(err),
          packageName: 'graphql-http',
        }),
      ).rejects.toBe(err)
    })

    it('should rethrow a non-resolution error untouched', async () => {
      const err = new TypeError('boom')

      await expect(
        importOptional({
          importer: () => Promise.reject(err),
          packageName: 'graphql-http',
        }),
      ).rejects.toBe(err)
    })
  })

  it('should resolve configToSchema when @payloadcms/graphql is installed', async () => {
    await expect(importConfigToSchema()).resolves.toBeTypeOf('function')
  })

  it('should resolve createHandler when graphql-http is installed', async () => {
    await expect(importCreateHandler()).resolves.toBeTypeOf('function')
  })

  it('should resolve renderPlaygroundPage when graphql-playground-html is installed', async () => {
    await expect(importRenderPlaygroundPage()).resolves.toBeTypeOf('function')
  })
})
