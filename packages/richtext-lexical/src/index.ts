import type { JSONSchema4 } from 'json-schema'
import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

import {
  afterChangeTraverseFields,
  afterReadTraverseFields,
  beforeChangeTraverseFields,
  beforeValidateTraverseFields,
  checkDependencies,
  withNullableJSONSchemaType,
} from 'payload'

import type { FeatureProviderServer, ResolvedServerFeatureMap } from './features/typesServer.js'
import type { SanitizedServerEditorConfig } from './lexical/config/types.js'
import type { AdapterProps, LexicalEditorProps, LexicalRichTextAdapterProvider } from './types.js'

import { getDefaultSanitizedEditorConfig } from './getDefaultSanitizedEditorConfig.js'
import { i18n } from './i18n.js'
import { defaultEditorFeatures } from './lexical/config/server/default.js'
import { populateLexicalPopulationPromises } from './populateGraphQL/populateLexicalPopulationPromises.js'
import { featuresInputToEditorConfig } from './utilities/editorConfigFactory.js'
import { getGenerateImportMap } from './utilities/generateImportMap.js'
import { getGenerateSchemaMap } from './utilities/generateSchemaMap.js'
import { recurseNodeTree } from './utilities/recurseNodeTree.js'
import { richTextValidateHOC } from './validate/index.js'

let checkedDependencies = false

export const lexicalTargetVersion = '0.28.0'

