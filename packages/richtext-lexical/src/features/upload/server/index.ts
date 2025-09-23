import type {
  CollectionSlug,
  Config,
  Field,
  FieldSchemaMap,
  FileData,
  FileSizeImproved,
  Payload,
  TypeWithID,
} from 'payload'

import { sanitizeFields } from 'payload'

import type { UploadFeaturePropsClient } from '../client/index.js'

import { populate } from '../../../populateGraphQL/populate.js'
import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { createNode } from '../../typeUtilities.js'
import { uploadPopulationPromiseHOC } from './graphQLPopulationPromise.js'
import { i18n } from './i18n.js'
import { UploadServerNode } from './nodes/UploadNode.js'
import { uploadValidation } from './validate.js'

export type UploadFeatureProps = {
  collections?: {
    [collection: CollectionSlug]: {
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
      nodes: [
        createNode({
          converters: {
            html: {
              converter: async ({
                currentDepth,
                depth,
                draft,
                node,
                overrideAccess,
                req,
                showHiddenFields,
              }) => {
                // @ts-expect-error - for backwards-compatibility
                const id = node?.value?.id || node?.value

                if (req?.payload) {
                  const uploadDocument: {
                    value?: FileData & TypeWithID
                  } = {}

                  try {
                    await populate({
                      id,
                      collectionSlug: node.relationTo,
                      currentDepth,
                      data: uploadDocument,
                      depth,
                      draft,
                      key: 'value',
                      overrideAccess,
                      req,
                      showHiddenFields,
                    })
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

                  const url = getAbsoluteURL(uploadDocument?.value?.url ?? '', req?.payload)

                  /**
                   * If the upload is not an image, return a link to the upload
                   */
                  if (!uploadDocument?.value?.mimeType?.startsWith('image')) {
                    return `<a href="${url}" rel="noopener noreferrer">${uploadDocument.value?.filename}</a>`
                  }

                  /**
                   * If the upload is a simple image with no different sizes, return a simple img tag
                   */
                  if (
                    !uploadDocument?.value?.sizes ||
                    !Object.keys(uploadDocument?.value?.sizes).length
                  ) {
                    return `<img src="${url}" alt="${uploadDocument?.value?.filename}" width="${uploadDocument?.value?.width}"  height="${uploadDocument?.value?.height}"/>`
                  }

                  /**
                   * If the upload is an image with different sizes, return a picture element
                   */
                  let pictureHTML = '<picture>'

                  // Iterate through each size in the data.sizes object
                  for (const size in uploadDocument.value?.sizes) {
                    const imageSize = uploadDocument.value.sizes[size] as FileSizeImproved

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
                    const imageSizeURL = getAbsoluteURL(imageSize?.url, req?.payload)

                    pictureHTML += `<source srcset="${imageSizeURL}" media="(max-width: ${imageSize.width}px)" type="${imageSize.mimeType}">`
                  }

                  // Add the default img tag
                  pictureHTML += `<img src="${url}" alt="Image" width="${uploadDocument.value?.width}" height="${uploadDocument.value?.height}">`
                  pictureHTML += '</picture>'
                  return pictureHTML
                } else {
                  return `<img src="${id}" />`
                }
              },
              nodeTypes: [UploadServerNode.getType()],
            },
          },
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
                // @ts-expect-error - Fix in Payload v4
                const id = node?.value?.id || node?.value // for backwards-compatibility

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
          node: UploadServerNode,
          validations: [uploadValidation(props)],
        }),
      ],
      sanitizedServerFeatureProps: props,
    }
  },
  key: 'upload',
})
