import type { SanitizedConfig } from '../../packages/payload/src/config/types'

import { APIError } from '../../packages/payload/src/errors'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import AfterOperation from './collections/AfterOperation'
import ChainingHooks from './collections/ChainingHooks'
import ContextHooks from './collections/ContextHooks'
import { DataHooks } from './collections/Data'
import Hooks, { hooksSlug } from './collections/Hook'
import NestedAfterReadHooks from './collections/NestedAfterReadHooks'
import Relations from './collections/Relations'
import TransformHooks from './collections/Transform'
import Users, { seedHooksUsers } from './collections/Users'
import { DataHooksGlobal } from './globals/Data'
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
  ],
  hooks: {
    afterError: () => console.log('Running afterError hook'),
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
