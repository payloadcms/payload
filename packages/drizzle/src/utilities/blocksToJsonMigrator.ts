import type {
  DynamicMigrationTemplate,
  FlattenedField,
  Payload,
  PayloadRequest,
  SanitizedConfig,
} from 'payload'

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import path from 'path'
import {
  APIError,
  buildVersionCollectionFields,
  buildVersionGlobalFields,
  dynamicImport,
} from 'payload'
import { findConfig } from 'payload/node'
import { fieldShouldBeLocalized } from 'payload/shared'
import * as ts from 'typescript'

import type {
  BlocksToJsonBlockToMigrate,
  BlocksToJsonEntityToMigrate,
  BlocksToJsonMigrator,
  DrizzleAdapter,
} from '../types.js'

import { getTransaction } from './getTransaction.js'

const DEFAULT_BATCH_SIZE = 100
const TEMP_FOLDER_NAME = '.payload-blocks-migration'

const writeEntitiesToTempFile = (
  entities: BlocksToJsonEntityToMigrate[],
  tempFolderPath: string,
  batchIndex: number,
): void => {
  const filePath = path.join(tempFolderPath, `entities-batch-${batchIndex}.json`)
  writeFileSync(filePath, JSON.stringify(entities, null, 2), 'utf-8')
}

const acceptDrizzlePrompts = async <T>(
  callPrompt: () => Promise<T> | T,
  {
    silenceLogs = false,
  }: {
    silenceLogs?: boolean
  } = {},
): Promise<T> => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const write = process.stdout.write

  if (silenceLogs) {
    process.stdout.write = () => true
  }

  const promise = callPrompt()

  const interval = setInterval(
    () =>
      process.stdin.emit('keypress', '\n', {
        name: 'return',
        ctrl: false,
      }),
    25,
  )

  const res = await promise

  if (silenceLogs) {
    process.stdout.write = write
  }

  clearInterval(interval)

  return res
}

const entityHasBlocksField = (entity: { flattenedFields: FlattenedField[] }): boolean => {
  for (const field of entity.flattenedFields) {
    if (field.type === 'blocks') {
      return true
    }

    if (
      'flattenedFields' in field &&
      entityHasBlocksField({ flattenedFields: field.flattenedFields })
    ) {
      return true
    }
  }

  return false
}

const collectBlocksToMigrate = ({
  config,
  data,
  fields,
  parentAccessor,
  parentIsLocalized,
}: {
  config: SanitizedConfig
  data: any
  fields: FlattenedField[]
  parentAccessor: (number | string)[]
  parentIsLocalized: boolean
}): BlocksToJsonBlockToMigrate[] => {
  const result: BlocksToJsonBlockToMigrate[] = []

  for (const field of fields) {
    switch (field.type) {
      case 'array': {
        const arrayData = data[field.name]

        if (!Array.isArray(arrayData)) {
          continue
        }

        if (config.localization && fieldShouldBeLocalized({ field, parentIsLocalized })) {
          result.push(
            ...collectBlocksToMigrate({
              config,
              data: arrayData,
              fields: config.localization.localeCodes.map((code) => ({
                ...field,
                name: code,
                localized: false,
              })),
              parentAccessor: [...parentAccessor, field.name],
              parentIsLocalized: true,
            }),
          )

          continue
        }

        for (const [index, row] of arrayData.entries()) {
          result.push(
            ...collectBlocksToMigrate({
              config,
              data: row,
              fields: field.flattenedFields,
              parentAccessor: [...parentAccessor, field.name, index],
              parentIsLocalized,
            }),
          )
        }
        break
      }
      case 'blocks': {
        result.push({
          data: data[field.name],
          fieldAccessor: [...parentAccessor, field.name],
        })
        break
      }
      case 'group':
      case 'tab': {
        if (config.localization && fieldShouldBeLocalized({ field, parentIsLocalized })) {
          result.push(
            ...collectBlocksToMigrate({
              config,
              data: data[field.name],
              fields: config.localization.localeCodes.map((code) => ({
                ...field,
                name: code,
                localized: false,
              })),
              parentAccessor: [...parentAccessor, field.name],
              parentIsLocalized: true,
            }),
          )

          continue
        }

        result.push(
          ...collectBlocksToMigrate({
            config,
            data: data[field.name],
            fields: field.flattenedFields,
            parentAccessor: [...parentAccessor, field.name],
            parentIsLocalized,
          }),
        )
        break
      }
      default: {
        continue
      }
    }
  }

  return result
}

