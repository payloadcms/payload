import { Project } from 'ts-morph'
import {
  addImportDeclaration,
  cleanupOrphanedImports,
  findImportDeclaration,
  formatError,
  isNamedImportUsed,
  removeImportDeclaration,
  removeNamedImports,
} from './utils'

describe('findImportDeclaration', () => {
  it('finds import by module specifier', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'`,
    )

    const result = findImportDeclaration({ sourceFile, moduleSpecifier: '@payloadcms/db-mongodb' })

    expect(result).toBeDefined()
    expect(result?.getModuleSpecifierValue()).toBe('@payloadcms/db-mongodb')
  })

  it('returns undefined when import not found', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile('test.ts', `import { buildConfig } from 'payload'`)

    const result = findImportDeclaration({ sourceFile, moduleSpecifier: 'nonexistent' })

    expect(result).toBeUndefined()
  })
})

describe('formatError', () => {
  it('formats user-friendly error message', () => {
    const error = formatError({
      context: 'buildConfig call',
      expected: 'export default buildConfig({ ... })',
      actual: 'No buildConfig call found',
      technicalDetails: 'Could not find CallExpression with identifier buildConfig',
    })

    expect(error.userMessage).toContain('buildConfig call')
    expect(error.userMessage).toContain('Expected: export default buildConfig')
    expect(error.technicalDetails).toContain('CallExpression')
  })

  it('includes debug info when provided', () => {
    const error = formatError({
      context: 'test',
      expected: 'something',
      actual: 'nothing',
      technicalDetails: 'details',
      debugInfo: { line: 10, column: 5 },
    })

    expect(error.debugInfo).toEqual({ line: 10, column: 5 })
  })
})

describe('addImportDeclaration', () => {
  it('adds new import when not present', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile('test.ts', `import { buildConfig } from 'payload'`)

    addImportDeclaration({
      sourceFile,
      moduleSpecifier: '@payloadcms/db-postgres',
      namedImports: ['postgresAdapter'],
    })

    const imports = sourceFile.getImportDeclarations()
    expect(imports).toHaveLength(2)
    expect(imports[1].getModuleSpecifierValue()).toBe('@payloadcms/db-postgres')
    expect(imports[1].getNamedImports()[0].getName()).toBe('postgresAdapter')
  })

  it('does not duplicate existing import', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { mongooseAdapter } from '@payloadcms/db-mongodb'`,
    )

    addImportDeclaration({
      sourceFile,
      moduleSpecifier: '@payloadcms/db-mongodb',
      namedImports: ['mongooseAdapter'],
    })

    const imports = sourceFile.getImportDeclarations()
    expect(imports).toHaveLength(1)
  })

  it('adds named import to existing module import', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile('test.ts', `import { buildConfig } from 'payload'`)

    addImportDeclaration({
      sourceFile,
      moduleSpecifier: 'payload',
      namedImports: ['Field'],
    })

    const imports = sourceFile.getImportDeclarations()
    expect(imports).toHaveLength(1)
    const namedImports = imports[0].getNamedImports().map((ni) => ni.getName())
    expect(namedImports).toContain('buildConfig')
    expect(namedImports).toContain('Field')
  })
})

describe('removeImportDeclaration', () => {
  it('removes import by module specifier', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { buildConfig } from 'payload'
import sharp from 'sharp'`,
    )

    removeImportDeclaration({ sourceFile, moduleSpecifier: 'sharp' })

    const imports = sourceFile.getImportDeclarations()
    expect(imports).toHaveLength(1)
    expect(imports[0].getModuleSpecifierValue()).toBe('payload')
  })

  it('does nothing when import does not exist', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile('test.ts', `import { buildConfig } from 'payload'`)

    removeImportDeclaration({ sourceFile, moduleSpecifier: 'nonexistent' })

    const imports = sourceFile.getImportDeclarations()
    expect(imports).toHaveLength(1)
  })
})

