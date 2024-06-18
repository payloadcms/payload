import type { Config, Field, FileData, FileSize, Payload, TypeWithID } from 'payload'

import { traverseFields } from '@payloadcms/ui/utilities/buildFieldSchemaMap/traverseFields'
import { sanitizeFields } from 'payload'

import type { FeatureProviderProviderServer } from '../types.js'
import type { UploadFeaturePropsClient } from './feature.client.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { UploadFeatureClientComponent } from '../../../exports/client/index.js'
import { populate } from '../../../populateGraphQL/populate.js'
import { createNode } from '../typeUtilities.js'
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
            getSubFields: ({ node, req }) => {
              const collection = req.payload.collections[node?.relationTo]

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
                  // @ts-expect-error
                  const id = node?.value?.id || node?.value // for backwards-compatibility

                  const populateDepth =
                    props?.maxDepth !== undefined && props?.maxDepth < depth
                      ? props?.maxDepth
                      : depth

                  populationPromises.push(
                    populate({
                      id,
                      collection,
                      currentDepth,
                      data: node,
                      depth: populateDepth,
                      draft,
                      key: 'value',
                      overrideAccess,
                      req,
                      showHiddenFields,
                    }),
                  )

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
