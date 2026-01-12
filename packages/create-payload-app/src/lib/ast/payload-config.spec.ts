import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Project } from 'ts-morph'
import {
  addDatabaseAdapter,
  addStorageAdapter,
  detectPayloadConfigStructure,
  removeSharp,
} from './payload-config'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

describe('detectPayloadConfigStructure', () => {
  it('successfully detects buildConfig call', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'payload.config.ts',
      `import { buildConfig } from 'payload'

export default buildConfig({
  db: mongooseAdapter({ url: '' }),
  plugins: []
})`,
    )

    const result = detectPayloadConfigStructure(sourceFile)

    expect(result.success).toBe(true)
    expect(result.structures?.buildConfigCall).toBeDefined()
  })

  it('fails when buildConfig call not found', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile('payload.config.ts', `export default {}`)

    const result = detectPayloadConfigStructure(sourceFile)

    expect(result.success).toBe(false)
    expect(result.error?.userMessage).toContain('buildConfig')
    expect(result.error?.technicalDetails).toContain('CallExpression')
  })

  it('detects buildConfig in variable declaration', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'payload.config.ts',
      `import { buildConfig } from 'payload'

const config = buildConfig({
  db: mongooseAdapter({ url: '' })
})

export default config`,
    )

    const result = detectPayloadConfigStructure(sourceFile)

    expect(result.success).toBe(true)
    expect(result.structures?.buildConfigCall).toBeDefined()
  })

  it('detects import alias edge case', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'payload.config.ts',
      `import { buildConfig as createConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'

export default createConfig({
  db: mongooseAdapter({ url: '' }),
  collections: [],
})`,
    )

    const result = detectPayloadConfigStructure(sourceFile)

    expect(result.success).toBe(true)
    expect(result.edgeCases?.hasImportAlias).toBe(true)
    expect(result.structures?.buildConfigCall).toBeDefined()
  })

  it('detects multiple buildConfig calls', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'payload.config.ts',
      `import { buildConfig } from 'payload'

const helper = buildConfig({ collections: [] })

export default buildConfig({
  collections: [],
})`,
    )

    const result = detectPayloadConfigStructure(sourceFile)

    expect(result.success).toBe(true)
    expect(result.edgeCases?.multipleBuildConfigCalls).toBe(true)
  })

  it('detects other Payload imports', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'payload.config.ts',
      `import { buildConfig, CollectionConfig } from 'payload'

export default buildConfig({
  collections: [],
})`,
    )

    const result = detectPayloadConfigStructure(sourceFile)

    expect(result.success).toBe(true)
    expect(result.edgeCases?.hasOtherPayloadImports).toBe(true)
  })
})

describe('addDatabaseAdapter', () => {
  it.each([
    {
      adapter: 'mongodb' as const,
      adapterName: 'mongooseAdapter',
      packageName: '@payloadcms/db-mongodb',
    },
    {
      adapter: 'postgres' as const,
      adapterName: 'postgresAdapter',
      packageName: '@payloadcms/db-postgres',
    },
  ])('adds $adapter adapter with import and config', ({ adapter, adapterName, packageName }) => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'payload.config.ts',
      `import { buildConfig } from 'payload'

export default buildConfig({
  collections: []
})`,
    )

    const result = addDatabaseAdapter({
      sourceFile,
      adapter,
      envVarName: 'DATABASE_URL',
    })

    expect(result.success).toBe(true)
    expect(result.modified).toBe(true)
    expect(result.modifications.length).toBeGreaterThan(0)

    const text = sourceFile.getText()
    expect(text).toMatch(
      new RegExp(`import.*${adapterName}.*from.*${packageName.replace('/', '\\/')}`),
    )
    expect(text).toContain(`db: ${adapterName}`)
    expect(text).toContain('process.env.DATABASE_URL')
  })

  it('replaces existing db adapter', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'payload.config.ts',
      `import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'

export default buildConfig({
  db: mongooseAdapter({ url: '' }),
  collections: []
})`,
    )

    const result = addDatabaseAdapter({
      sourceFile,
      adapter: 'postgres',
      envVarName: 'DATABASE_URL',
    })

    expect(result.success).toBe(true)
    const text = sourceFile.getText()
    expect(text).toMatch(/import.*postgresAdapter.*from.*@payloadcms\/db-postgres/)
    expect(text).toContain('db: postgresAdapter')
    expect(text).not.toContain('mongooseAdapter')
    expect(text).not.toContain('@payloadcms/db-mongodb')
  })
})

describe('addStorageAdapter', () => {
  it('adds vercelBlobStorage adapter to plugins array', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'payload.config.ts',
      `import { buildConfig } from 'payload'

export default buildConfig({
  plugins: []
})`,
    )

    const result = addStorageAdapter({ sourceFile, adapter: 'vercelBlobStorage' })

    expect(result.success).toBe(true)
    expect(result.modified).toBe(true)
    const text = sourceFile.getText()
    expect(text).toMatch(/import.*vercelBlobStorage.*from.*@payloadcms\/storage-vercel-blob/)
    expect(text).toContain('vercelBlobStorage(')
  })

  it('creates plugins array if missing', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'payload.config.ts',
      `import { buildConfig } from 'payload'

export default buildConfig({
  collections: []
})`,
    )

    const result = addStorageAdapter({ sourceFile, adapter: 'r2Storage' })

    expect(result.success).toBe(true)
    const text = sourceFile.getText()
    expect(text).toContain('plugins: [')
    expect(text).toContain('r2Storage(')
  })

  it('adds to existing plugins array', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'payload.config.ts',
      `import { buildConfig } from 'payload'

export default buildConfig({
  plugins: [
    someOtherPlugin()
  ]
})`,
    )

    const result = addStorageAdapter({ sourceFile, adapter: 's3Storage' })

    expect(result.success).toBe(true)
    const text = sourceFile.getText()
    expect(text).toContain('someOtherPlugin()')
    expect(text).toContain('s3Storage(')
  })
})

