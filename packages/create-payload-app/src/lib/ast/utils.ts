import type { ImportDeclaration, SourceFile } from 'ts-morph'

import type { DetectionError } from './types'

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
