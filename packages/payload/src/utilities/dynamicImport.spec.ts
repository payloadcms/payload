import { pathToFileURL } from 'url'
import { describe, expect, it } from 'vitest'

import { buildImportExpression } from './dynamicImport.js'

describe('buildImportExpression', () => {
  // dynamicImport() uses a direct import() under Vitest, so its eval branch never runs here.
  // Parsing the expression is what the eval branch needs to succeed, and `new Function`
  // parses without executing the import.
  const parses = (expression: string) => () => new Function(`return ${expression}`)

  it.each([
    ['a plain file URL', pathToFileURL('/app/payload.config.ts').href],
    [
      'a file URL containing an apostrophe',
      pathToFileURL("/Users/O'Brien/app/payload.config.ts").href,
    ],
    ['a package specifier', '@payloadcms/db-mongodb'],
    ['a specifier containing a backslash', 'C:\\Users\\app\\payload.config.ts'],
  ])('produces a parseable import() for %s', (_label, importPath) => {
    expect(parses(buildImportExpression(importPath))).not.toThrow()
  })
})
