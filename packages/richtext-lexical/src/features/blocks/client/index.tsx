'use client'

import type { Klass, LexicalNode } from 'lexical'
import type { BlocksFieldClient, ClientBlock } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { withMergedProps } from '@payloadcms/ui/shared'

import type {
  SlashMenuGroup,
  SlashMenuItem,
} from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types.js'
import type { ToolbarGroup, ToolbarGroupItem } from '../../toolbars/types.js'
import type { ClientFeature } from '../../typesClient.js'

import { BlockIcon } from '../../../lexical/ui/icons/Block/index.js'
import { InlineBlocksIcon } from '../../../lexical/ui/icons/InlineBlocks/index.js'
import { createClientFeature } from '../../../utilities/createClientFeature.js'
import { type DOMMap, getWrapperBlockNode } from '../WrapperBlockNode.js'
import { BlockNode } from './nodes/BlocksNode.js'
import { InlineBlockNode } from './nodes/InlineBlocksNode.js'
import {
  INSERT_BLOCK_COMMAND,
  INSERT_INLINE_BLOCK_COMMAND,
  INSERT_WRAPPER_BLOCK_COMMAND,
} from './plugin/commands.js'
import { BlocksPlugin } from './plugin/index.js'
import {
  type AdditionalWrapperBlocksPluginArgs,
  WrapperBlocksPlugin,
} from './plugin/wrapperBlocks/index.js'

