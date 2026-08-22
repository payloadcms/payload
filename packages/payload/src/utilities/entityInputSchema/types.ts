export type EntityInputSchema = {
  $defs?: Record<string, boolean | EntityInputSchema>
  $ref?: string
  [key: string]: unknown
  additionalProperties?: boolean | EntityInputSchema
  anyOf?: Array<boolean | EntityInputSchema>
  const?: unknown
  description?: string
  enum?: unknown[]
  items?: EntityInputSchema | EntityInputSchema[]
  oneOf?: Array<boolean | EntityInputSchema>
  properties?: Record<string, EntityInputSchema>
  required?: string[]
  type?: string | string[]
}
