import { Project } from 'ts-morph'
import {
  addDatabaseAdapter,
  addStorageAdapter,
  detectPayloadConfigStructure,
  removeSharp,
  validateStructure,
  writeTransformedFile,
} from '../payload-config'
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
})

describe('addDatabaseAdapter', () => {
  it('adds mongodb adapter with import and config', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'payload.config.ts',
      `import { buildConfig } from 'payload'

export default buildConfig({
  collections: []
})`,
    )

    addDatabaseAdapter({ sourceFile, adapter: 'mongodb', envVarName: 'DATABASE_URI' })

    const text = sourceFile.getText()
    expect(text).toMatch(/import.*mongooseAdapter.*from.*@payloadcms\/db-mongodb/)
    expect(text).toContain('db: mongooseAdapter')
    expect(text).toContain('process.env.DATABASE_URI')
  })

  it('adds postgres adapter', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'payload.config.ts',
      `import { buildConfig } from 'payload'

export default buildConfig({
  collections: []
})`,
    )

    addDatabaseAdapter({ sourceFile, adapter: 'postgres', envVarName: 'DATABASE_URI' })

    const text = sourceFile.getText()
    expect(text).toMatch(/import.*postgresAdapter.*from.*@payloadcms\/db-postgres/)
    expect(text).toContain('db: postgresAdapter')
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

    addDatabaseAdapter({ sourceFile, adapter: 'postgres', envVarName: 'DATABASE_URI' })

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

    addStorageAdapter({ sourceFile, adapter: 'vercelBlobStorage' })

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

    addStorageAdapter({ sourceFile, adapter: 'r2Storage' })

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

    addStorageAdapter({ sourceFile, adapter: 's3Storage' })

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

    removeSharp(sourceFile)

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

    const originalText = sourceFile.getText()
    removeSharp(sourceFile)

    expect(sourceFile.getText()).toBe(originalText)
  })
})

describe('validateStructure', () => {
  it('validates correct structure', () => {
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

    const result = validateStructure(sourceFile)

    expect(result.success).toBe(true)
  })

  it('fails when buildConfig missing', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile('payload.config.ts', `export default {}`)

    const result = validateStructure(sourceFile)

    expect(result.success).toBe(false)
    expect(result.error?.userMessage).toContain('buildConfig')
  })

  it('fails when db property missing', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'payload.config.ts',
      `import { buildConfig } from 'payload'

export default buildConfig({
  collections: []
})`,
    )

    const result = validateStructure(sourceFile)

    expect(result.success).toBe(false)
    expect(result.error?.userMessage).toContain('db')
  })
})

describe('writeTransformedFile', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'payload-test-'))
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('writes file and validates structure', async () => {
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

    // Change to real file system
    const realFilePath = path.join(tempDir, 'payload.config.ts')
    const realProject = new Project()
    const realSourceFile = realProject.createSourceFile(realFilePath, sourceFile.getText())

    const result = await writeTransformedFile(realSourceFile, {
      validateStructure: true,
      formatWithPrettier: false, // Skip prettier for test
    })

    expect(result.success).toBe(true)
    expect(fs.existsSync(realFilePath)).toBe(true)
  })

  it('fails when validation fails', async () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'payload.config.ts',
      `import { buildConfig } from 'payload'

export default buildConfig({
  collections: []
})`,
    )

    const realFilePath = path.join(tempDir, 'payload.config.ts')
    const realProject = new Project()
    const realSourceFile = realProject.createSourceFile(realFilePath, sourceFile.getText())

    const result = await writeTransformedFile(realSourceFile, {
      validateStructure: true,
    })

    expect(result.success).toBe(false)
    expect(result.error?.userMessage).toContain('db')
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

    const { configurePayloadConfig } = await import('../payload-config')
    const result = await configurePayloadConfig(filePath, {
      db: { type: 'postgres', envVarName: 'DATABASE_URL' },
      storage: 'vercelBlobStorage',
      formatWithPrettier: false,
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

    const { configurePayloadConfig } = await import('../payload-config')
    const result = await configurePayloadConfig(filePath, {
      db: { type: 'mongodb', envVarName: 'MONGO_URL' },
      formatWithPrettier: false,
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

    const { configurePayloadConfig } = await import('../payload-config')
    const result = await configurePayloadConfig(filePath, {
      removeSharp: true,
      formatWithPrettier: false,
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

    const { configurePayloadConfig } = await import('../payload-config')
    const result = await configurePayloadConfig(filePath, {
      db: { type: 'postgres', envVarName: 'DATABASE_URL' },
      formatWithPrettier: false,
    })

    expect(result.success).toBe(false)
    expect(result.error?.userMessage).toContain('buildConfig')
  })

  it('handles file not found error', async () => {
    const filePath = path.join(tempDir, 'nonexistent.ts')

    const { configurePayloadConfig } = await import('../payload-config')
    const result = await configurePayloadConfig(filePath, {
      db: { type: 'postgres', envVarName: 'DATABASE_URL' },
      formatWithPrettier: false,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})
