import { Project } from 'ts-morph'
import {
  addDatabaseAdapter,
  addStorageAdapter,
  detectPayloadConfigStructure,
  removeSharp,
  validateStructure,
} from '../payload-config'

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

    addDatabaseAdapter(sourceFile, 'mongodb', 'DATABASE_URI')

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

    addDatabaseAdapter(sourceFile, 'postgres', 'DATABASE_URI')

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

    addDatabaseAdapter(sourceFile, 'postgres', 'DATABASE_URI')

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

    addStorageAdapter(sourceFile, 'vercelBlobStorage')

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

    addStorageAdapter(sourceFile, 'r2Storage')

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

    addStorageAdapter(sourceFile, 's3Storage')

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
