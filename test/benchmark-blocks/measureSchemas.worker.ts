import type { Schema } from 'mongoose'
import type { Payload } from 'payload'

import mongoose from 'mongoose'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import os from 'node:os'
import { performance } from 'node:perf_hooks'
import process from 'node:process'

import type { BenchmarkScenarioName } from './schemaScenarios.js'

import { countUniqueReachableSchemas } from './describeMongooseSchema.js'

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
  const attribution = Object.fromEntries(
    allocationCategories.map((category) => [category, 0]),
  ) as Record<AllocationCategory, number>
  const originalSchema = mongoose.Schema
  // The wrapper applies this method with the original schema receiver below.

  const originalClone = originalSchema.prototype.clone
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

  const config = await createBenchmarkConfig({ scenario })

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

  const require = createRequire(import.meta.url)
  const mongoosePackage = require('mongoose/package.json') as { version: string }
  const payloadPackage = require('../../packages/payload/package.json') as { version: string }
  const result: WorkerResult = {
    afterDestroy,
    afterInit,
    attribution,
    beforeInit,
    environment: {
      architecture: process.arch,
      gitRevision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      mongooseVersion: mongoosePackage.version,
      nodeVersion: process.version,
      operatingSystem: `${os.platform()} ${os.release()}`,
      payloadVersion: payloadPackage.version,
    },
    initializationMs,
    reachableSchemas,
    scenario,
    schemaClones,
    schemaConstructors,
  }

  process.stdout.write(`${JSON.stringify(result)}\n`)
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
