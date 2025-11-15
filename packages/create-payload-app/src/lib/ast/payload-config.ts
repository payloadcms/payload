import { type SourceFile, SyntaxKind } from 'ts-morph'

import type { DetectionResult } from './types'

import { formatError } from './utils'

export function detectPayloadConfigStructure(sourceFile: SourceFile): DetectionResult {
  // Find buildConfig call expression
  const buildConfigCall = sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .find((call) => {
      const expression = call.getExpression()
      return expression.getText() === 'buildConfig'
    })

  if (!buildConfigCall) {
    return {
      error: formatError({
        actual: 'No buildConfig call found in file',
        context: 'buildConfig call',
        expected: 'export default buildConfig({ ... })',
        technicalDetails: 'Could not find CallExpression with identifier "buildConfig"',
      }),
      success: false,
    }
  }

  // Get import statements
  const importStatements = sourceFile.getImportDeclarations()

  // Find db property if it exists
  const configObject = buildConfigCall.getArguments()[0]
  let dbProperty
  if (configObject && configObject.getKind() === SyntaxKind.ObjectLiteralExpression) {
    dbProperty = configObject
      .asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
      .getProperty('db')
      ?.asKind(SyntaxKind.PropertyAssignment)
  }

  // Find plugins array if it exists
  let pluginsArray
  if (configObject && configObject.getKind() === SyntaxKind.ObjectLiteralExpression) {
    const pluginsProperty = configObject
      .asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
      .getProperty('plugins')
      ?.asKind(SyntaxKind.PropertyAssignment)

    if (pluginsProperty) {
      const initializer = pluginsProperty.getInitializer()
      if (initializer?.getKind() === SyntaxKind.ArrayLiteralExpression) {
        pluginsArray = initializer.asKind(SyntaxKind.ArrayLiteralExpression)
      }
    }
  }

  return {
    sourceFile,
    structures: {
      buildConfigCall,
      dbProperty,
      importStatements,
      pluginsArray,
    },
    success: true,
  }
}
