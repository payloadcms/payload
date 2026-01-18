import { describe, it, expect } from 'vitest'
import { Project } from 'ts-morph'
import {
  addImportDeclaration,
  cleanupOrphanedImports,
  findImportDeclaration,
  isNamedImportUsed,
  removeImportDeclaration,
  removeNamedImports,
} from './utils'

describe('findImportDeclaration', () => {
  it('finds import by module specifier', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { buildConfig } from '@ruya.sa/payload'
import { mongooseAdapter } from '@ruya.sa/db-mongodb'`,
    )

    const result = findImportDeclaration({ sourceFile, moduleSpecifier: '@ruya.sa/db-mongodb' })

    expect(result).toBeDefined()
    expect(result?.getModuleSpecifierValue()).toBe('@ruya.sa/db-mongodb')
  })
})

describe('addImportDeclaration', () => {
  it('adds new import when not present', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile('test.ts', `import { buildConfig } from '@ruya.sa/payload'`)

    const result = addImportDeclaration({
      sourceFile,
      moduleSpecifier: '@ruya.sa/db-postgres',
      namedImports: ['postgresAdapter'],
    })

    const imports = result.getImportDeclarations()
    expect(imports).toHaveLength(2)
    expect(imports[1].getModuleSpecifierValue()).toBe('@ruya.sa/db-postgres')
    expect(imports[1].getNamedImports()[0].getName()).toBe('postgresAdapter')
  })

  it('does not duplicate existing import', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { mongooseAdapter } from '@ruya.sa/db-mongodb'`,
    )

    const result = addImportDeclaration({
      sourceFile,
      moduleSpecifier: '@ruya.sa/db-mongodb',
      namedImports: ['mongooseAdapter'],
    })

    const imports = result.getImportDeclarations()
    expect(imports).toHaveLength(1)
  })

  it('adds named import to existing module import', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile('test.ts', `import { buildConfig } from '@ruya.sa/payload'`)

    const result = addImportDeclaration({
      sourceFile,
      moduleSpecifier: 'payload',
      namedImports: ['Field'],
    })

    const imports = result.getImportDeclarations()
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
      `import { buildConfig } from '@ruya.sa/payload'
import sharp from 'sharp'`,
    )

    const result = removeImportDeclaration({ sourceFile, moduleSpecifier: 'sharp' })

    expect(result.removedIndex).toBe(1)
    const imports = result.sourceFile.getImportDeclarations()
    expect(imports).toHaveLength(1)
    expect(imports[0].getModuleSpecifierValue()).toBe('payload')
  })

  it('returns undefined removedIndex when import not found', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile('test.ts', `import { buildConfig } from '@ruya.sa/payload'`)

    const result = removeImportDeclaration({ sourceFile, moduleSpecifier: 'sharp' })

    expect(result.removedIndex).toBeUndefined()
  })
})

describe('removeNamedImports', () => {
  it('removes specific named imports', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { mongooseAdapter, SomeOtherType } from '@ruya.sa/db-mongodb'`,
    )

    const importDecl = findImportDeclaration({
      sourceFile,
      moduleSpecifier: '@ruya.sa/db-mongodb',
    })!

    const result = removeNamedImports({
      sourceFile,
      importDeclaration: importDecl,
      namedImportsToRemove: ['mongooseAdapter'],
    })

    expect(result.fullyRemoved).toBe(false)
    const imports = result.sourceFile.getImportDeclarations()
    expect(imports).toHaveLength(1)
    const namedImports = imports[0].getNamedImports().map((ni) => ni.getName())
    expect(namedImports).toEqual(['SomeOtherType'])
  })

  it('removes entire import when no named imports remain', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { buildConfig } from '@ruya.sa/payload'
import { mongooseAdapter } from '@ruya.sa/db-mongodb'`,
    )

    const importDecl = findImportDeclaration({
      sourceFile,
      moduleSpecifier: '@ruya.sa/db-mongodb',
    })!

    const result = removeNamedImports({
      sourceFile,
      importDeclaration: importDecl,
      namedImportsToRemove: ['mongooseAdapter'],
    })

    expect(result.fullyRemoved).toBe(true)
    expect(result.index).toBe(1)
    const imports = result.sourceFile.getImportDeclarations()
    expect(imports).toHaveLength(1)
    expect(imports[0].getModuleSpecifierValue()).toBe('payload')
  })
})

describe('isNamedImportUsed', () => {
  it('detects used import in code', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { mongooseAdapter } from '@ruya.sa/db-mongodb'

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
      `import { mongooseAdapter } from '@ruya.sa/db-mongodb'
import { postgresAdapter } from '@ruya.sa/db-postgres'

export default buildConfig({
  db: postgresAdapter({ url: '' })
})`,
    )

    const isUsed = isNamedImportUsed(sourceFile, 'mongooseAdapter')

    expect(isUsed).toBe(false)
  })
})

describe('cleanupOrphanedImports', () => {
  it('removes unused imports', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { mongooseAdapter } from '@ruya.sa/db-mongodb'
import { postgresAdapter } from '@ruya.sa/db-postgres'

export default buildConfig({
  db: postgresAdapter({ url: '' })
})`,
    )

    const result = cleanupOrphanedImports({
      sourceFile,
      moduleSpecifier: '@ruya.sa/db-mongodb',
      importNames: ['mongooseAdapter'],
    })

    expect(result.removed).toEqual(['mongooseAdapter'])
    expect(result.kept).toEqual([])
    const imports = result.sourceFile.getImportDeclarations()
    expect(imports).toHaveLength(1)
    expect(imports[0].getModuleSpecifierValue()).toBe('@ruya.sa/db-postgres')
  })

  it('keeps used imports', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { mongooseAdapter } from '@ruya.sa/db-mongodb'

export default buildConfig({
  db: mongooseAdapter({ url: '' })
})`,
    )

    const result = cleanupOrphanedImports({
      sourceFile,
      moduleSpecifier: '@ruya.sa/db-mongodb',
      importNames: ['mongooseAdapter'],
    })

    expect(result.removed).toEqual([])
    expect(result.kept).toEqual(['mongooseAdapter'])
    const imports = result.sourceFile.getImportDeclarations()
    expect(imports).toHaveLength(1)
  })
})