export function lexicalEditor(args?: LexicalEditorProps): LexicalRichTextAdapterProvider {
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.PAYLOAD_DISABLE_DEPENDENCY_CHECKER !== 'true' &&
    !checkedDependencies
  ) {
    checkedDependencies = true
    void checkDependencies({
      dependencyGroups: [
        {
          name: 'lexical',
          dependencies: [
            'lexical',
            '@lexical/headless',
            '@lexical/link',
            '@lexical/list',
            '@lexical/mark',
            '@lexical/react',
            '@lexical/rich-text',
            '@lexical/selection',
            '@lexical/utils',
          ],
          targetVersion: lexicalTargetVersion,
        },
      ],
    })
  }
  return async ({ config, isRoot, parentIsLocalized }) => {
    let features: FeatureProviderServer<unknown, unknown, unknown>[] = []
    let resolvedFeatureMap: ResolvedServerFeatureMap

    let finalSanitizedEditorConfig: SanitizedServerEditorConfig // For server only
    if (!args || (!args.features && !args.lexical)) {
      finalSanitizedEditorConfig = await getDefaultSanitizedEditorConfig({
        config,
        parentIsLocalized,
      })

      features = defaultEditorFeatures

      resolvedFeatureMap = finalSanitizedEditorConfig.resolvedFeatureMap
    } else {
      const result = await featuresInputToEditorConfig({
        config,
        features: args?.features,
        isRoot,
        lexical: args?.lexical,
        parentIsLocalized,
      })
      finalSanitizedEditorConfig = result.sanitizedConfig
      features = result.features
      resolvedFeatureMap = result.resolvedFeatureMap
    }

    const featureI18n = finalSanitizedEditorConfig.features.i18n
    for (const lang in i18n) {
      if (!featureI18n[lang as keyof typeof featureI18n]) {
        featureI18n[lang as keyof typeof featureI18n] = {
          lexical: {},
        }
      }
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      featureI18n[lang].lexical.general = i18n[lang]
    }

    return {
      CellComponent: {
        path: '@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell',
        serverProps: {
          admin: args?.admin,
          sanitizedEditorConfig: finalSanitizedEditorConfig,
        },
      },
      DiffComponent: {
        path: '@payloadcms/richtext-lexical/rsc#LexicalDiffComponent',
        serverProps: {
          admin: args?.admin,
          sanitizedEditorConfig: finalSanitizedEditorConfig,
        },
      },
      editorConfig: finalSanitizedEditorConfig,
      features,
      FieldComponent: {
        path: '@payloadcms/richtext-lexical/rsc#RscEntryLexicalField',
        serverProps: {
          admin: args?.admin,
          sanitizedEditorConfig: finalSanitizedEditorConfig,
        },
      },
      generateImportMap: getGenerateImportMap({
        resolvedFeatureMap,
      }),
      generateSchemaMap: getGenerateSchemaMap({
        resolvedFeatureMap,
      }),
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
        // check if there are any features with nodes which have populationPromises for this field
        if (finalSanitizedEditorConfig?.features?.graphQLPopulationPromises?.size) {
          populateLexicalPopulationPromises({
            context,
            currentDepth: currentDepth ?? 0,
            depth,
            draft,
            editorPopulationPromises: finalSanitizedEditorConfig.features.graphQLPopulationPromises,
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
        afterChange: [
          async (args) => {
            const {
              collection,
              context: _context,
              data,
              field,
              global,
              indexPath,
              operation,
              originalDoc,
              parentIsLocalized,
              path,
              previousDoc,
              previousValue,
              req,
              schemaPath,
            } = args

            let { value } = args
            if (finalSanitizedEditorConfig?.features?.hooks?.afterChange?.length) {
              for (const hook of finalSanitizedEditorConfig.features.hooks.afterChange) {
                value = await hook(args)
              }
            }
            if (
              !finalSanitizedEditorConfig.features.nodeHooks?.afterChange?.size &&
              !finalSanitizedEditorConfig.features.getSubFields?.size
            ) {
              return value
            }
            // TO-DO: We should not use context, as it is intended for external use only
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const context: any = _context
            const nodeIDMap: {
              [key: string]: SerializedLexicalNode
            } = {}

            const previousNodeIDMap: {
              [key: string]: SerializedLexicalNode
            } = {}

            /**
             * Get the originalNodeIDMap from the beforeValidate hook, which is always run before this hook.
             */
            const originalNodeIDMap: {
              [key: string]: SerializedLexicalNode
            } = context?.internal?.richText?.[path.join('.')]?.originalNodeIDMap

            if (!originalNodeIDMap || !Object.keys(originalNodeIDMap).length || !value) {
              return value
            }

            recurseNodeTree({
              nodeIDMap,
              nodes: (value as SerializedEditorState)?.root?.children ?? [],
            })

            recurseNodeTree({
              nodeIDMap: previousNodeIDMap,
              nodes: (previousValue as SerializedEditorState)?.root?.children ?? [],
            })

            // eslint-disable-next-line prefer-const
            for (let [id, node] of Object.entries(nodeIDMap)) {
              const afterChangeHooks = finalSanitizedEditorConfig.features.nodeHooks?.afterChange
              const afterChangeHooksForNode = afterChangeHooks?.get(node.type)
              if (afterChangeHooksForNode) {
                for (const hook of afterChangeHooksForNode) {
                  if (!originalNodeIDMap[id]) {
                    console.warn(
                      '(afterChange) No original node found for node with id',
                      id,
                      'node:',
                      node,
                      'path',
                      path.join('.'),
                    )
                    continue
                  }
                  node = await hook({
                    context,
                    node,
                    operation,
                    originalNode: originalNodeIDMap[id],
                    parentRichTextFieldPath: path,
                    parentRichTextFieldSchemaPath: schemaPath,

                    previousNode: previousNodeIDMap[id]!,
                    req,
                  })
                }
              }
              const subFieldFn = finalSanitizedEditorConfig.features.getSubFields?.get(node.type)
              const subFieldDataFn = finalSanitizedEditorConfig.features.getSubFieldsData?.get(
                node.type,
              )

              if (subFieldFn && subFieldDataFn) {
                const subFields = subFieldFn({ node, req })
                const nodeSiblingData = subFieldDataFn({ node, req }) ?? {}

                const nodeSiblingDoc = subFieldDataFn({ node: originalNodeIDMap[id]!, req }) ?? {}
                const nodePreviousSiblingDoc =
                  subFieldDataFn({ node: previousNodeIDMap[id]!, req }) ?? {}

                if (subFields?.length) {
                  await afterChangeTraverseFields({
                    blockData: nodeSiblingData,
                    collection,
                    context,
                    data: data ?? {},
                    doc: originalDoc,
                    fields: subFields,
                    global,
                    operation,
                    parentIndexPath: indexPath.join('-'),
                    parentIsLocalized: parentIsLocalized || field.localized || false,
                    parentPath: path.join('.'),
                    parentSchemaPath: schemaPath.join('.'),
                    previousDoc,
                    previousSiblingDoc: { ...nodePreviousSiblingDoc },
                    req,
                    siblingData: nodeSiblingData || {},
                    siblingDoc: { ...nodeSiblingDoc },
                  })
                }
              }
            }
            return value
          },
        ],
        afterRead: [
          /**
           * afterRead hooks do not receive the originalNode. Thus, they can run on all nodes, not just nodes with an ID.
           */
          async (args) => {
            const {
              collection,
              context: context,
              currentDepth,
              depth,
              draft,
              fallbackLocale,
              field,
              fieldPromises,
              findMany,
              flattenLocales,
              global,
              indexPath,
              locale,
              originalDoc,
              overrideAccess,
              parentIsLocalized,
              path,
              populate,
              populationPromises,
              req,
              schemaPath,
              showHiddenFields,
              triggerAccessControl,
              triggerHooks,
            } = args

            let { value } = args

            if (finalSanitizedEditorConfig?.features?.hooks?.afterRead?.length) {
              for (const hook of finalSanitizedEditorConfig.features.hooks.afterRead) {
                value = await hook(args)
              }
            }

            if (
              !finalSanitizedEditorConfig.features.nodeHooks?.afterRead?.size &&
              !finalSanitizedEditorConfig.features.getSubFields?.size
            ) {
              return value
            }
            const flattenedNodes: SerializedLexicalNode[] = []

            recurseNodeTree({
              flattenedNodes,
              nodes: (value as SerializedEditorState)?.root?.children ?? [],
            })

            for (let node of flattenedNodes) {
              const afterReadHooks = finalSanitizedEditorConfig.features.nodeHooks?.afterRead
              const afterReadHooksForNode = afterReadHooks?.get(node.type)
              if (afterReadHooksForNode) {
                for (const hook of afterReadHooksForNode) {
                  node = await hook({
                    context,
                    currentDepth: currentDepth!,
                    depth: depth!,
                    draft: draft!,
                    fallbackLocale: fallbackLocale!,
                    fieldPromises: fieldPromises!,
                    findMany: findMany!,
                    flattenLocales: flattenLocales!,
                    locale: locale!,
                    node,
                    overrideAccess: overrideAccess!,
                    parentRichTextFieldPath: path,
                    parentRichTextFieldSchemaPath: schemaPath,
                    populateArg: populate,
                    populationPromises: populationPromises!,
                    req,
                    showHiddenFields: showHiddenFields!,
                    triggerAccessControl: triggerAccessControl!,
                    triggerHooks: triggerHooks!,
                  })
                }
              }
              const subFieldFn = finalSanitizedEditorConfig.features.getSubFields?.get(node.type)
              const subFieldDataFn = finalSanitizedEditorConfig.features.getSubFieldsData?.get(
                node.type,
              )

              if (subFieldFn && subFieldDataFn) {
                const subFields = subFieldFn({ node, req })
                const nodeSiblingData = subFieldDataFn({ node, req }) ?? {}

                if (subFields?.length) {
                  afterReadTraverseFields({
                    blockData: nodeSiblingData,
                    collection,
                    context,
                    currentDepth: currentDepth!,
                    depth: depth!,
                    doc: originalDoc,
                    draft: draft!,
                    fallbackLocale: fallbackLocale!,
                    fieldPromises: fieldPromises!,
                    fields: subFields,
                    findMany: findMany!,
                    flattenLocales: flattenLocales!,
                    global,
                    locale: locale!,
                    overrideAccess: overrideAccess!,
                    parentIndexPath: indexPath.join('-'),
                    parentIsLocalized: parentIsLocalized || field.localized || false,
                    parentPath: path.join('.'),
                    parentSchemaPath: schemaPath.join('.'),
                    populate,
                    populationPromises: populationPromises!,
                    req,
                    showHiddenFields: showHiddenFields!,
                    siblingDoc: nodeSiblingData,
                    triggerAccessControl,
                    triggerHooks,
                  })
                }
              }
            }

            return value
          },
        ],
        beforeChange: [
          async (args) => {
            const {
              collection,
              context: _context,
              data,
              docWithLocales,
              errors,
              field,
              fieldLabelPath,
              global,
              indexPath,
              mergeLocaleActions,
              operation,
              originalDoc,
              parentIsLocalized,
              path,
              previousValue,
              req,
              schemaPath,
              siblingData,
              siblingDocWithLocales,
              skipValidation,
            } = args

            let { value } = args

            if (finalSanitizedEditorConfig?.features?.hooks?.beforeChange?.length) {
              for (const hook of finalSanitizedEditorConfig.features.hooks.beforeChange) {
                value = await hook(args)
              }
            }

            if (
              !finalSanitizedEditorConfig.features.nodeHooks?.beforeChange?.size &&
              !finalSanitizedEditorConfig.features.getSubFields?.size
            ) {
              return value
            }

            // TO-DO: We should not use context, as it is intended for external use only
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const context: any = _context
            const nodeIDMap: {
              [key: string]: SerializedLexicalNode
            } = {}

            /**
             * Get the originalNodeIDMap from the beforeValidate hook, which is always run before this hook.
             */
            const originalNodeIDMap: {
              [key: string]: SerializedLexicalNode
            } = context?.internal?.richText?.[path.join('.')]?.originalNodeIDMap

            if (!originalNodeIDMap || !Object.keys(originalNodeIDMap).length || !value) {
              return value
            }
            const previousNodeIDMap: {
              [key: string]: SerializedLexicalNode
            } = {}
            const originalNodeWithLocalesIDMap: {
              [key: string]: SerializedLexicalNode
            } = {}

            recurseNodeTree({
              nodeIDMap,
              nodes: (value as SerializedEditorState)?.root?.children ?? [],
            })

            recurseNodeTree({
              nodeIDMap: previousNodeIDMap,
              nodes: (previousValue as SerializedEditorState)?.root?.children ?? [],
            })
            if (field.name && siblingDocWithLocales?.[field.name]) {
              recurseNodeTree({
                nodeIDMap: originalNodeWithLocalesIDMap,
                nodes:
                  (siblingDocWithLocales[field.name] as SerializedEditorState)?.root?.children ??
                  [],
              })
            }

            // eslint-disable-next-line prefer-const
            for (let [id, node] of Object.entries(nodeIDMap)) {
              const beforeChangeHooks = finalSanitizedEditorConfig.features.nodeHooks?.beforeChange
              const beforeChangeHooksForNode = beforeChangeHooks?.get(node.type)
              if (beforeChangeHooksForNode) {
                for (const hook of beforeChangeHooksForNode) {
                  if (!originalNodeIDMap[id]) {
                    console.warn(
                      '(beforeChange) No original node found for node with id',
                      id,
                      'node:',
                      node,
                      'path',
                      path.join('.'),
                    )
                    continue
                  }
                  node = await hook({
                    context,
                    errors: errors!,
                    mergeLocaleActions: mergeLocaleActions!,
                    node,
                    operation: operation!,
                    originalNode: originalNodeIDMap[id],
                    originalNodeWithLocales: originalNodeWithLocalesIDMap[id],
                    parentRichTextFieldPath: path,
                    parentRichTextFieldSchemaPath: schemaPath,

                    previousNode: previousNodeIDMap[id]!,
                    req,
                    skipValidation: skipValidation!,
                  })
                }
              }

              const subFieldFn = finalSanitizedEditorConfig.features.getSubFields?.get(node.type)
              const subFieldDataFn = finalSanitizedEditorConfig.features.getSubFieldsData?.get(
                node.type,
              )

              if (subFieldFn && subFieldDataFn) {
                const subFields = subFieldFn({ node, req })
                const nodeSiblingData = subFieldDataFn({ node, req }) ?? {}
                const nodeSiblingDocWithLocales =
                  subFieldDataFn({
                    node: originalNodeWithLocalesIDMap[id]!,
                    req,
                  }) ?? {}
                const nodePreviousSiblingDoc =
                  subFieldDataFn({ node: previousNodeIDMap[id]!, req }) ?? {}

                if (subFields?.length) {
                  await beforeChangeTraverseFields({
                    id,
                    blockData: nodeSiblingData,
                    collection,
                    context,
                    data: data ?? {},
                    doc: originalDoc ?? {},
                    docWithLocales: docWithLocales ?? {},
                    errors: errors!,
                    fieldLabelPath,
                    fields: subFields,
                    global,
                    mergeLocaleActions: mergeLocaleActions!,
                    operation: operation!,
                    parentIndexPath: indexPath.join('-'),
                    parentIsLocalized: parentIsLocalized || field.localized || false,
                    parentPath: path.join('.'),
                    parentSchemaPath: schemaPath.join('.'),
                    req,
                    siblingData: nodeSiblingData,
                    siblingDoc: nodePreviousSiblingDoc,
                    siblingDocWithLocales: nodeSiblingDocWithLocales ?? {},
                    skipValidation,
                  })
                }
              }
            }

            /**
             * within the beforeChange hook, id's may be re-generated.
             * Example:
             * 1. Seed data contains IDs for block feature blocks.
             * 2. Those are used in beforeValidate
             * 3. in beforeChange, those IDs are regenerated, because you cannot provide IDs during document creation. See baseIDField beforeChange hook for reasoning
             * 4. Thus, in order for all post-beforeChange hooks to receive the correct ID, we need to update the originalNodeIDMap with the new ID's, by regenerating the nodeIDMap.
             * The reason this is not generated for every hook, is to save on performance. We know we only really have to generate it in beforeValidate, which is the first hook,
             * and in beforeChange, which is where modifications to the provided IDs can occur.
             */
            const newOriginalNodeIDMap: {
              [key: string]: SerializedLexicalNode
            } = {}

            const previousOriginalValue = siblingData[field.name!]

            recurseNodeTree({
              nodeIDMap: newOriginalNodeIDMap,
              nodes: (previousOriginalValue as SerializedEditorState)?.root?.children ?? [],
            })

            if (!context.internal) {
              // Add to context, for other hooks to use
              context.internal = {}
            }
            if (!context.internal.richText) {
              context.internal.richText = {}
            }
            context.internal.richText[path.join('.')] = {
              originalNodeIDMap: newOriginalNodeIDMap,
            }

            return value
          },
        ],
        beforeValidate: [
          async (args) => {
            const {
              collection,
              context,
              data,
              field,
              global,
              indexPath,
              operation,
              originalDoc,
              overrideAccess,
              parentIsLocalized,
              path,
              previousValue,
              req,
              schemaPath,
            } = args

            let { value } = args
            if (finalSanitizedEditorConfig?.features?.hooks?.beforeValidate?.length) {
              for (const hook of finalSanitizedEditorConfig.features.hooks.beforeValidate) {
                value = await hook(args)
              }
            }

            // return value if there are NO hooks
            if (
              !finalSanitizedEditorConfig.features.nodeHooks?.beforeValidate?.size &&
              !finalSanitizedEditorConfig.features.nodeHooks?.afterChange?.size &&
              !finalSanitizedEditorConfig.features.nodeHooks?.beforeChange?.size &&
              !finalSanitizedEditorConfig.features.getSubFields?.size
            ) {
              return value
            }

            /**
             * beforeValidate is the first field hook which runs. This is where we can create the node map, which can then be used in the other hooks.
             *
             */

            /**
             * flattenedNodes contains all nodes in the editor, in the order they appear in the editor. They will be used for the following hooks:
             * - afterRead
             *
             * The other hooks require nodes to have IDs, which is why those are ran only from the nodeIDMap. They require IDs because they have both doc/siblingDoc and data/siblingData, and
             * thus require a reliable way to match new node data to old node data. Given that node positions can change in between hooks, this is only reliably possible for nodes which are saved with
             * an ID.
             */
            //const flattenedNodes: SerializedLexicalNode[] = []

            /**
             * Only nodes with id's (so, nodes with hooks added to them) will be added to the nodeIDMap. They will be used for the following hooks:
             * - afterChange
             * - beforeChange
             * - beforeValidate
             *
             * Other hooks are handled by the flattenedNodes. All nodes in the nodeIDMap are part of flattenedNodes.
             */

            const originalNodeIDMap: {
              [key: string]: SerializedLexicalNode
            } = {}

            recurseNodeTree({
              nodeIDMap: originalNodeIDMap,
              nodes: (previousValue as SerializedEditorState)?.root?.children ?? [],
            })

            if (!context.internal) {
              // Add to context, for other hooks to use
              context.internal = {}
            }
            if (!(context as any).internal.richText) {
              ;(context as any).internal.richText = {}
            }
            ;(context as any).internal.richText[path.join('.')] = {
              originalNodeIDMap,
            }

            /**
             * Now that the maps for all hooks are set up, we can run the validate hook
             */
            if (!finalSanitizedEditorConfig.features.nodeHooks?.beforeValidate?.size) {
              return value
            }
            const nodeIDMap: {
              [key: string]: SerializedLexicalNode
            } = {}
            recurseNodeTree({
              //flattenedNodes,
              nodeIDMap,
              nodes: (value as SerializedEditorState)?.root?.children ?? [],
            })

            // eslint-disable-next-line prefer-const
            for (let [id, node] of Object.entries(nodeIDMap)) {
              const beforeValidateHooks =
                finalSanitizedEditorConfig.features.nodeHooks.beforeValidate
              const beforeValidateHooksForNode = beforeValidateHooks?.get(node.type)
              if (beforeValidateHooksForNode) {
                for (const hook of beforeValidateHooksForNode) {
                  if (!originalNodeIDMap[id]) {
                    console.warn(
                      '(beforeValidate) No original node found for node with id',
                      id,
                      'node:',
                      node,
                      'path',
                      path.join('.'),
                    )
                    continue
                  }
                  node = await hook({
                    context,
                    node,
                    operation,
                    originalNode: originalNodeIDMap[id],
                    overrideAccess: overrideAccess!,
                    parentRichTextFieldPath: path,
                    parentRichTextFieldSchemaPath: schemaPath,
                    req,
                  })
                }
              }
              const subFieldFn = finalSanitizedEditorConfig.features.getSubFields?.get(node.type)
              const subFieldDataFn = finalSanitizedEditorConfig.features.getSubFieldsData?.get(
                node.type,
              )

              if (subFieldFn && subFieldDataFn) {
                const subFields = subFieldFn({ node, req })
                const nodeSiblingData = subFieldDataFn({ node, req }) ?? {}

                const nodeSiblingDoc = subFieldDataFn({ node: originalNodeIDMap[id]!, req }) ?? {}

                if (subFields?.length) {
                  await beforeValidateTraverseFields({
                    id,
                    blockData: nodeSiblingData,
                    collection,
                    context,
                    data,
                    doc: originalDoc,
                    fields: subFields,
                    global,
                    operation,
                    overrideAccess: overrideAccess!,
                    parentIndexPath: indexPath.join('-'),
                    parentIsLocalized: parentIsLocalized || field.localized || false,
                    parentPath: path.join('.'),
                    parentSchemaPath: schemaPath.join('.'),
                    req,
                    siblingData: nodeSiblingData,
                    siblingDoc: nodeSiblingDoc,
                  })
                }
              }
            }

            return value
          },
        ],
      },
      i18n: featureI18n,
      outputSchema: ({
        collectionIDFieldTypes,
        config,
        field,
        i18n,
        interfaceNameDefinitions,
        isRequired,
      }) => {
        let outputSchema: JSONSchema4 = {
          // This schema matches the SerializedEditorState type so far, that it's possible to cast SerializedEditorState to this schema without any errors.
          // In the future, we should
          // 1) allow recursive children
          // 2) Pass in all the different types for every node added to the editorconfig. This can be done with refs in the schema.
          type: withNullableJSONSchemaType('object', isRequired),
          properties: {
            root: {
              type: 'object',
              additionalProperties: false,
              properties: {
                type: {
                  type: 'string',
                },
                children: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: true,
                    properties: {
                      type: {
                        type: 'string',
                      },
                      version: {
                        type: 'integer',
                      },
                    },
                    required: ['type', 'version'],
                  },
                },
                direction: {
                  oneOf: [
                    {
                      enum: ['ltr', 'rtl'],
                    },
                    {
                      type: 'null',
                    },
                  ],
                },
                format: {
                  type: 'string',
                  enum: ['left', 'start', 'center', 'right', 'end', 'justify', ''], // ElementFormatType, since the root node is an element
                },
                indent: {
                  type: 'integer',
                },
                version: {
                  type: 'integer',
                },
              },
              required: ['children', 'direction', 'format', 'indent', 'type', 'version'],
            },
          },
          required: ['root'],
        }
        for (const modifyOutputSchema of finalSanitizedEditorConfig.features.generatedTypes
          .modifyOutputSchemas) {
          outputSchema = modifyOutputSchema({
            collectionIDFieldTypes,
            config,
            currentSchema: outputSchema,
            field,
            i18n,
            interfaceNameDefinitions,
            isRequired,
          })
        }

        return outputSchema
      },
      validate: richTextValidateHOC({
        editorConfig: finalSanitizedEditorConfig,
      }),
    }
  }
}

