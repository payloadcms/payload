import type { Config, SanitizedConfig } from 'payload/config'
import type { Field } from 'payload/types'

import { traverseFields } from '@payloadcms/ui/utilities/buildFieldSchemaMap/traverseFields'
import { sanitizeFields } from 'payload/config'
import {
  afterChangeTraverseFields,
  afterReadTraverseFields,
  beforeChangeTraverseFields,
  beforeValidateTraverseFields,
  deepCopyObject,
} from 'payload/utilities'

import type { FeatureProviderProviderServer } from '../types.js'
import type { ClientProps } from './feature.client.js'

import { convertLexicalNodesToHTML } from '../converters/html/converter/index.js'
import { createNode } from '../typeUtilities.js'
import { LinkFeatureClientComponent } from './feature.client.js'
import { linkPopulationPromiseHOC } from './graphQLPopulationPromise.js'
import { i18n } from './i18n.js'
import { LinkMarkdownTransformer } from './markdownTransformer.js'
import { AutoLinkNode } from './nodes/AutoLinkNode.js'
import { LinkNode } from './nodes/LinkNode.js'
import { transformExtraFields } from './plugins/floatingLinkEditor/utilities.js'
import { linkValidation } from './validate.js'

export type ExclusiveLinkCollectionsProps =
  | {
      /**
       * The collections that should be disabled for internal linking. Overrides the `enableRichTextLink` property in the collection config.
       * When this property is set, `enabledCollections` will not be available.
       **/
      disabledCollections?: string[]

      // Ensures that enabledCollections is not available when disabledCollections is set
      enabledCollections?: never
    }
  | {
      // Ensures that disabledCollections is not available when enabledCollections is set
      disabledCollections?: never

      /**
       * The collections that should be enabled for internal linking. Overrides the `enableRichTextLink` property in the collection config
       * When this property is set, `disabledCollections` will not be available.
       **/
      enabledCollections?: string[]
    }

export type LinkFeatureServerProps = ExclusiveLinkCollectionsProps & {
  /**
   * A function or array defining additional fields for the link feature. These will be
   * displayed in the link editor drawer.
   */
  fields?: ((args: { config: SanitizedConfig; defaultFields: Field[] }) => Field[]) | Field[]
  /**
   * Sets a maximum population depth for the internal doc default field of link, regardless of the remaining depth when the field is reached.
   * This behaves exactly like the maxDepth properties of relationship and upload fields.
   *
   * {@link https://payloadcms.com/docs/getting-started/concepts#field-level-max-depth}
   */
  maxDepth?: number
}

export const LinkFeature: FeatureProviderProviderServer<LinkFeatureServerProps, ClientProps> = (
  props,
) => {
  if (!props) {
    props = {}
  }
  return {
    feature: async ({ config: _config, isRoot }) => {
      const validRelationships = _config.collections.map((c) => c.slug) || []

      const _transformedFields = transformExtraFields(
        deepCopyObject(props.fields),
        _config,
        props.enabledCollections,
        props.disabledCollections,
        props.maxDepth,
      )

      const sanitizedFields = await sanitizeFields({
        config: _config as unknown as Config,
        fields: _transformedFields,
        requireFieldLevelRichTextEditor: isRoot,
        validRelationships,
      })
      props.fields = sanitizedFields

      return {
        ClientComponent: LinkFeatureClientComponent,
        clientFeatureProps: {
          disabledCollections: props.disabledCollections,
          enabledCollections: props.enabledCollections,
        } as ExclusiveLinkCollectionsProps,
        generateSchemaMap: ({ config, i18n }) => {
          if (!sanitizedFields || !Array.isArray(sanitizedFields) || sanitizedFields.length === 0) {
            return null
          }

          const schemaMap = new Map<string, Field[]>()

          const validRelationships = config.collections.map((c) => c.slug) || []

          schemaMap.set('fields', sanitizedFields)

          traverseFields({
            config,
            fields: sanitizedFields,
            i18n,
            schemaMap,
            schemaPath: 'fields',
            validRelationships,
          })

          return schemaMap
        },
        i18n,
        markdownTransformers: [LinkMarkdownTransformer],
        nodes: [
          createNode({
            converters: {
              html: {
                converter: async ({ converters, node, parent, payload }) => {
                  const childrenText = await convertLexicalNodesToHTML({
                    converters,
                    lexicalNodes: node.children,
                    parent: {
                      ...node,
                      parent,
                    },
                    payload,
                  })

                  const rel: string = node.fields.newTab ? ' rel="noopener noreferrer"' : ''
                  const target: string = node.fields.newTab ? ' target="_blank"' : ''

                  let href: string = node.fields.url
                  if (node.fields.linkType === 'internal') {
                    href =
                      typeof node.fields.doc?.value === 'string'
                        ? node.fields.doc?.value
                        : node.fields.doc?.value?.id
                  }

                  return `<a href="${href}"${target}${rel}>${childrenText}</a>`
                },
                nodeTypes: [AutoLinkNode.getType()],
              },
            },
            node: AutoLinkNode,
            // Since AutoLinkNodes are just internal links, they need no hooks or graphQL population promises
            validations: [linkValidation(props)],
          }),
          createNode({
            converters: {
              html: {
                converter: async ({ converters, node, parent, payload }) => {
                  const childrenText = await convertLexicalNodesToHTML({
                    converters,
                    lexicalNodes: node.children,
                    parent: {
                      ...node,
                      parent,
                    },
                    payload,
                  })

                  const rel: string = node.fields.newTab ? ' rel="noopener noreferrer"' : ''
                  const target: string = node.fields.newTab ? ' target="_blank"' : ''

                  const href: string =
                    node.fields.linkType === 'custom'
                      ? node.fields.url
                      : (node.fields.doc?.value as string)

                  return `<a href="${href}"${target}${rel}>${childrenText}</a>`
                },
                nodeTypes: [LinkNode.getType()],
              },
            },
            graphQLPopulationPromises: [linkPopulationPromiseHOC(props)],
            hooks: {
              afterChange: [
                async ({ context, node, operation, originalNode, req }) => {
                  await afterChangeTraverseFields({
                    collection: null,
                    context,
                    data: node.fields,
                    doc: originalNode.fields,
                    fields: sanitizedFields,
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
                  afterReadTraverseFields({
                    collection: null,
                    context,
                    currentDepth,
                    depth,
                    doc: node.fields,
                    draft,
                    fallbackLocale,
                    fieldPromises,
                    fields: sanitizedFields,
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
                  await beforeChangeTraverseFields({
                    id: null,
                    collection: null,
                    context,
                    data: node.fields,
                    doc: originalNode.fields,
                    docWithLocales: originalNodeWithLocales?.fields ?? {},
                    duplicate,
                    errors,
                    fields: sanitizedFields,
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

                  return node
                },
              ],

              beforeValidate: [
                async ({ context, node, operation, originalNode, overrideAccess, req }) => {
                  await beforeValidateTraverseFields({
                    id: null,
                    collection: null,
                    context,
                    data: node.fields,
                    doc: originalNode.fields,
                    fields: sanitizedFields,
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

                  return node
                },
              ],
            },
            node: LinkNode,
            validations: [linkValidation(props)],
          }),
        ],
        serverFeatureProps: props,
      }
    },
    key: 'link',
    serverFeatureProps: props,
  }
}
