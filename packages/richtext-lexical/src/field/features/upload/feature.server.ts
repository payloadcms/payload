import type { Config } from 'payload/config'
import type { Field, FileData, FileSize, Payload, TypeWithID } from 'payload/types'

import { traverseFields } from '@payloadcms/ui/utilities/buildFieldSchemaMap/traverseFields'
import { sanitizeFields } from 'payload/config'
import {
  afterChangeTraverseFields,
  afterReadTraverseFields,
  beforeChangeTraverseFields,
  beforeValidateTraverseFields,
} from 'payload/utilities'

import type { FeatureProviderProviderServer } from '../types.js'
import type { UploadFeaturePropsClient } from './feature.client.js'

import { createNode } from '../typeUtilities.js'
import { UploadFeatureClientComponent } from './feature.client.js'
import { uploadPopulationPromiseHOC } from './graphQLPopulationPromise.js'
import { i18n } from './i18n.js'
import { UploadNode } from './nodes/UploadNode.js'
import { uploadValidation } from './validate.js'

export type UploadFeatureProps = {
  collections?: {
    [collection: string]: {
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
}

/**
 * Get the absolute URL for an upload URL by potentially prepending the serverURL
 */
function getAbsoluteURL(url: string, payload: Payload): string {
  return url?.startsWith('http') ? url : (payload?.config?.serverURL || '') + url
}

export const UploadFeature: FeatureProviderProviderServer<
  UploadFeatureProps,
  UploadFeaturePropsClient
> = (props) => {
  if (!props) {
    props = { collections: {} }
  }

  const clientProps: UploadFeaturePropsClient = {
    collections: {},
  }
  if (props.collections) {
    for (const collection in props.collections) {
      clientProps.collections[collection] = {
        hasExtraFields: props.collections[collection].fields.length >= 1,
      }
    }
  }

  return {
    feature: async ({ config: _config, isRoot }) => {
      const validRelationships = _config.collections.map((c) => c.slug) || []

      for (const collection in props.collections) {
        if (props.collections[collection].fields?.length) {
          props.collections[collection].fields = await sanitizeFields({
            config: _config as unknown as Config,
            fields: props.collections[collection].fields,
            requireFieldLevelRichTextEditor: isRoot,
            validRelationships,
          })
        }
      }

      return {
        ClientComponent: UploadFeatureClientComponent,
        clientFeatureProps: clientProps,
        generateSchemaMap: ({ config, i18n, props }) => {
          if (!props?.collections) return null

          const schemaMap = new Map<string, Field[]>()
          const validRelationships = config.collections.map((c) => c.slug) || []

          for (const collection in props.collections) {
            if (props.collections[collection].fields?.length) {
              schemaMap.set(collection, props.collections[collection].fields)
              traverseFields({
                config,
                fields: props.collections[collection].fields,
                i18n,
                schemaMap,
                schemaPath: collection,
                validRelationships,
              })
            }
          }

          return schemaMap
        },
        i18n,
        nodes: [
          createNode({
            converters: {
              html: {
                converter: async ({ node, payload }) => {
                  // @ts-expect-error
                  const id = node?.value?.id || node?.value // for backwards-compatibility

                  if (payload) {
                    let uploadDocument: TypeWithID & FileData

                    try {
                      uploadDocument = (await payload.findByID({
                        id,
                        collection: node.relationTo,
                      })) as TypeWithID & FileData
                    } catch (ignored) {
                      // eslint-disable-next-line no-console
                      console.error(
                        'Lexical upload node HTML converter: error fetching upload file',
                        ignored,
                        'Node:',
                        node,
                      )
                      return `<img />`
                    }

                    const url = getAbsoluteURL(uploadDocument?.url, payload)

                    /**
                     * If the upload is not an image, return a link to the upload
                     */
                    if (!uploadDocument?.mimeType?.startsWith('image')) {
                      return `<a href="${url}" rel="noopener noreferrer">${uploadDocument.filename}</a>`
                    }

                    /**
                     * If the upload is a simple image with no different sizes, return a simple img tag
                     */
                    if (!uploadDocument?.sizes || !Object.keys(uploadDocument?.sizes).length) {
                      return `<img src="${url}" alt="${uploadDocument?.filename}" width="${uploadDocument?.width}"  height="${uploadDocument?.height}"/>`
                    }

                    /**
                     * If the upload is an image with different sizes, return a picture element
                     */
                    let pictureHTML = '<picture>'

                    // Iterate through each size in the data.sizes object
                    for (const size in uploadDocument.sizes) {
                      const imageSize: FileSize & {
                        url?: string
                      } = uploadDocument.sizes[size]

                      // Skip if any property of the size object is null
                      if (
                        !imageSize.width ||
                        !imageSize.height ||
                        !imageSize.mimeType ||
                        !imageSize.filesize ||
                        !imageSize.filename ||
                        !imageSize.url
                      ) {
                        continue
                      }
                      const imageSizeURL = getAbsoluteURL(imageSize?.url, payload)

                      pictureHTML += `<source srcset="${imageSizeURL}" media="(max-width: ${imageSize.width}px)" type="${imageSize.mimeType}">`
                    }

                    // Add the default img tag
                    pictureHTML += `<img src="${url}" alt="Image" width="${uploadDocument.width}" height="${uploadDocument.height}">`
                    pictureHTML += '</picture>'
                    return pictureHTML
                  } else {
                    return `<img src="${id}" />`
                  }
                },
                nodeTypes: [UploadNode.getType()],
              },
            },
            graphQLPopulationPromises: [uploadPopulationPromiseHOC(props)],
            hooks: {
              afterChange: [
                async ({ context, node, operation, originalNode, req }) => {
                  const collection = req.payload.collections[node?.relationTo]

                  if (collection) {
                    const collectionFieldSchema = props?.collections?.[node?.relationTo]?.fields

                    if (Array.isArray(collectionFieldSchema)) {
                      if (!collectionFieldSchema?.length) {
                        return
                      }
                      await afterChangeTraverseFields({
                        collection: null,
                        context,
                        data: node.fields,
                        doc: originalNode.fields,
                        fields: collectionFieldSchema,
                        global: null,
                        operation:
                          operation === 'create' || operation === 'update' ? operation : 'update',
                        path: '', // This is fine since we are treating lexical block fields as isolated / on its own
                        previousDoc: originalNode.fields,
                        previousSiblingDoc: originalNode.fields,
                        req,
                        schemaPath: '', // This is fine since we are treating lexical block fields as isolated / on its own
                        siblingData: node.fields,
                        siblingDoc: originalNode.fields,
                      })
                    }
                  }

                  return node
                },
              ],
              afterRead: [
                ({
                  context,
                  currentDepth,
                  depth,
                  draft,
                  fallbackLocale,
                  fieldPromises,
                  findMany,
                  flattenLocales,
                  locale,
                  node,
                  overrideAccess,
                  populationPromises,
                  req,
                  showHiddenFields,
                  triggerAccessControl,
                  triggerHooks,
                }) => {
                  const collection = req.payload.collections[node?.relationTo]

                  if (collection) {
                    const collectionFieldSchema = props?.collections?.[node?.relationTo]?.fields

                    if (Array.isArray(collectionFieldSchema)) {
                      if (!collectionFieldSchema?.length) {
                        return node
                      }
                      afterReadTraverseFields({
                        collection: null,
                        context,
                        currentDepth,
                        depth,
                        doc: node.fields,
                        draft,
                        fallbackLocale,
                        fieldPromises,
                        fields: collectionFieldSchema,
                        findMany,
                        flattenLocales,
                        global: null,
                        locale,
                        overrideAccess,
                        path: '', // This is fine since we are treating lexical block fields as isolated / on its own
                        populationPromises,
                        req,
                        schemaPath: '', // This is fine since we are treating lexical block fields as isolated / on its own
                        showHiddenFields,
                        siblingDoc: node.fields,
                        triggerAccessControl,
                        triggerHooks,
                      })
                    }
                  }

                  return node
                },
              ],
              beforeChange: [
                async ({
                  context,
                  duplicate,
                  errors,
                  mergeLocaleActions,
                  node,
                  operation,
                  originalNode,
                  originalNodeWithLocales,
                  req,
                  skipValidation,
                }) => {
                  const collection = req.payload.collections[node?.relationTo]

                  if (collection) {
                    const collectionFieldSchema = props?.collections?.[node?.relationTo]?.fields

                    if (Array.isArray(collectionFieldSchema)) {
                      if (!collectionFieldSchema?.length) {
                        return node
                      }
                      await beforeChangeTraverseFields({
                        id: null,
                        collection: null,
                        context,
                        data: node.fields,
                        doc: originalNode.fields,
                        docWithLocales: originalNodeWithLocales?.fields ?? {},
                        duplicate,
                        errors,
                        fields: collectionFieldSchema,
                        global: null,
                        mergeLocaleActions,
                        operation:
                          operation === 'create' || operation === 'update' ? operation : 'update',
                        path: '', // This is fine since we are treating lexical block fields as isolated / on its own
                        req,
                        schemaPath: '', // This is fine since we are treating lexical block fields as isolated / on its own
                        siblingData: node.fields,
                        siblingDoc: originalNode.fields,
                        siblingDocWithLocales: originalNodeWithLocales?.fields ?? {},
                        skipValidation,
                      })
                    }
                  }

                  return node
                },
              ],

              beforeValidate: [
                async ({ context, node, operation, originalNode, overrideAccess, req }) => {
                  const collection = req.payload.collections[node?.relationTo]

                  if (collection) {
                    const collectionFieldSchema = props?.collections?.[node?.relationTo]?.fields

                    if (Array.isArray(collectionFieldSchema)) {
                      if (!collectionFieldSchema?.length) {
                        return node
                      }
                      await beforeValidateTraverseFields({
                        id: null,
                        collection: null,
                        context,
                        data: node.fields,
                        doc: originalNode.fields,
                        fields: collectionFieldSchema,
                        global: null,
                        operation:
                          operation === 'create' || operation === 'update' ? operation : 'update',
                        overrideAccess,
                        path: '', // This is fine since we are treating lexical block fields as isolated / on its own
                        req,
                        schemaPath: '', // This is fine since we are treating lexical block fields as isolated / on its own
                        siblingData: node.fields,
                        siblingDoc: originalNode.fields,
                      })
                    }
                  }

                  return node
                },
              ],
            },
            node: UploadNode,
            validations: [uploadValidation(props)],
          }),
        ],
        serverFeatureProps: props,
      }
    },
    key: 'upload',
    serverFeatureProps: props,
  }
}