class BlocksToJsonMigratorImpl implements BlocksToJsonMigrator {
  private readonly batchSize: number
  private tempFolderPath: string

  constructor(
    private readonly adapter: DrizzleAdapter,
    private readonly sanitizeStatements: (args: {
      sqlExecute: string
      statements: string[]
    }) => string,
    private readonly executeMethod: string,
    batchSize?: number,
  ) {
    this.batchSize = batchSize || DEFAULT_BATCH_SIZE
    this.tempFolderPath = path.resolve(this.adapter.migrationDir, TEMP_FOLDER_NAME)
  }

  private ensureTempFolder(): void {
    if (!existsSync(this.tempFolderPath)) {
      mkdirSync(this.tempFolderPath, { recursive: true })
    }
  }

  private *fetchEntitiesFromJsonBatches(): IterableIterator<BlocksToJsonEntityToMigrate[]> {
    if (!existsSync(this.tempFolderPath)) {
      return
    }

    const files = readdirSync(this.tempFolderPath)
      .filter((file) => file.startsWith('entities-batch-') && file.endsWith('.json'))
      .sort((a, b) => {
        const aNum = parseInt(a.match(/\d+/)?.[0] || '0', 10)
        const bNum = parseInt(b.match(/\d+/)?.[0] || '0', 10)
        return aNum - bNum
      })

    for (const file of files) {
      const filePath = path.join(this.tempFolderPath, file)
      const fileContent = readFileSync(filePath, 'utf-8')
      const batchEntities = JSON.parse(fileContent) as BlocksToJsonEntityToMigrate[]
      yield batchEntities
    }
  }

  private async migrateEntities(
    entities: BlocksToJsonEntityToMigrate[],
    req: PayloadRequest,
  ): Promise<void> {
    this.adapter.blocksAsJSON = true
    this.resetSchema()
    await this.adapter.init()
    await this.adapter.connect()

    await this.syncTransactionDrizzleInstance(req)

    const totalEntities = entities.length
    let processed = 0

    for (const entity of entities) {
      switch (entity.type) {
        case 'collection': {
          await this.adapter.updateOne({
            collection: entity.slug,
            data: entity.originalData,
            joins: false,
            req,
            where: {
              id: {
                equals: entity.id,
              },
            },
          })
          break
        }
        case 'collectionVersion': {
          await this.adapter.updateVersion({
            id: entity.id,
            collection: entity.slug,
            req,
            versionData: entity.originalData as any,
          })

          break
        }
        case 'global': {
          await this.adapter.updateGlobal({
            slug: entity.slug,
            data: entity.originalData,
            req,
          })
          break
        }
        case 'globalVersion': {
          await this.adapter.updateGlobalVersion({
            id: entity.id,
            global: entity.slug,
            req,
            versionData: entity.originalData as any,
          })
          break
        }
      }

      processed++
      if (processed % this.batchSize === 0 || processed === totalEntities) {
        this.adapter.payload.logger.info(
          `Migrated ${processed}/${totalEntities} entities (${Math.round((processed / totalEntities) * 100)}%)`,
        )
      }
    }
  }

  private resetSchema() {
    this.adapter.schema = {}
    this.adapter.tables = {}
    this.adapter.indexes = new Set()
    this.adapter.foreignKeys = new Set()
    this.adapter.relations = {}
    this.adapter.rawTables = {}
    this.adapter.rawRelations = {}
    this.adapter.tableNameMap = new Map()
  }

  private async syncTransactionDrizzleInstance(req: PayloadRequest) {
    const tsx = (await getTransaction(this.adapter, req)) as any

    tsx._ = this.adapter.drizzle._
    tsx.schema = this.adapter.drizzle._
    tsx.session.schema = (this.adapter.drizzle as any).session.schema
  }

  cleanupTempFolder(): void {
    rmSync(this.tempFolderPath, { force: true, recursive: true })

    this.adapter.payload.logger.info(`Cleaned up temp folder at ${this.tempFolderPath}`)
  }

