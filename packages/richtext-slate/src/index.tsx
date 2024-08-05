import type { Config, RichTextAdapterProvider } from 'payload'

import { genImportMapIterateFields, sanitizeFields, withNullableJSONSchemaType } from 'payload'

import type { AdapterArguments } from './types.js'

import { richTextRelationshipPromise } from './data/richTextRelationshipPromise.js'
import { richTextValidate } from './data/validation.js'
import { transformExtraFields } from './field/elements/link/utilities.js'
import { getGenerateSchemaMap } from './generateSchemaMap.js'

export function slateEditor(
  args: AdapterArguments,
): RichTextAdapterProvider<any[], AdapterArguments, any> {
  return async ({ config }) => {
    const validRelationships = config.collections.map((c) => c.slug) || []

    if (!args.admin) {
      args.admin = {}
    }
    if (!args.admin.link) {
      args.admin.link = {}
    }
    if (!args.admin.link.fields) {
      args.admin.link.fields = []
    }
    args.admin.link.fields = await sanitizeFields({
      config: config as unknown as Config,
      fields: transformExtraFields(args.admin?.link?.fields, config),
      validRelationships,
    })

    if (args?.admin?.upload?.collections) {
      for (const collection of Object.keys(args.admin.upload.collections)) {
        if (args?.admin?.upload?.collections[collection]?.fields) {
          args.admin.upload.collections[collection].fields = await sanitizeFields({
            config: config as unknown as Config,
            fields: args.admin?.upload?.collections[collection]?.fields,
            validRelationships,
          })
        }
      }
    }

    return {
      CellComponent: '@payloadcms/richtext-slate/client#RichTextCell',
      FieldComponent: '@payloadcms/richtext-slate/client#RichTextField',
      generateComponentMap: {
        path: '@payloadcms/richtext-slate/generateComponentMap#getGenerateComponentMap',
        serverProps: args,
      },
      generateImportMap: ({ addToImportMap }) => {
        addToImportMap('@payloadcms/richtext-slate/client#RichTextCell')
        addToImportMap('@payloadcms/richtext-slate/client#RichTextField')
        addToImportMap('@payloadcms/richtext-slate/generateComponentMap#getGenerateComponentMap')
      },
      generateSchemaMap: getGenerateSchemaMap(args),
      graphQLPopulationPromises({
        context,
        currentDepth,
        depth,
        draft,
        field,
        fieldPromises,
        findMany,
        flattenLocales,
        overrideAccess,
        populationPromises,
        req,
        showHiddenFields,
        siblingDoc,
      }) {
        if (
          field.admin?.elements?.includes('relationship') ||
          field.admin?.elements?.includes('upload') ||
          field.admin?.elements?.includes('link') ||
          !field?.admin?.elements
        ) {
          richTextRelationshipPromise({
            context,
            currentDepth,
            depth,
            draft,
            field,
            fieldPromises,
            findMany,
            flattenLocales,
            overrideAccess,
            populationPromises,
            req,
            showHiddenFields,
            siblingDoc,
          })
        }
      },
      hooks: {
        afterRead: [
          ({
            context: _context,
            currentDepth,
            depth,
            draft,
            field: _field,
            fieldPromises,
            findMany,
            flattenLocales,
            overrideAccess,
            populationPromises,
            req,
            showHiddenFields,
            siblingData,
          }) => {
            const context: any = _context
            const field = _field as any
            if (
              field.admin?.elements?.includes('relationship') ||
              field.admin?.elements?.includes('upload') ||
              field.admin?.elements?.includes('link') ||
              !field?.admin?.elements
            ) {
              richTextRelationshipPromise({
                context,
                currentDepth,
                depth,
                draft,
                field,
                fieldPromises,
                findMany,
                flattenLocales,
                overrideAccess,
                populationPromises,
                req,
                showHiddenFields,
                siblingDoc: siblingData,
              })
            }
          },
        ],
      },
      outputSchema: ({ isRequired }) => {
        return {
          type: withNullableJSONSchemaType('array', isRequired),
          items: {
            type: 'object',
          },
        }
      },
      validate: richTextValidate,
    }
  }
}

export type {
  AdapterArguments,
  ElementNode,
  FieldProps,
  RichTextCustomElement,
  RichTextCustomLeaf,
  RichTextElement,
  RichTextLeaf,
  RichTextPlugin,
  RichTextPluginComponent,
  TextNode,
} from './types.js'

export { nodeIsTextNode } from './types.js'
