import { Project } from 'ts-morph'
import { findImportDeclaration, formatError } from '../utils'

describe('findImportDeclaration', () => {
  it('finds import by module specifier', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'`,
    )

    const result = findImportDeclaration(sourceFile, '@payloadcms/db-mongodb')

    expect(result).toBeDefined()
    expect(result?.getModuleSpecifierValue()).toBe('@payloadcms/db-mongodb')
  })

  it('returns undefined when import not found', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile('test.ts', `import { buildConfig } from 'payload'`)

    const result = findImportDeclaration(sourceFile, 'nonexistent')

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