  async collectAndSaveEntitiesToBatches(
    req: PayloadRequest,
    options?: {
      batchSize?: number
    },
  ): Promise<void> {
    const batchSize = options?.batchSize ?? this.batchSize

    this.cleanupTempFolder()
    this.ensureTempFolder()

    this.adapter.blocksAsJSON = false
    this.resetSchema()
    await this.adapter.init()
    await this.adapter.connect()

    // Count total entities to migrate
    let totalExpected = 0
    for (const collection of this.adapter.payload.config.collections.filter(entityHasBlocksField)) {
      const { totalDocs } = await this.adapter.count({ collection: collection.slug })
      totalExpected += totalDocs

      if (collection.versions) {
        const { totalDocs: totalVersions } = await this.adapter.countVersions({
          collection: collection.slug,
        })
        totalExpected += totalVersions
      }
    }

    for (const globalConfig of this.adapter.payload.config.globals.filter(entityHasBlocksField)) {
      totalExpected += 1 // Global itself

      if (globalConfig.versions) {
        const { totalDocs: totalGlobalVersions } = await this.adapter.countGlobalVersions({
          global: globalConfig.slug,
        })
        totalExpected += totalGlobalVersions
      }
    }

    this.adapter.payload.logger.info(
      `Found ${totalExpected} total entities to collect and save to batches`,
    )

    let batchIndex = 0
    let currentBatch: BlocksToJsonEntityToMigrate[] = []
    let totalCollected = 0

    const flushBatch = () => {
      if (currentBatch.length > 0) {
        writeEntitiesToTempFile(currentBatch, this.tempFolderPath, batchIndex)
        const percentage =
          totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0
        this.adapter.payload.logger.info(
          `Saved batch ${batchIndex} with ${currentBatch.length} entities (${totalCollected}/${totalExpected} - ${percentage}%)`,
        )
        batchIndex++
        currentBatch = []
      }
    }

    const addEntity = (entity: BlocksToJsonEntityToMigrate) => {
      currentBatch.push(entity)
      totalCollected++
      if (currentBatch.length >= batchSize) {
        flushBatch()
      }
    }

    for (const collection of this.adapter.payload.config.collections.filter(entityHasBlocksField)) {
      let page = 1
      let hasMore = true

      while (hasMore) {
        const { docs, hasNextPage } = await this.adapter.find({
          collection: collection.slug,
          limit: batchSize,
          page,
        })

        for (const doc of docs) {
          const entity: BlocksToJsonEntityToMigrate = {
            id: doc.id,
            slug: collection.slug,
            type: 'collection',
            blocks: collectBlocksToMigrate({
              config: this.adapter.payload.config,
              data: doc,
              fields: collection.flattenedFields,
              parentAccessor: [],
              parentIsLocalized: false,
            }),
            originalData: doc,
          }

          addEntity(entity)
        }

        this.adapter.payload.logger.info(
          `Collected ${docs.length} entries from ${collection.slug} (page ${page})`,
        )

        hasMore = hasNextPage
        page++
      }

      if (collection.versions) {
        let versionPage = 1
        let hasMoreVersions = true

        while (hasMoreVersions) {
          const { docs: versionDocs, hasNextPage: hasNextVersionPage } =
            await this.adapter.findVersions({
              collection: collection.slug,
              limit: batchSize,
              page: versionPage,
            })

          for (const versionDoc of versionDocs) {
            const entity: BlocksToJsonEntityToMigrate = {
              id: versionDoc.id,
              slug: collection.slug,
              type: 'collectionVersion',
              blocks: collectBlocksToMigrate({
                config: this.adapter.payload.config,
                data: versionDoc,
                fields: buildVersionCollectionFields(this.adapter.payload.config, collection, true),
                parentAccessor: [],
                parentIsLocalized: false,
              }),
              originalData: versionDoc,
            }

            addEntity(entity)
          }

          this.adapter.payload.logger.info(
            `Collected ${versionDocs.length} versions from ${collection.slug} (page ${versionPage})`,
          )

          hasMoreVersions = hasNextVersionPage
          versionPage++
        }
      }
    }

    for (const globalConfig of this.adapter.payload.config.globals.filter(entityHasBlocksField)) {
      const globalDoc = await this.adapter.findGlobal({ slug: globalConfig.slug })

      const entity: BlocksToJsonEntityToMigrate = {
        slug: globalConfig.slug,
        type: 'global',
        blocks: collectBlocksToMigrate({
          config: this.adapter.payload.config,
          data: globalDoc,
          fields: globalConfig.flattenedFields,
          parentAccessor: [],
          parentIsLocalized: false,
        }),
        originalData: globalDoc,
      }

      addEntity(entity)
      this.adapter.payload.logger.info(`Collected global ${globalConfig.slug}`)

      if (globalConfig.versions) {
        let globalVersionPage = 1
        let hasMoreGlobalVersions = true

        while (hasMoreGlobalVersions) {
          const { docs: globalVersionDocs, hasNextPage: hasNextGlobalVersionPage } =
            await this.adapter.findGlobalVersions({
              global: globalConfig.slug,
              limit: batchSize,
              page: globalVersionPage,
            })

          for (const globalVersionDoc of globalVersionDocs) {
            const entity: BlocksToJsonEntityToMigrate = {
              id: globalVersionDoc.id,
              slug: globalConfig.slug,
              type: 'globalVersion',
              blocks: collectBlocksToMigrate({
                config: this.adapter.payload.config,
                data: globalVersionDoc,
                fields: buildVersionGlobalFields(this.adapter.payload.config, globalConfig, true),
                parentAccessor: [],
                parentIsLocalized: false,
              }),
              originalData: globalVersionDoc,
            }

            addEntity(entity)
          }

          this.adapter.payload.logger.info(
            `Collected ${globalVersionDocs.length} versions from global ${globalConfig.slug} (page ${globalVersionPage})`,
          )

          hasMoreGlobalVersions = hasNextGlobalVersionPage
          globalVersionPage++
        }
      }
    }

    flushBatch()

    this.adapter.payload.logger.info(
      `Collected total of ${totalCollected} entities across ${batchIndex} batches`,
    )
  }