export { AlignFeature } from './features/align/server/index.js'
export { BlockquoteFeature } from './features/blockquote/server/index.js'
export { BlocksFeature, type BlocksFeatureProps } from './features/blocks/server/index.js'
export {
  $createServerBlockNode,
  $isServerBlockNode,
  type BlockFields,
  ServerBlockNode,
} from './features/blocks/server/nodes/BlocksNode.js'

export { convertHTMLToLexical } from './features/converters/htmlToLexical/index.js'

export { lexicalHTMLField } from './features/converters/lexicalToHtml/async/field/index.js'
export { LinebreakHTMLConverter } from './features/converters/lexicalToHtml_deprecated/converter/converters/linebreak.js'

export { ParagraphHTMLConverter } from './features/converters/lexicalToHtml_deprecated/converter/converters/paragraph.js'

export { TabHTMLConverter } from './features/converters/lexicalToHtml_deprecated/converter/converters/tab.js'
export { TextHTMLConverter } from './features/converters/lexicalToHtml_deprecated/converter/converters/text.js'
export { defaultHTMLConverters } from './features/converters/lexicalToHtml_deprecated/converter/defaultConverters.js'

export {
  convertLexicalNodesToHTML,
  convertLexicalToHTML,
} from './features/converters/lexicalToHtml_deprecated/converter/index.js'
export type { HTMLConverter } from './features/converters/lexicalToHtml_deprecated/converter/types.js'
export {
  consolidateHTMLConverters,
  lexicalHTML,
} from './features/converters/lexicalToHtml_deprecated/field/index.js'
export {
  HTMLConverterFeature,
  type HTMLConverterFeatureProps,
} from './features/converters/lexicalToHtml_deprecated/index.js'
export { convertLexicalToMarkdown } from './features/converters/lexicalToMarkdown/index.js'
export { convertMarkdownToLexical } from './features/converters/markdownToLexical/index.js'
export { getPayloadPopulateFn } from './features/converters/utilities/payloadPopulateFn.js'

