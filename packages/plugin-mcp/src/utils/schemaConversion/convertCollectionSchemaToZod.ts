import type { JSONSchema4 } from 'json-schema'

import { jsonSchemaToZod } from 'json-schema-to-zod'
import * as ts from 'typescript'
import { z } from 'zod'

import { sanitizeJsonSchema } from './sanitizeJsonSchema.js'
import { simplifyRelationshipFields } from './simplifyRelationshipFields.js'
import { transformPointFieldsForMCP } from './transformPointFields.js'

export const convertCollectionSchemaToZod = (schema: JSONSchema4) => {
  try {
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

    // TypeScript 6 prepends a `"use strict";` directive to the transpiled module
    // output (TypeScript 5 did not). Combined with the `return ${output}` wrapper
    // below, that becomes `return "use strict"; <schema>`, so the evaluated
    // function returns the *string* `"use strict"` instead of the Zod schema, and
    // the create/update tools then throw `convertedFields.partial is not a
    // function`, aborting MCP tool registration for the entire endpoint.
    //
    // Strip the directive AND the whitespace that follows it: the transpiled
    // output is `"use strict";\n<expr>`, and stripping only the directive leaves
    // `return \n<expr>`, where ASI inserts a semicolon after `return` — yielding
    // `undefined` and an empty input schema. Consuming the trailing whitespace
    // keeps the expression on the `return` line.
    const transpiledOutput = transpileResult.outputText.replace(/^\s*['"]use strict['"];?\s*/, '')

    /**
     * This Function evaluation is safe because:
     * 1. The input schema comes from Payload's collection configuration, which is controlled by the application developer
     * 2. The jsonSchemaToZod library converts JSON Schema to Zod schema definitions, producing only type validation code
     * 3. The transpiled output contains only Zod schema definitions (z.string(), z.number(), etc.) - no executable logic
     * 4. The resulting Zod schema is used only for parameter validation in MCP tools, not for data processing
     * 5. No user input or external data is involved in the schema generation process
     */
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const converted = new Function('z', `return ${transpiledOutput}`)(z)

    // Callers (the create/update tools) rely on the result being a ZodObject —
    // they spread `.partial().shape`. If conversion produced anything else, fall
    // back to a permissive object so tool registration can't crash.
    return converted instanceof z.ZodObject ? converted : z.object({}).passthrough()
  } catch (error) {
    // If schema conversion fails (e.g., due to Zod v4 toJSONSchema null-check bug
    // with record schemas that have undefined valueType, or bundler transforms
    // stripping Zod internals), return a permissive schema so tools/list doesn't
    // crash entirely. The tool will still be listed but without strict validation.
    // A ZodObject (rather than z.record) is returned so callers that rely on
    // .partial()/.shape don't throw. See: https://github.com/colinhacks/zod/issues/5821
    console.warn(
      `[plugin-mcp] Schema conversion failed, using permissive fallback:`,
      error instanceof Error ? error.message : error,
    )
    return z.object({}).passthrough()
  }
}