  async getMigrationStatements(): Promise<{
    add: string
    remove: string
    writeDrizzleSnapshot(filePath: string): void
  }> {
    const { generateDrizzleJson, generateMigration } = this.adapter.requireDrizzleKit()

    const drizzleJsonBefore = await generateDrizzleJson(this.adapter.schema)
    this.adapter.blocksAsJSON = true
    this.resetSchema()

    await this.adapter.init()
    const drizzleJsonAfter = await generateDrizzleJson(this.adapter.schema)
    this.adapter.blocksAsJSON = false
    this.resetSchema()
    await this.adapter.init()

    const statements = await acceptDrizzlePrompts(
      () => generateMigration(drizzleJsonBefore, drizzleJsonAfter),
      {
        silenceLogs: true,
      },
    )

    const sqlExecute = `await db.${this.executeMethod}(` + 'sql`'

    return {
      add: this.sanitizeStatements({
        sqlExecute,
        statements: statements.filter((stmt) => !stmt.startsWith('DROP')),
      }),
      remove: this.sanitizeStatements({
        sqlExecute,
        statements: [...statements.filter((stmt) => stmt.startsWith('DROP'))],
      }),
      writeDrizzleSnapshot(filePath) {
        writeFileSync(`${filePath}.json`, JSON.stringify(drizzleJsonAfter, null, 2))
      },
    }
  }

  async migrateEntitiesFromTempFolder(
    req: PayloadRequest,
    options?: {
      clearBatches?: boolean
    },
  ): Promise<void> {
    const clearBatches = options?.clearBatches ?? true

    let totalEntities = 0
    let hasEntities = false

    for (const entities of this.fetchEntitiesFromJsonBatches()) {
      hasEntities = true
      totalEntities += entities.length

      this.adapter.payload.logger.info(
        `Migrating batch with ${entities.length} entities (total: ${totalEntities})`,
      )

      await this.migrateEntities(entities, req)
    }

    if (!hasEntities) {
      this.adapter.payload.logger.warn('No entities found in temp folder to migrate')
      return
    }

    this.adapter.payload.logger.info(
      `Completed migration of ${totalEntities} entities from temp folder`,
    )

    if (clearBatches) {
      this.cleanupTempFolder()
    } else {
      this.adapter.payload.logger.info(
        `Temp folder preserved at ${this.tempFolderPath} (clearBatches: false)`,
      )
    }
  }

  setTempFolder(tempFolderPath: string): void {
    this.tempFolderPath = tempFolderPath
  }

