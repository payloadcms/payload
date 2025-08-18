import type {
  CollectionSlug,
  Config,
  Field,
  FieldAffectingData,
  FieldSchemaMap,
  SanitizedConfig,
} from 'payload'

import escapeHTML from 'escape-html'
import { sanitizeFields } from 'payload'

import type { NodeWithHooks } from '../../typesServer.js'
import type { ClientProps } from '../client/index.js'

import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { convertLexicalNodesToHTML } from '../../converters/lexicalToHtml_deprecated/converter/index.js'
import { createNode } from '../../typeUtilities.js'
import { LinkMarkdownTransformer } from '../markdownTransformer.js'
import { AutoLinkNode } from '../nodes/AutoLinkNode.js'
import { LinkNode } from '../nodes/LinkNode.js'
import { linkPopulationPromiseHOC } from './graphQLPopulationPromise.js'
import { i18n } from './i18n.js'
import { transformExtraFields } from './transformExtraFields.js'
import { linkValidation } from './validate.js'

export type ExclusiveLinkCollectionsProps =
  | {
      /**
       * The collections that should be disabled for internal linking. Overrides the `enableRichTextLink` property in the collection config.
       * When this property is set, `enabledCollections` will not be available.
       **/
      disabledCollections?: CollectionSlug[]

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
      enabledCollections?: CollectionSlug[]
    }

export type LinkFeatureServerProps = {
  /**
   * Disables the automatic creation of links from URLs pasted into the editor, as well
   * as auto link nodes.
   *
   * If set to 'creationOnly', only the creation of new auto link nodes will be disabled.
   * Existing auto link nodes will still be editable.
   *
   * @default false
   */
  disableAutoLinks?: 'creationOnly' | true
  /**
   * A function or array defining additional fields for the link feature. These will be
   * displayed in the link editor drawer.
   */
  fields?:
    | ((args: {
        config: SanitizedConfig
        defaultFields: FieldAffectingData[]
      }) => (Field | FieldAffectingData)[])
    | Field[]
  /**
   * Sets a maximum population depth for the internal doc default field of link, regardless of the remaining depth when the field is reached.
   * This behaves exactly like the maxDepth properties of relationship and upload fields.
   *
   * {@link https://payloadcms.com/docs/getting-started/concepts#field-level-max-depth}
   */
  maxDepth?: number
} & ExclusiveLinkCollectionsProps

export const LinkFeature = createServerFeature<
  LinkFeatureServerProps,
  LinkFeatureServerProps,
  ClientProps
>({
  feature: async ({ config: _config, isRoot, parentIsLocalized, props }) => {
    if (!props) {
      props = {}
    }
    const validRelationships = _config.collections.map((c) => c.slug) || []

    const _transformedFields = transformExtraFields(
      props.fields ? props.fields : null,
      _config,
      props.enabledCollections,
      props.disabledCollections,
      props.maxDepth,
    )

    const sanitizedFields = await sanitizeFields({
      config: _config as unknown as Config,
      fields: _transformedFields,
      parentIsLocalized,
      requireFieldLevelRichTextEditor: isRoot,
      validRelationships,
    })
    props.fields = sanitizedFields

    // the text field is not included in the node data.
    // Thus, for tasks like validation, we do not want to pass it a text field in the schema which will never have data.
    // Otherwise, it will cause a validation error (field is required).
    const sanitizedFieldsWithoutText = sanitizedFields.filter(
      (field) => !('name' in field) || field.name !== 'text',
    )

    let linkTypeField: Field | null = null
    let linkURLField: Field | null = null

    for (const field of sanitizedFields) {
      if ('name' in field && field.name === 'linkType') {
        linkTypeField = field
      }

      if ('name' in field && field.name === 'url') {
        linkURLField = field
      }
    }

    const defaultLinkType = linkTypeField
      ? 'defaultValue' in linkTypeField && typeof linkTypeField.defaultValue === 'string'
        ? linkTypeField.defaultValue
        : 'custom'
      : undefined

    const defaultLinkURL = linkURLField
      ? 'defaultValue' in linkURLField && typeof linkURLField.defaultValue === 'string'
        ? linkURLField.defaultValue
        : 'https://'
      : undefined

    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#LinkFeatureClient',
      clientFeatureProps: {
        defaultLinkType,
        defaultLinkURL,
        disableAutoLinks: props.disableAutoLinks,
        disabledCollections: props.disabledCollections,
        enabledCollections: props.enabledCollections,
      } as ClientProps,
      generateSchemaMap: () => {
        if (!sanitizedFields || !Array.isArray(sanitizedFields) || sanitizedFields.length === 0) {
          return null
        }

        const schemaMap: FieldSchemaMap = new Map()
        schemaMap.set('fields', {
          fields: sanitizedFields,
        })

        return schemaMap
      },
      i18n,
      markdownTransformers: [LinkMarkdownTransformer],
      nodes: [
        props?.disableAutoLinks === true
          ? null
          : createNode({
              converters: {
                html: {
                  converter: async ({
                    converters,
                    currentDepth,
                    depth,
                    draft,
                    node,
                    overrideAccess,
                    parent,
                    req,
                    showHiddenFields,
                  }) => {
                    const childrenText = await convertLexicalNodesToHTML({
                      converters,
                      currentDepth,
                      depth,
                      draft,
                      lexicalNodes: node.children,
                      overrideAccess,
                      parent: {
                        ...node,
                        parent,
                      },
                      req,
                      showHiddenFields,
                    })

                    let href: string = node.fields.url ?? ''
                    if (node.fields.linkType === 'internal') {
                      href =
                        typeof node.fields.doc?.value !== 'object'
                          ? String(node.fields.doc?.value)
                          : String(node.fields.doc?.value?.id)
                    }

                    return `<a href="${href}"${node.fields.newTab ? ' rel="noopener noreferrer" target="_blank"' : ''}>${childrenText}</a>`
                  },
                  nodeTypes: [AutoLinkNode.getType()],
                },
              },
              node: AutoLinkNode,
              // Since AutoLinkNodes are just internal links, they need no hooks or graphQL population promises
              validations: [linkValidation(props, sanitizedFieldsWithoutText)],
            }),
        createNode({
          converters: {
            html: {
              converter: async ({
                converters,
                currentDepth,
                depth,
                draft,
                node,
                overrideAccess,
                parent,
                req,
                showHiddenFields,
              }) => {
                const childrenText = await convertLexicalNodesToHTML({
                  converters,
                  currentDepth,
                  depth,
                  draft,
                  lexicalNodes: node.children,
                  overrideAccess,
                  parent: {
                    ...node,
                    parent,
                  },
                  req,
                  showHiddenFields,
                })

                const href: string =
                  node.fields.linkType === 'custom'
                    ? escapeHTML(node.fields.url)
                    : (node.fields.doc?.value as string)

                return `<a href="${href}"${node.fields.newTab ? ' rel="noopener noreferrer" target="_blank"' : ''}>${childrenText}</a>`
              },
              nodeTypes: [LinkNode.getType()],
            },
          },
          getSubFields: () => {
            return sanitizedFieldsWithoutText
          },
          getSubFieldsData: ({ node }) => {
            return node?.fields
          },
          graphQLPopulationPromises: [linkPopulationPromiseHOC(props)],
          node: LinkNode,
          validations: [linkValidation(props, sanitizedFieldsWithoutText)],
        }),
      ].filter(Boolean) as Array<NodeWithHooks>,
      sanitizedServerFeatureProps: props,
    }
  },
  key: 'link',
})
