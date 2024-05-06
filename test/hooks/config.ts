import type { SanitizedConfig } from 'payload/config'

import { APIError } from 'payload/errors'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import AfterOperation from './collections/AfterOperation/index.js'
import ChainingHooks from './collections/ChainingHooks/index.js'
import ContextHooks from './collections/ContextHooks/index.js'
import { DataHooks } from './collections/Data/index.js'
import Hooks, { hooksSlug } from './collections/Hook/index.js'
import NestedAfterReadHooks from './collections/NestedAfterReadHooks/index.js'
import Relations from './collections/Relations/index.js'
import TransformHooks from './collections/Transform/index.js'
import Users, { seedHooksUsers } from './collections/Users/index.js'
import { DataHooksGlobal } from './globals/Data/index.js'
export const HooksConfig: Promise<SanitizedConfig> = buildConfigWithDefaults({
  collections: [
    AfterOperation,
    ContextHooks,
    TransformHooks,
    Hooks,
    NestedAfterReadHooks,
    ChainingHooks,
    Relations,
    Users,
    DataHooks,
  ],
  globals: [DataHooksGlobal],
  endpoints: [
    {
      path: '/throw-to-after-error',
      method: 'get',
      handler: () => {
        throw new APIError("I'm a teapot", 418)
      },
    },
    {
      path: '/before-endpoint',
      method: 'get',
      handler: (req) => {
        return Response.json({ beforeEndpoint: !!req.headers.get('beforeEndpoint') })
      },
    },
    {
      path: '/before-endpoint-payload-request',
      method: 'get',
      handler: (req) => {
        return Response.json({
          beforeEndpointPayloadRequest: !!req.headers.get('beforeEndpointPayloadRequest'),
        })
      },
    },
    {
      path: '/after-endpoint',
      method: 'get',
      handler: () => {
        return Response.json({})
      },
    },
  ],
  hooks: {
    afterError: () => console.log('Running afterError hook'),
    beforeEndpoint: [
      ({ req }) => {
        if (new URL(req.url).pathname.startsWith('/api/before-endpoint')) console.log('yess')
        req.headers.set('beforeEndpoint', 'true')
        return req
      },
    ],
    beforeEndpointPayloadRequest: [
      ({ req }) => {
        if (req.pathname.startsWith('/api/before-endpoint-payload-request'))
          req.headers.set('beforeEndpointPayloadRequest', 'true')
        return req
      },
    ],
    afterEndpoint: [
      async ({ req, res }) => {
        if (!req.pathname.startsWith('/api/after-endpoint')) return res
        const json = await res.json()
        json.afterEndpoint = true

        return Response.json(json, {
          headers: res.headers,
        })
      },
    ],
  },
  onInit: async (payload) => {
    await seedHooksUsers(payload)
    await payload.create({
      collection: hooksSlug,
      data: {
        check: 'update',
        fieldBeforeValidate: false,
        collectionBeforeValidate: false,
        fieldBeforeChange: false,
        collectionBeforeChange: false,
        fieldAfterChange: false,
        collectionAfterChange: false,
        collectionBeforeRead: false,
        fieldAfterRead: false,
        collectionAfterRead: false,
      },
    })
  },
})

export default HooksConfig