export { getRestPopulateFn } from './features/converters/utilities/restPopulateFn.js'
export { DebugJsxConverterFeature } from './features/debug/jsxConverter/server/index.js'
export { TestRecorderFeature } from './features/debug/testRecorder/server/index.js'
export { TreeViewFeature } from './features/debug/treeView/server/index.js'
export { EXPERIMENTAL_TableFeature } from './features/experimental_table/server/index.js'
export { BoldFeature } from './features/format/bold/feature.server.js'
export { InlineCodeFeature } from './features/format/inlineCode/feature.server.js'

export { ItalicFeature } from './features/format/italic/feature.server.js'
export { StrikethroughFeature } from './features/format/strikethrough/feature.server.js'
export { SubscriptFeature } from './features/format/subscript/feature.server.js'
export { SuperscriptFeature } from './features/format/superscript/feature.server.js'
export { UnderlineFeature } from './features/format/underline/feature.server.js'
export { HeadingFeature, type HeadingFeatureProps } from './features/heading/server/index.js'
export { HorizontalRuleFeature } from './features/horizontalRule/server/index.js'

export { IndentFeature } from './features/indent/server/index.js'

export { AutoLinkNode } from './features/link/nodes/AutoLinkNode.js'
export { LinkNode } from './features/link/nodes/LinkNode.js'
export type { LinkFields } from './features/link/nodes/types.js'
export { LinkFeature, type LinkFeatureServerProps } from './features/link/server/index.js'
export { ChecklistFeature } from './features/lists/checklist/server/index.js'
export { OrderedListFeature } from './features/lists/orderedList/server/index.js'