  async updatePayloadConfigFile(): Promise<void> {
    let configPath: string

    try {
      configPath = findConfig()
    } catch {
      this.adapter.payload.logger.info(
        'updatePayloadConfigFile failed - could not find the payload config. Please set the blocksAsJSON DB adapter property manually to "true"',
      )
      return
    }

    const configFile = readFileSync(configPath, 'utf-8')

    const source = ts.createSourceFile(configPath, configFile, ts.ScriptTarget.ESNext)

    let hadChanges = false

    const result = ts.transform(source, [
      (ctx) => (sourceFile) => {
        const factory = ctx.factory

        const visit: ts.Visitor = (node) => {
          if (
            ts.isPropertyAssignment(node) &&
            ts.isIdentifier(node.name) &&
            node.name.text === 'db' &&
            ts.isCallExpression(node.initializer) &&
            node.initializer.arguments.length > 0 &&
            ts.isObjectLiteralExpression(node.initializer.arguments[0])
          ) {
            const call = node.initializer
            const obj = node.initializer.arguments[0]

            const filteredProps = obj.properties.filter((prop) => {
              if (!ts.isPropertyAssignment(prop)) {
                return true
              }

              return !(ts.isIdentifier(prop.name) && prop.name.text === 'blocksAsJSON')
            })

            const newProperty = factory.createPropertyAssignment(
              'blocksAsJSON',
              factory.createTrue(),
            )
            hadChanges = true
            const newObject = factory.updateObjectLiteralExpression(obj, [
              ...filteredProps,
              newProperty,
            ])

            const newCall = factory.updateCallExpression(
              call,
              call.expression,
              call.typeArguments,
              [newObject],
            )

            return factory.updatePropertyAssignment(node, node.name, newCall)
          }

          return ts.visitEachChild(node, visit, ctx)
        }

        return ts.visitNode(sourceFile, visit) as ts.SourceFile
      },
    ])

    if (!hadChanges) {
      this.adapter.payload.logger.info(
        'No changes made to payload config. Set blocksAsJSON to true manually.',
      )
      return
    }

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
    let output = printer.printFile(result.transformed[0])

    try {
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      const prettier = await dynamicImport<typeof import('prettier')>('prettier')
      const configPath = await prettier.resolveConfigFile()
      const config = configPath ? await prettier.resolveConfig(configPath) : {}
      output = await prettier.format(output, { ...config, parser: 'typescript' })
    } catch (err) {
      this.adapter.payload.logger.error({
        err,
        msg: 'Could not format payload config with Prettier',
      })
    }

    writeFileSync(configPath, output, 'utf-8')
    this.adapter.payload.logger.info(`Updated ${configPath} with blocksAsJSON: true`)
  }
}

export const createBlocksToJsonMigrator = ({
  adapter,
  executeMethod,
  sanitizeStatements,
}: {
  adapter: DrizzleAdapter
  executeMethod: string
  sanitizeStatements: (args: { sqlExecute: string; statements: string[] }) => string
}): BlocksToJsonMigrator => {
  return new BlocksToJsonMigratorImpl(adapter, sanitizeStatements, executeMethod)
}

export const getBlocksToJsonMigrator = (payload: Payload): BlocksToJsonMigrator => {
  const migrator = (payload.db as DrizzleAdapter).blocksToJsonMigrator

  if (!migrator) {
    throw new APIError(`blocksToJsonMigrator is not defined for ${payload.db.packageName}`)
  }

  return migrator
}

export const buildDynamicPredefinedBlocksToJsonMigration = ({
  packageName,
}: {
  packageName: string
}): DynamicMigrationTemplate => {
  return async ({ filePath, payload }) => {
    const migrator = getBlocksToJsonMigrator(payload)

    const migrationStatements = await migrator.getMigrationStatements()

    migrationStatements.writeDrizzleSnapshot(filePath)

    await migrator.updatePayloadConfigFile()
    const upSQL = `
const migrator = getBlocksToJsonMigrator(payload)
migrator.setTempFolder(TEMP_FOLDER)
await migrator.collectAndSaveEntitiesToBatches(req, { batchSize: BATCH_SIZE })

${migrationStatements.add}
payload.logger.info("Executed ADD statements for blocks-as-json migration")

await migrator.migrateEntitiesFromTempFolder(req, { clearBatches: true })

${migrationStatements.remove}
payload.logger.info("Executed REMOVE statements for blocks-as-json migration")
  `

    return {
      imports: `
import { getBlocksToJsonMigrator } from '${packageName}/migration-utils'
import { fileURLToPath } from 'url'
import path from 'path'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Configure migration options (optional)
const BATCH_SIZE = 100 // Number of entities to process per batch
const TEMP_FOLDER = path.resolve(dirname, '${TEMP_FOLDER_NAME}') // Folder path to store migration batch
`,
      upSQL,
    }
  }
}
