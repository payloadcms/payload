import type { ImportDeclaration, SourceFile } from 'ts-morph'

import { existsSync } from 'fs'
import path from 'path'

import type { DetectionError } from './types.js'

import { debug } from '../../utils/log.js'

export function findImportDeclaration({
  moduleSpecifier,
  sourceFile,
}: {
  moduleSpecifier: string
  sourceFile: SourceFile
}): ImportDeclaration | undefined {
  return sourceFile
    .getImportDeclarations()
    .find((imp) => imp.getModuleSpecifierValue() === moduleSpecifier)
}

type FormatErrorOptions = {
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

export function addImportDeclaration({
  defaultImport,
  insertIndex,
  moduleSpecifier,
  namedImports,
  sourceFile,
}: {
  defaultImport?: string
  insertIndex?: number
  moduleSpecifier: string
  namedImports?: string[]
  sourceFile: SourceFile
}): void {
  const existingImport = findImportDeclaration({ moduleSpecifier, sourceFile })

  if (existingImport) {
    // Add named imports to existing import if they don't exist
    if (namedImports) {
      const existingNamedImports = existingImport.getNamedImports().map((ni) => ni.getName())
      const newNamedImports = namedImports.filter((ni) => !existingNamedImports.includes(ni))

      if (newNamedImports.length > 0) {
        existingImport.addNamedImports(newNamedImports)
        debug(
          `[AST] Added named imports to existing import from '${moduleSpecifier}': ${newNamedImports.join(', ')}`,
        )
      } else {
        debug(`[AST] Import from '${moduleSpecifier}' already has all required named imports`)
      }
    }
  } else {
    // Create new import at specified index or at default position
    const importDeclaration = {
      moduleSpecifier,
      ...(namedImports && { namedImports }),
      ...(defaultImport && { defaultImport }),
    }

    if (insertIndex !== undefined) {
      sourceFile.insertImportDeclaration(insertIndex, importDeclaration)
      debug(`[AST] Inserted import from '${moduleSpecifier}' at index ${insertIndex}`)
    } else {
      sourceFile.addImportDeclaration(importDeclaration)
      debug(`[AST] Added import from '${moduleSpecifier}' at default position`)
    }

    const parts = []
    if (defaultImport) {
      parts.push(`default: ${defaultImport}`)
    }
    if (namedImports) {
      parts.push(`named: ${namedImports.join(', ')}`)
    }
    debug(`[AST] Import contents: ${parts.join(', ')}`)
  }
}

export function removeImportDeclaration({
  moduleSpecifier,
  sourceFile,
}: {
  moduleSpecifier: string
  sourceFile: SourceFile
}): number | undefined {
  const importDecl = findImportDeclaration({ moduleSpecifier, sourceFile })
  if (importDecl) {
    // Get index before removing
    const allImports = sourceFile.getImportDeclarations()
    const index = allImports.indexOf(importDecl)
    importDecl.remove()
    debug(`[AST] Removed import from '${moduleSpecifier}' at index ${index}`)
    return index
  } else {
    debug(`[AST] Import from '${moduleSpecifier}' not found (already absent)`)
    return undefined
  }
}