export { UnorderedListFeature } from './features/lists/unorderedList/server/index.js'

export type {
  SlateNode,
  SlateNodeConverter,
} from './features/migrations/slateToLexical/converter/types.js'
export { ParagraphFeature } from './features/paragraph/server/index.js'
export {
  RelationshipFeature,
  type RelationshipFeatureProps,
} from './features/relationship/server/index.js'

export {
  type RelationshipData,
  RelationshipServerNode,
} from './features/relationship/server/nodes/RelationshipNode.js'
export { FixedToolbarFeature } from './features/toolbars/fixed/server/index.js'

export { InlineToolbarFeature } from './features/toolbars/inline/server/index.js'
export type { ToolbarGroup, ToolbarGroupItem } from './features/toolbars/types.js'
export type {
  BaseClientFeatureProps,
  ClientFeature,
  ClientFeatureProviderMap,
  FeatureProviderClient,
  FeatureProviderProviderClient,
  PluginComponent,
  PluginComponentWithAnchor,
  ResolvedClientFeature,
  ResolvedClientFeatureMap,
  SanitizedClientFeatures,
  SanitizedPlugin,
} from './features/typesClient.js'

export type {
  AfterChangeNodeHook,
  AfterChangeNodeHookArgs,
  AfterReadNodeHook,
  AfterReadNodeHookArgs,
  BaseNodeHookArgs,
  BeforeChangeNodeHook,
  BeforeChangeNodeHookArgs,
  BeforeValidateNodeHook,
  BeforeValidateNodeHookArgs,
  FeatureProviderProviderServer,
  FeatureProviderServer,
  NodeValidation,
  NodeWithHooks,
  PopulationPromise,
  ResolvedServerFeature,
  ResolvedServerFeatureMap,
  SanitizedServerFeatures,
  ServerFeature,
  ServerFeatureProviderMap,
} from './features/typesServer.js'

