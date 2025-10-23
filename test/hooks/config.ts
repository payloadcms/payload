import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import type { SanitizedConfig } from 'payload'

import { APIError } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { AfterOperationCollection } from './collections/AfterOperation/index.js'
import { BeforeChangeHooks } from './collections/BeforeChange/index.js'
import { BeforeValidateCollection } from './collections/BeforeValidate/index.js'
import ChainingHooks from './collections/ChainingHooks/index.js'
import ContextHooks from './collections/ContextHooks/index.js'
import { DataHooks } from './collections/Data/index.js'
import { FieldPaths } from './collections/FieldPaths/index.js'
import Hooks, { hooksSlug } from './collections/Hook/index.js'
import NestedAfterReadHooks from './collections/NestedAfterReadHooks/index.js'
import Relations from './collections/Relations/index.js'
import TransformHooks from './collections/Transform/index.js'
import Users, { seedHooksUsers } from './collections/Users/index.js'
import { ValueCollection } from './collections/Value/index.js'
import { DataHooksGlobal } from './globals/Data/index.js'

export const HooksConfig: Promise<SanitizedConfig> = buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    BeforeChangeHooks,
    BeforeValidateCollection,
    AfterOperationCollection,
    ContextHooks,
    TransformHooks,
    Hooks,
    NestedAfterReadHooks,
    ChainingHooks,
    Relations,
    Users,
    DataHooks,
    FieldPaths,
    ValueCollection,
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
    afterError: [() => console.log('Running afterError hook')],
  },
  onInit: async (payload) => {
    await seedHooksUsers(payload)
    await payload.create({
      collection: hooksSlug,
      data: {
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
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

export default HooksConfig
