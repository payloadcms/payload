import type { Config, TaskConfig, TypedUser } from 'payload'

import type { Import } from './createImport.js'

import { createImport } from './createImport.js'
import { getFields } from './getFields.js'

export type ImportTaskInput = {
  defaultVersionStatus?: 'draft' | 'published'
  importId?: string
  importsCollection?: string
  user?: string
} & Import

export const getCreateCollectionImportTask = (
  config: Config,
): TaskConfig<{
  input: ImportTaskInput
  output: object
}> => {
  const inputSchema = getFields(config).concat(
    {
      name: 'user',
      type: 'text',
    },
    {
      name: 'userCollection',
      type: 'text',
    },
    {
      name: 'importsCollection',
      type: 'text',
    },
    {
      name: 'file',
      type: 'group',
      fields: [
        {
          name: 'data',
          type: 'text',
        },
        {
          name: 'mimetype',
          type: 'text',
        },
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    {
      name: 'format',
      type: 'select',
      options: ['csv', 'json'],
    },
    {
      name: 'debug',
      type: 'checkbox',
    },
    {
      name: 'maxLimit',
      type: 'number',
    },
  )

  return {
    slug: 'createCollectionImport',
    handler: async ({ input, req }) => {
      // Convert file data back to Buffer if it was serialized
      if (input.file && typeof input.file.data === 'string') {
        input.file.data = Buffer.from(input.file.data, 'base64')
      }

      const result = await createImport({
        ...input,
        req,
      })

      // Update the import document with results if importId is provided
      if (input.importId) {
        await req.payload.update({
          id: input.importId,
          collection: input.importsCollection || 'imports',
          data: {
            status:
              result.errors.length === 0
                ? 'completed'
                : result.imported + result.updated === 0
                  ? 'failed'
                  : 'partial',
            summary: {
              imported: result.imported,
              issueDetails:
                result.errors.length > 0
                  ? result.errors.map((e) => ({
                      data: e.doc,
                      error: e.error,
                      row: e.index + 1,
                    }))
                  : undefined,
              issues: result.errors.length,
              total: result.total,
              updated: result.updated,
            },
          },
        })
      }

      return {
        output: result,
      }
    },
    inputSchema,
  }
}
