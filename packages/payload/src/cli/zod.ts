import type { StandardJSONSchemaV1 } from '@standard-schema/spec'

import * as z from 'zod/mini'

/** Adds Standard JSON Schema conversion to a tree-shakable Zod Mini object schema. */
export const strictObject = <TShape extends z.core.$ZodLooseShape>(shape: TShape) => {
  const schema = z.strictObject(shape)

  Object.assign(schema['~standard'], {
    jsonSchema: {
      input: ({ libraryOptions, target }: StandardJSONSchemaV1.Options) =>
        z.toJSONSchema(schema, { ...libraryOptions, io: 'input', target }),
      output: ({ libraryOptions, target }: StandardJSONSchemaV1.Options) =>
        z.toJSONSchema(schema, { ...libraryOptions, io: 'output', target }),
    },
  })

  return schema as StandardJSONSchemaV1<z.input<typeof schema>, z.output<typeof schema>> &
    typeof schema
}
