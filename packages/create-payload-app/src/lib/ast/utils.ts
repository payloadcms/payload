import type { ImportDeclaration, SourceFile } from 'ts-morph'

import type { DetectionError } from './types.js'

export function findImportDeclaration(
  sourceFile: SourceFile,
  moduleSpecifier: string,
): ImportDeclaration | undefined {
  return sourceFile
    .getImportDeclarations()
    .find((imp) => imp.getModuleSpecifierValue() === moduleSpecifier)
}

interface FormatErrorOptions {
  actual: string
  context: string
  debugInfo?: Record<string, unknown>
  expected: string
  technicalDetails: string
}

export function formatError(options: FormatErrorOptions): DetectionError {
  const { actual, context, debugInfo, expected, technicalDetails } = options

  const userMessage = `Your config file doesn't match the expected structure for ${context}.

Expected: ${expected}
Actual: ${actual}

Please ensure your config file follows the expected structure.`

  return {
    technicalDetails,
    userMessage,
    ...(debugInfo && { debugInfo }),
  }
}

interface AddImportOptions {
  defaultImport?: string
  moduleSpecifier: string
  namedImports?: string[]
}

export function addImportDeclaration(sourceFile: SourceFile, options: AddImportOptions): void {
  const { defaultImport, moduleSpecifier, namedImports } = options

  const existingImport = findImportDeclaration(sourceFile, moduleSpecifier)

  if (existingImport) {
    // Add named imports to existing import if they don't exist
    if (namedImports) {
      const existingNamedImports = existingImport.getNamedImports().map((ni) => ni.getName())
      const newNamedImports = namedImports.filter((ni) => !existingNamedImports.includes(ni))

      if (newNamedImports.length > 0) {
        existingImport.addNamedImports(newNamedImports)
      }
    }
  } else {
    // Create new import
    sourceFile.addImportDeclaration({
      moduleSpecifier,
      ...(namedImports && { namedImports }),
      ...(defaultImport && { defaultImport }),
    })
  }
}

export function removeImportDeclaration(sourceFile: SourceFile, moduleSpecifier: string): void {
  const importDecl = findImportDeclaration(sourceFile, moduleSpecifier)
  if (importDecl) {
    importDecl.remove()
  }
}