export const BlocksFeatureClient = createClientFeature(
  ({ featureClientImportMap, featureClientSchemaMap, props, schemaPath }) => {
    const schemaMapRenderedBlockPathPrefix = `${schemaPath}.lexical_internal_feature.blocks.lexical_blocks`
    const schemaMapRenderedInlineBlockPathPrefix = `${schemaPath}.lexical_internal_feature.blocks.lexical_inline_blocks`
    const schemaMapRenderedWrapperBlockPathPrefix = `${schemaPath}.lexical_internal_feature.blocks.lexical_wrapper_blocks`

    const clientSchema = featureClientSchemaMap['blocks']

    const blocksFields: BlocksFieldClient[] = Object.entries(clientSchema)
      .filter(
        ([key]) =>
          key.startsWith(schemaMapRenderedBlockPathPrefix + '.') &&
          !key.replace(schemaMapRenderedBlockPathPrefix + '.', '').includes('.'),
      )
      .map(([key, value]) => value[0] as BlocksFieldClient)

    const inlineBlocksFields: BlocksFieldClient[] = Object.entries(clientSchema)
      .filter(
        ([key]) =>
          key.startsWith(schemaMapRenderedInlineBlockPathPrefix + '.') &&
          !key.replace(schemaMapRenderedInlineBlockPathPrefix + '.', '').includes('.'),
      )
      .map(([key, value]) => value[0] as BlocksFieldClient)

    const wrapperBlocksFields: BlocksFieldClient[] = Object.entries(clientSchema)
      .filter(
        ([key]) =>
          key.startsWith(schemaMapRenderedWrapperBlockPathPrefix + '.') &&
          !key.replace(schemaMapRenderedWrapperBlockPathPrefix + '.', '').includes('.'),
      )
      .map(([key, value]) => value[0] as BlocksFieldClient)

    const clientBlocks: ClientBlock[] = blocksFields.map((field) => {
      return field.blocks[0]
    })

    const clientInlineBlocks: ClientBlock[] = inlineBlocksFields.map((field) => {
      return field.blocks[0]
    })

    const clientWrapperBlocks: ClientBlock[] = wrapperBlocksFields.map((field) => {
      return field.blocks[0]
    })

    console.log('ClientBlock > clientWrapperBlocks', clientWrapperBlocks)
    console.log('ClientBlock > featureClientImportMap', featureClientImportMap)

    const domMap: DOMMap = {}

    if (clientWrapperBlocks.length) {
      for (const block of clientWrapperBlocks) {
        domMap[block.slug] = featureClientImportMap[`blocks.${block.slug}`]
      }
    }

    console.log('ClientBlock > domMap', domMap)

    const { $createWrapperBlockNode, $isWrapperBlockNode, WrapperBlockNode } =
      getWrapperBlockNode(domMap)

    const wrapperBlockToolbarGroup: null | ToolbarGroup = clientWrapperBlocks?.length
      ? {
          type: 'dropdown',
          ChildComponent: InlineBlocksIcon, // TODO: Change icon
          items: clientWrapperBlocks.map((wrapperBlock, index) => {
            return {
              ChildComponent: InlineBlocksIcon, // TODO: Change icon
              isActive: undefined,
              key: 'wrapperBlock-' + wrapperBlock.slug,
              label: ({ i18n }) => {
                const blockDisplayName = wrapperBlock?.labels?.singular
                  ? getTranslation(wrapperBlock.labels.singular, i18n)
                  : wrapperBlock?.slug

                return blockDisplayName
              },
              onSelect: ({ editor }) => {
                editor.dispatchCommand(INSERT_WRAPPER_BLOCK_COMMAND, {
                  blockName: '',
                  blockType: wrapperBlock.slug,
                })
              },
              order: index,
            } as ToolbarGroupItem
          }),
          key: 'wrapperBlocks',
          order: 25,
        }
      : null

    return {
      nodes: [
        clientBlocks?.length ? BlockNode : null,
        clientInlineBlocks?.length ? InlineBlockNode : null,
        clientWrapperBlocks?.length ? WrapperBlockNode : null,
      ].filter(Boolean) as Array<Klass<LexicalNode>>,
      plugins: [
        {
          Component: BlocksPlugin,
          position: 'normal',
        },
        clientWrapperBlocks?.length
          ? {
              Component: withMergedProps<
                AdditionalWrapperBlocksPluginArgs,
                AdditionalWrapperBlocksPluginArgs
              >({
                Component: WrapperBlocksPlugin,
                sanitizeServerOnlyProps: false,
                toMergeIntoProps: {
                  $createWrapperBlockNode,
                  $isWrapperBlockNode,
                },
              }),
              position: 'floatingAnchorElem',
            }
          : null,
      ].filter(Boolean) as ClientFeature<any>['plugins'],
      sanitizedClientFeatureProps: props,
      slashMenu: {
        groups: [
          clientBlocks?.length
            ? {
                items: clientBlocks.map((block) => {
                  return {
                    Icon: BlockIcon,
                    key: 'block-' + block.slug,
                    keywords: ['block', 'blocks', block.slug],
                    label: ({ i18n }) => {
                      const blockDisplayName = block?.labels?.singular
                        ? getTranslation(block.labels.singular, i18n)
                        : block?.slug

                      return blockDisplayName
                    },
                    onSelect: ({ editor }) => {
                      editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
                        blockName: '',
                        blockType: block.slug,
                      })
                    },
                  } as SlashMenuItem
                }),
                key: 'blocks',
                label: ({ i18n }) => {
                  return i18n.t('lexical:blocks:label')
                },
              }
            : null,
          clientInlineBlocks?.length
            ? {
                items: clientInlineBlocks.map((inlineBlock) => {
                  return {
                    Icon: InlineBlocksIcon,
                    key: 'inlineBlocks-' + inlineBlock.slug,
                    keywords: ['inlineBlock', 'inline block', inlineBlock.slug],
                    label: ({ i18n }) => {
                      const blockDisplayName = inlineBlock?.labels?.singular
                        ? getTranslation(inlineBlock.labels.singular, i18n)
                        : inlineBlock?.slug

                      return blockDisplayName
                    },
                    onSelect: ({ editor }) => {
                      editor.dispatchCommand(INSERT_INLINE_BLOCK_COMMAND, {
                        blockName: '',
                        blockType: inlineBlock.slug,
                      })
                    },
                  } as SlashMenuItem
                }),
                key: 'inlineBlocks',
                label: ({ i18n }) => {
                  return i18n.t('lexical:blocks:inlineBlocks:label')
                },
              }
            : null,
        ].filter(Boolean) as SlashMenuGroup[],
      },
      toolbarFixed: {
        groups: [
          clientBlocks.length
            ? {
                type: 'dropdown',
                ChildComponent: BlockIcon,
                items: clientBlocks.map((block, index) => {
                  return {
                    ChildComponent: BlockIcon,
                    isActive: undefined, // At this point, we would be inside a sub-richtext-editor. And at this point this will be run against the focused sub-editor, not the parent editor which has the actual block. Thus, no point in running this
                    key: 'block-' + block.slug,
                    label: ({ i18n }) => {
                      const blockDisplayName = block?.labels?.singular
                        ? getTranslation(block.labels.singular, i18n)
                        : block?.slug

                      return blockDisplayName
                    },
                    onSelect: ({ editor }) => {
                      editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
                        blockName: '',
                        blockType: block.slug,
                      })
                    },
                    order: index,
                  } as ToolbarGroupItem
                }),
                key: 'blocks',
                order: 20,
              }
            : null,
          clientInlineBlocks?.length
            ? {
                type: 'dropdown',
                ChildComponent: InlineBlocksIcon,
                items: clientInlineBlocks.map((inlineBlock, index) => {
                  return {
                    ChildComponent: InlineBlocksIcon,
                    isActive: undefined,
                    key: 'inlineBlock-' + inlineBlock.slug,
                    label: ({ i18n }) => {
                      const blockDisplayName = inlineBlock?.labels?.singular
                        ? getTranslation(inlineBlock.labels.singular, i18n)
                        : inlineBlock?.slug

                      return blockDisplayName
                    },
                    onSelect: ({ editor }) => {
                      editor.dispatchCommand(INSERT_INLINE_BLOCK_COMMAND, {
                        blockName: '',
                        blockType: inlineBlock.slug,
                      })
                    },
                    order: index,
                  } as ToolbarGroupItem
                }),
                key: 'inlineBlocks',
                order: 25,
              }
            : null,
          wrapperBlockToolbarGroup,
        ].filter(Boolean) as ToolbarGroup[],
      },
      toolbarInline: {
        groups: [wrapperBlockToolbarGroup].filter(Boolean) as ToolbarGroup[],
      },
    }
  },
)
