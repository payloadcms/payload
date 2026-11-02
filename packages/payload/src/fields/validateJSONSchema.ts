import type { JSONSchema4 } from 'json-schema'
import type { core } from 'zod'

import type { JSONField } from './config/types.js'

type Args = {
  jsonSchema: NonNullable<JSONField['jsonSchema']>
  value: unknown
}

/**
 * Validates a JSON field value against the field's `jsonSchema`.
 *
 * `validations.ts` imports this through `#validateJSONSchema`, and `package.json` gives browsers
 * `validateJSONSchema.browser.ts` instead. `jsonSchema` is a server-only field property, so the
 * admin never validates JSON Schemas in the browser, and doesn't need to compile or download zod.
 */
export const validateJSONSchema = async ({ jsonSchema, value }: Args): Promise<string | true> => {
  const fetchSchema = ({ schema, uri }: { schema: JSONSchema4; uri: string }) => {
    if (uri && schema) {
      return schema
    }
    return fetch(uri)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        return response.json()
      })
      .then((_json) => {
        const json = _json as {
          id: string
        }
        const jsonSchemaSanitizations = {
          id: undefined,
          $id: json.id,
          $schema: 'http://json-schema.org/draft-07/schema#',
        }

        return Object.assign(json, jsonSchemaSanitizations)
      })
  }

  try {
    jsonSchema.schema = fetchSchema(jsonSchema)
    const { schema } = jsonSchema
    const { fromJSONSchema } = await import('zod')
    // `JSONSchema4` allows any string for `$schema`, while zod narrows it to the three drafts it
    // supports. zod ignores `$schema` at runtime, so the wider type is safe to pass through.
    const zodSchema = fromJSONSchema(schema as core.JSONSchema.JSONSchema)

    const result = zodSchema.safeParse(value)

    if (!result.success) {
      return result.error.issues
        .map((issue) =>
          issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message,
        )
        .join(', ')
    }
  } catch (error) {
    return error instanceof Error ? error.message : 'Unknown error'
  }

  return true
}