describe('removeNamedImports', () => {
  it('removes specific named imports', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { mongooseAdapter, SomeOtherType } from '@payloadcms/db-mongodb'`,
    )

    const importDecl = findImportDeclaration({
      sourceFile,
      moduleSpecifier: '@payloadcms/db-mongodb',
    })!

    const result = removeNamedImports({
      sourceFile,
      importDeclaration: importDecl,
      namedImportsToRemove: ['mongooseAdapter'],
    })

    expect(result.fullyRemoved).toBe(false)
    const imports = sourceFile.getImportDeclarations()
    expect(imports).toHaveLength(1)
    const namedImports = imports[0].getNamedImports().map((ni) => ni.getName())
    expect(namedImports).toEqual(['SomeOtherType'])
  })

  it('removes entire import when no named imports remain', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'`,
    )

    const importDecl = findImportDeclaration({
      sourceFile,
      moduleSpecifier: '@payloadcms/db-mongodb',
    })!

    const result = removeNamedImports({
      sourceFile,
      importDeclaration: importDecl,
      namedImportsToRemove: ['mongooseAdapter'],
    })

    expect(result.fullyRemoved).toBe(true)
    expect(result.index).toBe(1)
    const imports = sourceFile.getImportDeclarations()
    expect(imports).toHaveLength(1)
    expect(imports[0].getModuleSpecifierValue()).toBe('payload')
  })
})

describe('isNamedImportUsed', () => {
  it('detects used import in code', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { mongooseAdapter } from '@payloadcms/db-mongodb'

export default buildConfig({
  db: mongooseAdapter({ url: '' })
})`,
    )

    const isUsed = isNamedImportUsed(sourceFile, 'mongooseAdapter')

    expect(isUsed).toBe(true)
  })

  it('detects unused import', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { postgresAdapter } from '@payloadcms/db-postgres'

export default buildConfig({
  db: postgresAdapter({ url: '' })
})`,
    )

    const isUsed = isNamedImportUsed(sourceFile, 'mongooseAdapter')

    expect(isUsed).toBe(false)
  })

  it('excludes imports from consideration by default', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { mongooseAdapter } from '@payloadcms/db-mongodb'

export default buildConfig({
  collections: []
})`,
    )

    const isUsed = isNamedImportUsed(sourceFile, 'mongooseAdapter', true)

    expect(isUsed).toBe(false)
  })
})

describe('cleanupOrphanedImports', () => {
  it('removes unused imports', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { postgresAdapter } from '@payloadcms/db-postgres'

export default buildConfig({
  db: postgresAdapter({ url: '' })
})`,
    )

    const result = cleanupOrphanedImports({
      sourceFile,
      moduleSpecifier: '@payloadcms/db-mongodb',
      importNames: ['mongooseAdapter'],
    })

    expect(result.removed).toEqual(['mongooseAdapter'])
    expect(result.kept).toEqual([])
    const imports = sourceFile.getImportDeclarations()
    expect(imports).toHaveLength(1)
    expect(imports[0].getModuleSpecifierValue()).toBe('@payloadcms/db-postgres')
  })

  it('keeps used imports', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { mongooseAdapter } from '@payloadcms/db-mongodb'

export default buildConfig({
  db: mongooseAdapter({ url: '' })
})`,
    )

    const result = cleanupOrphanedImports({
      sourceFile,
      moduleSpecifier: '@payloadcms/db-mongodb',
      importNames: ['mongooseAdapter'],
    })

    expect(result.removed).toEqual([])
    expect(result.kept).toEqual(['mongooseAdapter'])
    const imports = sourceFile.getImportDeclarations()
    expect(imports).toHaveLength(1)
  })

  it('handles mixed used and unused imports', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { mongooseAdapter, SomeType } from '@payloadcms/db-mongodb'

export default buildConfig({
  db: mongooseAdapter({ url: '' })
})

const foo: SomeType = {}`,
    )

    const result = cleanupOrphanedImports({
      sourceFile,
      moduleSpecifier: '@payloadcms/db-mongodb',
      importNames: ['mongooseAdapter', 'SomeType'],
    })

    expect(result.removed).toEqual([])
    expect(result.kept).toEqual(['mongooseAdapter', 'SomeType'])
  })

  it('handles missing import gracefully', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile('test.ts', `import { buildConfig } from 'payload'`)

    const result = cleanupOrphanedImports({
      sourceFile,
      moduleSpecifier: '@payloadcms/db-mongodb',
      importNames: ['mongooseAdapter'],
    })

    expect(result.removed).toEqual([])
    expect(result.kept).toEqual([])
  })
})
