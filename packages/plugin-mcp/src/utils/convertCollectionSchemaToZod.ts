import type { JSONSchema4 } from 'json-schema'

import { jsonSchemaToZod } from 'json-schema-to-zod'
import * as ts from 'typescript'
import { z } from 'zod'

/**
 * Recursively processes JSON schema properties to simplify relationship fields.
 * For create/update validation we only need to accept IDs (string/number),
 * not populated objects. This removes the $ref option from oneOf unions
 * that represent relationship fields, leaving only the ID shape.
 *
 * NOTE: This function must operate on a cloned schema to avoid mutating
 * the original JSON schema used for tool listing.
 */
function simplifyRelationshipFields(schema: JSONSchema4): JSONSchema4 {
  if (!schema || typeof schema !== 'object') {
    return schema
  }

  const processed = { ...schema }

  if (Array.isArray(processed.oneOf)) {
    const hasRef = processed.oneOf.some(
      (option) => option && typeof option === 'object' && '$ref' in option,
    )

    processed.oneOf = processed.oneOf.map((option) => {
      if (option && typeof option === 'object' && '$ref' in option) {
        // Replace unresolved $ref with a permissive object schema to keep the union shape
        return { type: 'object', additionalProperties: true }
      }
      return simplifyRelationshipFields(option)
    })
  }

  if (processed.properties && typeof processed.properties === 'object') {
    processed.properties = Object.fromEntries(
      Object.entries(processed.properties).map(([key, value]) => [
        key,
        simplifyRelationshipFields(value),
      ]),
    )
  }

  if (processed.items && typeof processed.items === 'object' && !Array.isArray(processed.items)) {
    processed.items = simplifyRelationshipFields(processed.items)
  }

  return processed
}

export const convertCollectionSchemaToZod = (schema: JSONSchema4) => {
  // Clone to avoid mutating the original schema (used elsewhere for tool listing)
  const schemaClone = JSON.parse(JSON.stringify(schema)) as JSONSchema4

  // Remove properties that should not be included in the Zod schema
  delete schemaClone?.properties?.id
  delete schemaClone?.properties?.createdAt
  delete schemaClone?.properties?.updatedAt
  if (Array.isArray(schemaClone.required)) {
    schemaClone.required = schemaClone.required.filter((field) => field !== 'id')
    if (schemaClone.required.length === 0) {
      delete schemaClone.required
    }
  }

  const simplifiedSchema = simplifyRelationshipFields(schemaClone)

  const zodSchemaAsString = jsonSchemaToZod(simplifiedSchema)

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
