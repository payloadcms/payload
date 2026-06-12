import type { Config, Field, FieldSchemaMap, UploadCollectionSlug } from 'payload'

import { sanitizeFields } from 'payload'

import type { UploadFeaturePropsClient } from '../client/index.js'

import { populate } from '../../../populateGraphQL/populate.js'
import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { createNode } from '../../typeUtilities.js'
import { uploadPopulationPromiseHOC } from './graphQLPopulationPromise.js'
import { i18n } from './i18n.js'
import { UploadMarkdownTransformer } from './markdownTransformer.js'
import { UploadServerNode } from './nodes/UploadNode.js'
import { createUploadNodeJSONSchema } from './schema.js'
import { uploadValidation } from './validate.js'

export type {
  Internal_UploadData,
  SerializedUploadNode,
  UploadData,
  UploadDataImproved,
} from './schema.js'

export type ExclusiveUploadFeatureProps =
  | {
      /**
       * The collections that should be disabled. Overrides the `enableRichTextRelationship` property in the collection config.
       * When this property is set, `enabledCollections` will not be available.
       **/
      disabledCollections?: UploadCollectionSlug[]

      // Ensures that enabledCollections is not available when disabledCollections is set
      enabledCollections?: never
    }
  | {
      // Ensures that disabledCollections is not available when enabledCollections is set
      disabledCollections?: never

      /**
       * The collections that should be enabled. Overrides the `enableRichTextRelationship` property in the collection config
       * When this property is set, `disabledCollections` will not be available.
       **/
      enabledCollections?: UploadCollectionSlug[]
    }

export type UploadFeatureProps = {
  collections?: {
    [collection: UploadCollectionSlug]: {
      fields: Field[]
    }
  }
  /**
   * Sets a maximum population depth for this upload (not the fields for this upload), regardless of the remaining depth when the respective field is reached.
   * This behaves exactly like the maxDepth properties of relationship and upload fields.
   *
   * {@link https://payloadcms.com/docs/getting-started/concepts#field-level-max-depth}
   */
  maxDepth?: number
} & ExclusiveUploadFeatureProps

export const UploadFeature = createServerFeature<
  UploadFeatureProps,
  UploadFeatureProps,
  UploadFeaturePropsClient
>({
  feature: async ({ config: _config, isRoot, parentIsLocalized, props }) => {
    if (!props) {
      props = { collections: {} }
    }

    const clientProps: UploadFeaturePropsClient = {
      collections: {},
    }
    if (props.disabledCollections) {
      clientProps.disabledCollections = props.disabledCollections
    }
    if (props.enabledCollections) {
      clientProps.enabledCollections = props.enabledCollections
    }

    if (props.collections) {
      for (const collection in props.collections) {
        clientProps.collections[collection] = {
          hasExtraFields: props.collections[collection]!.fields.length >= 1,
        }
      }
    }

    const validRelationships = _config.collections.map((c) => c.slug) || []

    for (const collectionKey in props.collections) {
      const collection = props.collections[collectionKey]!
      if (collection.fields?.length) {
        collection.fields = await sanitizeFields({
          config: _config as unknown as Config,
          fields: collection.fields,
          parentIsLocalized,
          requireFieldLevelRichTextEditor: isRoot,
          validRelationships,
        })
      }
    }

    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#UploadFeatureClient',
      clientFeatureProps: clientProps,
      generateSchemaMap: ({ props }) => {
        if (!props?.collections) {
          return null
        }

        const schemaMap: FieldSchemaMap = new Map()

        for (const collectionKey in props.collections) {
          const collection = props.collections[collectionKey]!
          if (collection.fields?.length) {
            schemaMap.set(collectionKey, {
              fields: collection.fields,
            })
          }
        }

        return schemaMap
      },
      i18n,
      markdownTransformers: [UploadMarkdownTransformer],
      nodes: [
        createNode({
          getSubFields: ({ node, req }) => {
            if (!node) {
              let allSubFields: Field[] = []
              for (const collection in props?.collections) {
                const collectionFields = props.collections[collection]!.fields
                allSubFields = allSubFields.concat(collectionFields)
              }
              return allSubFields
            }
            const collection = req ? req.payload.collections[node?.relationTo] : null

            if (collection) {
              const collectionFieldSchema = props?.collections?.[node?.relationTo]?.fields

              if (Array.isArray(collectionFieldSchema)) {
                if (!collectionFieldSchema?.length) {
                  return null
                }
                return collectionFieldSchema
              }
            }
            return null
          },
          getSubFieldsData: ({ node }) => {
            return node?.fields
          },
          graphQLPopulationPromises: [uploadPopulationPromiseHOC(props)],
          hooks: {
            afterRead: [
              ({
                currentDepth,
                depth,
                draft,
                node,
                overrideAccess,
                populateArg,
                populationPromises,
                req,
                showHiddenFields,
              }) => {
                if (!node?.value) {
                  return node
                }
                const collection = req.payload.collections[node?.relationTo]

                if (!collection) {
                  return node
                }
                const id =
                  typeof node?.value === 'object' && node.value !== null && 'id' in node.value
                    ? node.value.id
                    : node?.value // for backwards-compatibility

                const populateDepth =
                  props?.maxDepth !== undefined && props?.maxDepth < depth ? props?.maxDepth : depth

                populationPromises.push(
                  populate({
                    id,
                    collectionSlug: collection.config.slug,
                    currentDepth,
                    data: node,
                    depth: populateDepth,
                    draft,
                    key: 'value',
                    overrideAccess,
                    req,
                    select:
                      populateArg?.[collection.config.slug] ?? collection.config.defaultPopulate,
                    showHiddenFields,
                  }),
                )

                return node
              },
            ],
          },
          jsonSchema: createUploadNodeJSONSchema(props),
          node: UploadServerNode,
          validations: [uploadValidation(props)],
        }),
      ],
      sanitizedServerFeatureProps: props,
    }
  },
  key: 'upload',
})
