import type { JSONSchema4 } from 'json-schema'

import { jsonSchemaToZod } from 'json-schema-to-zod'
import * as ts from 'typescript'
import { z } from 'zod'

export const convertCollectionSchemaToZod = (schema: JSONSchema4) => {
  // Remove properties that should not be included in the Zod schema
  delete schema?.properties?.createdAt
  delete schema?.properties?.updatedAt

  const zodSchemaAsString = jsonSchemaToZod(schema)

  // Transpile TypeScript to JavaScript
  const transpileResult = ts.transpileModule(zodSchemaAsString, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      removeComments: true,
      strict: false,
      target: ts.ScriptTarget.ES2018,
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const zodSchema = new Function('z', `return ${transpileResult.outputText}`)(z)
  return zodSchema
}
