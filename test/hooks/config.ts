import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { APIError, type SanitizedConfig } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { AfterOperationCollection } from './collections/AfterOperation/index.js'
import { AfterReadCollection } from './collections/AfterRead/index.js'
import { BeforeChangeHooks } from './collections/BeforeChange/index.js'
import {
  BeforeDelete2Collection,
  BeforeDeleteCollection,
} from './collections/BeforeDelete/index.js'
import { BeforeOperationCollection } from './collections/BeforeOperation/index.js'
import { BeforeValidateCollection } from './collections/BeforeValidate/index.js'
import ChainingHooks from './collections/ChainingHooks/index.js'
import ContextHooks from './collections/ContextHooks/index.js'
import { DataHooks } from './collections/Data/index.js'
import Hooks, { hooksSlug } from './collections/Hook/index.js'
import NestedAfterChangeHooks from './collections/NestedAfterChangeHook/index.js'
import NestedAfterReadHooks from './collections/NestedAfterReadHooks/index.js'
import { OverrideAccessCollection } from './collections/OverrideAccess/index.js'
import Relations from './collections/Relations/index.js'
import TransformHooks from './collections/Transform/index.js'
import Users, { seedHooksUsers } from './collections/Users/index.js'
import { ValueCollection } from './collections/Value/index.js'
import { DataHooksGlobal } from './globals/Data/index.js'

export const HooksConfig: Promise<SanitizedConfig> = buildConfigWithDefaults({
  suite: 'hooks',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      BeforeOperationCollection,
      BeforeChangeHooks,
      BeforeValidateCollection,
      AfterOperationCollection,
      ContextHooks,
      TransformHooks,
      Hooks,
      NestedAfterReadHooks,
      NestedAfterChangeHooks,
      ChainingHooks,
      Relations,
      Users,
      DataHooks,
      BeforeDeleteCollection,
      BeforeDelete2Collection,
      ValueCollection,
      AfterReadCollection,
      OverrideAccessCollection,
    ],
    endpoints: [
      {
        handler: () => {
          throw new APIError("I'm a teapot", 418)
        },
        method: 'get',
        path: '/throw-to-after-error',
      },
    ],
    globals: [DataHooksGlobal],
    hooks: {
      afterError: [() => console.log('Running afterError hook')],
    },
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed: async (payload) => {
    await seedHooksUsers(payload)
    await payload.create({
      collection: hooksSlug,
      data: {
        collectionAfterChange: false,
        collectionAfterRead: false,
        collectionBeforeChange: false,
        collectionBeforeRead: false,
        collectionBeforeValidate: false,
        fieldAfterChange: false,
        fieldAfterRead: false,
        fieldBeforeChange: false,
        fieldBeforeValidate: false,
      },
    })
  },
})

export default HooksConfig
