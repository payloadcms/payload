import { entityToStandaloneJSONSchema } from 'payload'

import type { JsonSchemaType } from '../../../types.js'

import { defineGlobalTool } from '../../../defineTool.js'
import { getGlobalVirtualFieldNames } from '../../../utils/getVirtualFieldNames.js'
import { removeVirtualFieldsFromSchema } from '../../../utils/schemaConversion/removeVirtualFieldsFromSchema.js'
import { sanitizeEntitySchema } from '../../../utils/schemaConversion/sanitizeEntitySchema.js'

export const getGlobalSchemaTool = defineGlobalTool({
  description: 'Get the input schema for updating a global.',
}).handler(({ globalSlug, req }) => {
  const global = req.payload.config.globals.find((globalConfig) => globalConfig.slug === globalSlug)

  if (!global) {
    return {
      content: [{ type: 'text', text: `Error: Global "${globalSlug}" not found` }],
      isError: true,
    }
  }

  const globalSchema = removeVirtualFieldsFromSchema(
    entityToStandaloneJSONSchema({
      config: req.payload.config,
      defaultIDType: req.payload.db.defaultIDType,
      entity: global,
      i18n: req.i18n,
    }) as unknown as JsonSchemaType,
    getGlobalVirtualFieldNames(req.payload.config, globalSlug),
  )
  const inputSchema = sanitizeEntitySchema(globalSchema)

  return {
    content: [
      {
        type: 'text',
        text: `Schema for global "${globalSlug}":\n\`\`\`json\n${JSON.stringify(inputSchema)}\n\`\`\``,
      },
    ],
    structuredContent: {
      globalSlug,
      schema: inputSchema,
    },
  }
})
