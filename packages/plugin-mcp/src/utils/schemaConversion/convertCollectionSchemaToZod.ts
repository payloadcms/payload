import type { JSONSchema4 } from 'json-schema'

import { jsonSchemaToZod } from 'json-schema-to-zod'
import * as ts from 'typescript'
import { z } from 'zod'

import { sanitizeJsonSchema } from './sanitizeJsonSchema.js'
import { simplifyRelationshipFields } from './simplifyRelationshipFields.js'
import { transformPointFieldsForMCP } from './transformPointFields.js'

export const convertCollectionSchemaToZod = (schema: JSONSchema4) => {
  // Clone to avoid mutating the original schema (used elsewhere for tool listing)
  const schemaClone = JSON.parse(JSON.stringify(schema)) as JSONSchema4

  const sanitized = sanitizeJsonSchema(schemaClone)
  const pointTransformed = transformPointFieldsForMCP(sanitized)
  const zodSchemaAsString = jsonSchemaToZod(simplifyRelationshipFields(pointTransformed))

  // Transpile TypeScript to JavaScript
  const transpileResult = ts.transpileModule(zodSchemaAsString, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      removeComments: true,
      strict: false,
      target: ts.ScriptTarget.ES2018,
    },
  })

  /**
   * This Function evaluation is safe because:
   * 1. The input schema comes from Payload's collection configuration, which is controlled by the application developer
   * 2. The jsonSchemaToZod library converts JSON Schema to Zod schema definitions, producing only type validation code
   * 3. The transpiled output contains only Zod schema definitions (z.string(), z.number(), etc.) - no executable logic
   * 4. The resulting Zod schema is used only for parameter validation in MCP tools, not for data processing
   * 5. No user input or external data is involved in the schema generation process
   */
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function('z', `return ${transpileResult.outputText}`)(z)
}
