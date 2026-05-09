import { fromJsonSchema } from '@modelcontextprotocol/server'
import { z } from 'zod'

/**
 * Converts a zod schema to a `StandardSchemaWithJSON` that the MCP server's
 * `registerTool` / `registerPrompt` accept. zod 4's `toJSONSchema` produces the
 * JSON Schema; `fromJsonSchema` wraps it with the Standard Schema validator
 * adapter (backed by `@cfworker/json-schema` at runtime).
 */
export const zodToInputSchema = (schema: z.ZodTypeAny) =>
  fromJsonSchema(z.toJSONSchema(schema) as Parameters<typeof fromJsonSchema>[0])
