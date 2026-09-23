import type { Schema } from 'mongoose'
import type { Payload, SanitizedCollectionConfig, SanitizedConfig } from 'payload'
import type { SchemaBuildContextSnapshot } from 'payload/internal'

import mongoose from 'mongoose'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import os from 'node:os'
import { performance } from 'node:perf_hooks'
import process from 'node:process'

import type { BenchmarkScenarioName } from './schemaScenarios.js'

import {
  countUniqueReachableSchemas,
  describeMongooseSchema,
  type MongooseSchemaDescriptor,
} from './describeMongooseSchema.js'

type AllocationCategory =
  | 'array-group-tab'
  | 'block-template'
  | 'blocks-base'
  | 'discriminator-clone'
  | 'mongoose-internal'
  | 'top-level'
  | 'version'

export type WorkerResult = {
  afterDestroy: NodeJS.MemoryUsage
  afterInit: NodeJS.MemoryUsage
  attribution: Record<AllocationCategory, number>
  beforeInit: NodeJS.MemoryUsage
  environment: {
    architecture: string
    gitRevision: string
    mongooseVersion: string
    nodeVersion: string
    operatingSystem: string
    payloadVersion: string
  }
  initializationMs: number
  reachableSchemas: number
  scenario: BenchmarkScenarioName
  schemaClones: number
  schemaConstructors: number
}

export type AttributionWorkerResult = {
  cache: SchemaBuildContextSnapshot
  descriptors: MongooseSchemaDescriptor[]
  environment: WorkerResult['environment']
  scenario: BenchmarkScenarioName
}

const allocationCategories: AllocationCategory[] = [
  'top-level',
  'version',
  'blocks-base',
  'block-template',
  'discriminator-clone',
  'array-group-tab',
  'mongoose-internal',
]

const run = async (): Promise<void> => {
  process.env.NODE_ENV = 'production'

  const scenarioArgument = process.argv.slice(2).find((argument) => !argument.startsWith('-'))
  const { createBenchmarkConfig, isBenchmarkScenarioName } = await import('./schemaScenarios.js')

  if (!scenarioArgument || !isBenchmarkScenarioName(scenarioArgument)) {
    throw new Error(`Expected one benchmark scenario. Received "${scenarioArgument ?? ''}".`)
  }

  if (!global.gc) {
    throw new Error('The benchmark worker requires Node.js --expose-gc.')
  }

  const scenario = scenarioArgument
  const config = await createBenchmarkConfig({ scenario })

  if (process.argv.includes('--attribution')) {
    const result = await runAttribution({ config, scenario })

    process.stdout.write(`${JSON.stringify(result)}\n`)
    return
  }

  const attribution = Object.fromEntries(
    allocationCategories.map((category) => [category, 0]),
  ) as Record<AllocationCategory, number>
  const originalSchema = mongoose.Schema
  const originalClone = Reflect.get(originalSchema.prototype, 'clone')
  let schemaClones = 0
  let schemaConstructors = 0

  originalSchema.prototype.clone = function benchmarkedClone(...args) {
    schemaClones += 1
    attribution['discriminator-clone'] += 1
    return originalClone.apply(this, args)
  }

  const instrumentedSchema = new Proxy(originalSchema, {
    construct(target, args, newTarget) {
      schemaConstructors += 1
      attribution[classifyAllocation({ stack: new Error().stack })] += 1
      return Reflect.construct(target, args, newTarget)
    },
  })

  ;(mongoose as unknown as { Schema: typeof mongoose.Schema }).Schema = instrumentedSchema

  collectGarbage()
  const beforeInit = process.memoryUsage()
  const startTime = performance.now()
  const { getPayload } = await import('payload')
  const payload = await getPayload({ config, disableDBConnect: true })
  const initializationMs = performance.now() - startTime

  collectGarbage()
  const afterInit = process.memoryUsage()
  const reachableSchemas = countUniqueReachableSchemas({ schemas: getCompiledSchemas({ payload }) })

  await payload.destroy()
  collectGarbage()
  const afterDestroy = process.memoryUsage()

  const result: WorkerResult = {
    afterDestroy,
    afterInit,
    attribution,
    beforeInit,
    environment: getEnvironment(),
    initializationMs,
    reachableSchemas,
    scenario,
    schemaClones,
    schemaConstructors,
  }

  process.stdout.write(`${JSON.stringify(result)}\n`)
}