export { createNode } from './features/typeUtilities.js' // Only useful in feature.server.ts

export { UploadFeature } from './features/upload/server/index.js'
export type { UploadFeatureProps } from './features/upload/server/index.js'

export { type UploadData, UploadServerNode } from './features/upload/server/nodes/UploadNode.js'
export type { EditorConfigContextType } from './lexical/config/client/EditorConfigProvider.js'

export {
  defaultEditorConfig,
  defaultEditorFeatures,
  defaultEditorLexicalConfig,
} from './lexical/config/server/default.js'
export { loadFeatures, sortFeaturesForOptimalLoading } from './lexical/config/server/loader.js'

export {
  sanitizeServerEditorConfig,
  sanitizeServerFeatures,
} from './lexical/config/server/sanitize.js'
export type {
  ClientEditorConfig,
  SanitizedClientEditorConfig,
  SanitizedServerEditorConfig,
  ServerEditorConfig,
} from './lexical/config/types.js'
export type { AdapterProps }

export { getEnabledNodes, getEnabledNodesFromServerNodes } from './lexical/nodes/index.js'

export type {
  SlashMenuGroup,
  SlashMenuItem,
} from './lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types.js'
export {
  DETAIL_TYPE_TO_DETAIL,
  DOUBLE_LINE_BREAK,
  ELEMENT_FORMAT_TO_TYPE,
  ELEMENT_TYPE_TO_FORMAT,
  IS_ALL_FORMATTING,
  LTR_REGEX,
  NodeFormat,
  NON_BREAKING_SPACE,
  RTL_REGEX,
  TEXT_MODE_TO_TYPE,
  TEXT_TYPE_TO_FORMAT,
  TEXT_TYPE_TO_MODE,
} from './lexical/utils/nodeFormat.js'

export { sanitizeUrl, validateUrl } from './lexical/utils/url.js'

export type * from './nodeTypes.js'

export { $convertFromMarkdownString } from './packages/@lexical/markdown/index.js'
export { defaultRichTextValue } from './populateGraphQL/defaultValue.js'
export { populate } from './populateGraphQL/populate.js'

export type { LexicalEditorProps, LexicalFieldAdminProps, LexicalRichTextAdapter } from './types.js'

export { createServerFeature } from './utilities/createServerFeature.js'
export { editorConfigFactory } from './utilities/editorConfigFactory.js'

export type { FieldsDrawerProps } from './utilities/fieldsDrawer/Drawer.js'
export { extractPropsFromJSXPropsString } from './utilities/jsx/extractPropsFromJSXPropsString.js'

export {
  extractFrontmatter,
  frontmatterToObject,
  objectToFrontmatter,
  propsToJSXString,
} from './utilities/jsx/jsx.js'

export { upgradeLexicalData } from './utilities/upgradeLexicalData/index.js'
