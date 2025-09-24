import type { Config, RichTextAdapterProvider } from 'payload'

import { sanitizeFields, withNullableJSONSchemaType } from 'payload'

import type { AdapterArguments } from './types.js'

import { richTextRelationshipPromise } from './data/richTextRelationshipPromise.js'
import { richTextValidate } from './data/validation.js'
import { elements as elementTypes } from './field/elements/index.js'
import { transformExtraFields } from './field/elements/link/utilities.js'
import { defaultLeaves as leafTypes } from './field/leaves/index.js'
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
      parentIsLocalized: false,
      validRelationships,
    })

    if (args?.admin?.upload?.collections) {
      for (const collection of Object.keys(args.admin.upload.collections)) {
        if (args?.admin?.upload?.collections[collection]?.fields) {
          args.admin.upload.collections[collection].fields = await sanitizeFields({
            config: config as unknown as Config,
            fields: args.admin?.upload?.collections[collection]?.fields,
            parentIsLocalized: false,
            validRelationships,
          })
        }
      }
    }

    return {
      CellComponent: '@payloadcms/richtext-slate/rsc#RscEntrySlateCell',
      FieldComponent: {
        path: '@payloadcms/richtext-slate/rsc#RscEntrySlateField',
        serverProps: {
          args,
        },
      },
      generateImportMap: ({ addToImportMap }) => {
        addToImportMap('@payloadcms/richtext-slate/rsc#RscEntrySlateCell')
        addToImportMap('@payloadcms/richtext-slate/rsc#RscEntrySlateField')
        Object.values(leafTypes).forEach((leaf) => {
          if (leaf.Button) {
            addToImportMap(leaf.Button)
          }
          if (leaf.Leaf) {
            addToImportMap(leaf.Leaf)
          }
          if (Array.isArray(leaf.plugins) && leaf.plugins?.length) {
            addToImportMap(leaf.plugins)
          }
        })
        args?.admin?.leaves?.forEach((leaf) => {
          if (typeof leaf === 'object') {
            if (leaf.Button) {
              addToImportMap(leaf.Button)
            }
            if (leaf.Leaf) {
              addToImportMap(leaf.Leaf)
            }
            if (Array.isArray(leaf.plugins) && leaf.plugins?.length) {
              addToImportMap(leaf.plugins)
            }
          }
        })

        Object.values(elementTypes).forEach((element) => {
          if (element.Button) {
            addToImportMap(element.Button)
          }
          if (element.Element) {
            addToImportMap(element.Element)
          }
          if (Array.isArray(element.plugins) && element.plugins?.length) {
            addToImportMap(element.plugins)
          }
        })

        args?.admin?.elements?.forEach((element) => {
          if (typeof element === 'object') {
            if (element.Button) {
              addToImportMap(element.Button)
            }
            if (element.Element) {
              addToImportMap(element.Element)
            }
            if (Array.isArray(element.plugins) && element.plugins?.length) {
              addToImportMap(element.plugins)
            }
          }
        })
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
        parentIsLocalized,
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
            parentIsLocalized,
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
            parentIsLocalized,
            populate,
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
                parentIsLocalized,
                populateArg: populate,
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
  RichTextCustomElement,
  RichTextCustomLeaf,
  RichTextElement,
  RichTextLeaf,
  RichTextPlugin,
  RichTextPluginComponent,
  SlateFieldProps,
  TextNode,
} from './types.js'

export { nodeIsTextNode } from './types.js'
