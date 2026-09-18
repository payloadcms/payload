import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

import {
  afterChangeTraverseFields,
  afterReadTraverseFields,
  beforeChangeTraverseFields,
  beforeValidateTraverseFields,
  type RichTextHooks,
} from 'payload'

import type { SanitizedServerEditorConfig } from './lexical/config/types.js'

import { recurseNodeTree } from './utilities/recurseNodeTree.js'

export const getLexicalHooks: (args: {
  editorConfig: SanitizedServerEditorConfig
}) => RichTextHooks = ({ editorConfig }) => {
  return {
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
        if (editorConfig?.features?.hooks?.afterChange?.length) {
          for (const hook of editorConfig.features.hooks.afterChange) {
            value = await hook(args)
          }
        }
        if (
          !editorConfig.features.nodeHooks?.afterChange?.size &&
          !editorConfig.features.getSubFields?.size
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
          const afterChangeHooks = editorConfig.features.nodeHooks?.afterChange
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
          const subFieldFn = editorConfig.features.getSubFields?.get(node.type)
          const subFieldDataFn = editorConfig.features.getSubFieldsData?.get(node.type)

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

        if (editorConfig?.features?.hooks?.afterRead?.length) {
          for (const hook of editorConfig.features.hooks.afterRead) {
            value = await hook(args)
          }
        }

        if (
          !editorConfig.features.nodeHooks?.afterRead?.size &&
          !editorConfig.features.getSubFields?.size
        ) {
          return value
        }
        const flattenedNodes: SerializedLexicalNode[] = []

        recurseNodeTree({
          flattenedNodes,
          nodes: (value as SerializedEditorState)?.root?.children ?? [],
        })

        for (let node of flattenedNodes) {
          const afterReadHooks = editorConfig.features.nodeHooks?.afterRead
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
          const subFieldFn = editorConfig.features.getSubFields?.get(node.type)
          const subFieldDataFn = editorConfig.features.getSubFieldsData?.get(node.type)

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
          overrideAccess,
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

        if (editorConfig?.features?.hooks?.beforeChange?.length) {
          for (const hook of editorConfig.features.hooks.beforeChange) {
            value = await hook(args)
          }
        }

        if (
          !editorConfig.features.nodeHooks?.beforeChange?.size &&
          !editorConfig.features.getSubFields?.size
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
              (siblingDocWithLocales[field.name] as SerializedEditorState)?.root?.children ?? [],
          })
        }

        // eslint-disable-next-line prefer-const
        for (let [id, node] of Object.entries(nodeIDMap)) {
          const beforeChangeHooks = editorConfig.features.nodeHooks?.beforeChange
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

          const subFieldFn = editorConfig.features.getSubFields?.get(node.type)
          const subFieldDataFn = editorConfig.features.getSubFieldsData?.get(node.type)

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
                overrideAccess,
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
        if (editorConfig?.features?.hooks?.beforeValidate?.length) {
          for (const hook of editorConfig.features.hooks.beforeValidate) {
            value = await hook(args)
          }
        }

        // return value if there are NO hooks
        if (
          !editorConfig.features.nodeHooks?.beforeValidate?.size &&
          !editorConfig.features.nodeHooks?.afterChange?.size &&
          !editorConfig.features.nodeHooks?.beforeChange?.size &&
          !editorConfig.features.getSubFields?.size
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
        if (!editorConfig.features.nodeHooks?.beforeValidate?.size) {
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
          const beforeValidateHooks = editorConfig.features.nodeHooks.beforeValidate
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
          const subFieldFn = editorConfig.features.getSubFields?.get(node.type)
          const subFieldDataFn = editorConfig.features.getSubFieldsData?.get(node.type)

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
  }
}