const runAttribution = async ({
  config,
  scenario,
}: {
  config: SanitizedConfig
  scenario: BenchmarkScenarioName
}): Promise<AttributionWorkerResult> => {
  const { buildVersionCollectionFields, buildVersionCompoundIndexes, buildVersionGlobalFields } =
    await import('payload')
  const { createSchemaBuildContext } = await import('payload/internal')
  const { buildCollectionSchema } = await import(
    '../../packages/db-mongodb/src/models/buildCollectionSchema.js'
  )
  const { buildSchema } = await import('../../packages/db-mongodb/src/models/buildSchema.js')
  const descriptors: MongooseSchemaDescriptor[] = []
  const schemaBuildContext = createSchemaBuildContext<Schema>({
    onEvent: (event) => {
      if (event.action === 'store' && event.schema) {
        descriptors.push(
          describeMongooseSchema({
            label: event.label,
            schema: event.schema,
            variantKey: event.variantKey,
          }),
        )
      }
    },
  })
  const payload = createPayloadFixture({ config })

  try {
    for (const collection of config.collections) {
      buildCollectionSchema({ collection, payload, schemaBuildContext })

      if (collection.versions) {
        buildSchema({
          buildSchemaOptions: {
            disableUnique: true,
            draftsEnabled: true,
            indexSortableFields: config.indexSortableFields,
            options: {
              minimize: false,
              timestamps: false,
            },
          },
          compoundIndexes: buildVersionCompoundIndexes({ indexes: collection.sanitizedIndexes }),
          configFields: buildVersionCollectionFields(config, collection),
          payload,
          schemaBuildContext,
        })
      }
    }

    for (const global of config.globals) {
      buildSchema({
        buildSchemaOptions: {
          options: {
            minimize: false,
          },
        },
        configFields: global.fields,
        payload,
        schemaBuildContext,
      })

      if (global.versions) {
        buildSchema({
          buildSchemaOptions: {
            disableUnique: true,
            draftsEnabled: true,
            indexSortableFields: config.indexSortableFields,
            options: {
              minimize: false,
              timestamps: false,
            },
          },
          configFields: buildVersionGlobalFields(config, global),
          payload,
          schemaBuildContext,
        })
      }
    }

    return {
      cache: schemaBuildContext.snapshot(),
      descriptors,
      environment: getEnvironment(),
      scenario,
    }
  } finally {
    schemaBuildContext.clear()
  }
}

const createPayloadFixture = ({ config }: { config: SanitizedConfig }): Payload =>
  ({
    blocks: Object.fromEntries(config.blocks.map((block) => [block.slug, block])),
    collections: Object.fromEntries(
      config.collections.map((collection) => [
        collection.slug,
        { customIDType: getCustomIDType({ collection }) },
      ]),
    ),
    config,
    db: {
      useBigIntForNumberIDs: false,
    },
  }) as unknown as Payload

const getCustomIDType = ({
  collection,
}: {
  collection: SanitizedCollectionConfig
}): 'number' | 'text' | undefined => {
  const idField = collection.flattenedFields.find((field) => 'name' in field && field.name === 'id')

  return idField?.type === 'number' ? 'number' : idField ? 'text' : undefined
}

const getEnvironment = (): WorkerResult['environment'] => {
  const require = createRequire(import.meta.url)
  const mongoosePackage = require('mongoose/package.json') as { version: string }
  const payloadPackage = require('../../packages/payload/package.json') as { version: string }

  return {
    architecture: process.arch,
    gitRevision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    mongooseVersion: mongoosePackage.version,
    nodeVersion: process.version,
    operatingSystem: `${os.platform()} ${os.release()}`,
    payloadVersion: payloadPackage.version,
  }
}

const classifyAllocation = ({ stack }: { stack?: string }): AllocationCategory => {
  if (!stack) {
    return 'mongoose-internal'
  }

  if (/\bat (?:array|group|tabs)\b/.test(stack)) {
    return 'array-group-tab'
  }

  if (/\bat blocks\b/.test(stack)) {
    return 'blocks-base'
  }

  if (stack.includes('/models/buildSchema.')) {
    return 'top-level'
  }

  if (stack.includes('/mongoose/')) {
    return 'mongoose-internal'
  }

  return 'mongoose-internal'
}

const collectGarbage = (): void => {
  global.gc?.()
  global.gc?.()
  global.gc?.()
}

const getCompiledSchemas = ({ payload }: { payload: Payload }): Schema[] => {
  const adapter = payload.db as unknown as {
    collections: Record<string, { schema: Schema }>
    globals?: { schema: Schema } | null
    versions: Record<string, { schema: Schema }>
  }

  return [
    ...Object.values(adapter.collections),
    ...Object.values(adapter.versions),
    ...(adapter.globals ? [adapter.globals] : []),
  ].map((model) => model.schema)
}

void run().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`)
  process.exitCode = 1
})