describe('removeSharp', () => {
  it('removes sharp import and property', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'payload.config.ts',
      `import { buildConfig } from 'payload'
import sharp from 'sharp'

export default buildConfig({
  sharp,
  collections: []
})`,
    )

    const result = removeSharp(sourceFile)

    expect(result.success).toBe(true)
    expect(result.modified).toBe(true)
    expect(result.modifications.length).toBeGreaterThan(0)
    const text = sourceFile.getText()
    expect(text).not.toContain("import sharp from 'sharp'")
    expect(text).not.toContain('sharp,')
  })

  it('does nothing if sharp not present', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'payload.config.ts',
      `import { buildConfig } from 'payload'

export default buildConfig({
  collections: []
})`,
    )

    const result = removeSharp(sourceFile)

    expect(result.success).toBe(true)
    expect(result.modified).toBe(false)
  })
})

describe('configurePayloadConfig', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'payload-test-'))
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('applies all transformations in one call (db + storage)', async () => {
    const filePath = path.join(tempDir, 'payload.config.ts')
    fs.writeFileSync(
      filePath,
      `import { buildConfig } from 'payload'

export default buildConfig({
  collections: []
})`,
    )

    const { configurePayloadConfig } = await import('./payload-config')
    const result = await configurePayloadConfig(filePath, {
      db: { type: 'postgres', envVarName: 'DATABASE_URL' },
      storage: 'vercelBlobStorage',
    })

    expect(result.success).toBe(true)

    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain('postgresAdapter')
    expect(content).toContain('vercelBlobStorage')
    expect(content).toContain('DATABASE_URL')
  })

  it('applies db transformation only', async () => {
    const filePath = path.join(tempDir, 'payload.config.ts')
    fs.writeFileSync(
      filePath,
      `import { buildConfig } from 'payload'

export default buildConfig({
  collections: []
})`,
    )

    const { configurePayloadConfig } = await import('./payload-config')
    const result = await configurePayloadConfig(filePath, {
      db: { type: 'mongodb', envVarName: 'MONGO_URL' },
    })

    expect(result.success).toBe(true)

    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain('mongooseAdapter')
    expect(content).toContain('MONGO_URL')
  })

  it('applies removeSharp transformation', async () => {
    const filePath = path.join(tempDir, 'payload.config.ts')
    fs.writeFileSync(
      filePath,
      `import { buildConfig } from 'payload'
import sharp from 'sharp'
import { mongooseAdapter } from '@payloadcms/db-mongodb'

export default buildConfig({
  db: mongooseAdapter({ url: '' }),
  sharp,
  collections: []
})`,
    )

    const { configurePayloadConfig } = await import('./payload-config')
    const result = await configurePayloadConfig(filePath, {
      removeSharp: true,
    })

    expect(result.success).toBe(true)

    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).not.toContain("import sharp from 'sharp'")
    expect(content).not.toContain('sharp,')
  })

  it('handles transformation errors gracefully', async () => {
    const filePath = path.join(tempDir, 'payload.config.ts')
    fs.writeFileSync(
      filePath,
      `export default {}`, // Invalid structure
    )

    const { configurePayloadConfig } = await import('./payload-config')
    const result = await configurePayloadConfig(filePath, {
      db: { type: 'postgres', envVarName: 'DATABASE_URL' },
    })

    expect(result.success).toBe(false)
    expect(result.error?.userMessage).toContain('buildConfig')
  })

  it('handles file not found error', async () => {
    const filePath = path.join(tempDir, 'nonexistent.ts')

    const { configurePayloadConfig } = await import('./payload-config')
    const result = await configurePayloadConfig(filePath, {
      db: { type: 'postgres', envVarName: 'DATABASE_URL' },
    })

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('replaces adapter in config file', async () => {
    const filePath = path.join(tempDir, 'payload.config.ts')
    fs.writeFileSync(
      filePath,
      `import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'

export default buildConfig({
  db: mongooseAdapter({ url: process.env.DATABASE_URL || '' }),
  collections: []
})`,
    )

    const { configurePayloadConfig } = await import('./payload-config')
    const result = await configurePayloadConfig(filePath, {
      db: { type: 'postgres', envVarName: 'DATABASE_URL' },
    })

    expect(result.success).toBe(true)

    // Verify config was updated
    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain('postgresAdapter')
    expect(content).toContain('@payloadcms/db-postgres')
    expect(content).not.toContain('mongooseAdapter')
    expect(content).not.toContain('@payloadcms/db-mongodb')
  })
})
