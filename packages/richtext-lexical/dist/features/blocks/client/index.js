'use client';

import { getTranslation } from '@payloadcms/translations';
import { BlockIcon } from '../../../lexical/ui/icons/Block/index.js';
import { InlineBlocksIcon } from '../../../lexical/ui/icons/InlineBlocks/index.js';
import { createClientFeature } from '../../../utilities/createClientFeature.js';
import { getBlockImageComponent } from './getBlockImageComponent.js';
import { getBlockMarkdownTransformers } from './markdown/markdownTransformer.js';
import { BlockNode } from './nodes/BlocksNode.js';
import { InlineBlockNode } from './nodes/InlineBlocksNode.js';
import { INSERT_BLOCK_COMMAND, INSERT_INLINE_BLOCK_COMMAND } from './plugin/commands.js';
import { BlocksPlugin } from './plugin/index.js';
export const BlocksFeatureClient = createClientFeature(({
  config,
  featureClientSchemaMap,
  props,
  schemaPath
}) => {
  const schemaMapRenderedBlockPathPrefix = `${schemaPath}.lexical_internal_feature.blocks.lexical_blocks`;
  const schemaMapRenderedInlineBlockPathPrefix = `${schemaPath}.lexical_internal_feature.blocks.lexical_inline_blocks`;
  const clientSchema = featureClientSchemaMap['blocks'];
  if (!clientSchema) {
    return {};
  }
  const blocksFields = Object.entries(clientSchema).filter(([key]) => key.startsWith(schemaMapRenderedBlockPathPrefix + '.') && !key.replace(schemaMapRenderedBlockPathPrefix + '.', '').includes('.')).map(([, value]) => value[0]);
  const inlineBlocksFields = Object.entries(clientSchema).filter(([key]) => key.startsWith(schemaMapRenderedInlineBlockPathPrefix + '.') && !key.replace(schemaMapRenderedInlineBlockPathPrefix + '.', '').includes('.')).map(([, value]) => value[0]);
  const clientBlocks = blocksFields.map(field => {
    return field.blockReferences ? typeof field.blockReferences[0] === 'string' ? config.blocksMap[field.blockReferences[0]] : field.blockReferences[0] : field.blocks[0];
  }).filter(block => block !== undefined);
  const clientInlineBlocks = inlineBlocksFields.map(field => {
    return field.blockReferences ? typeof field.blockReferences[0] === 'string' ? config.blocksMap[field.blockReferences[0]] : field.blockReferences[0] : field.blocks[0];
  }).filter(block => block !== undefined);
  return {
    markdownTransformers: getBlockMarkdownTransformers({
      blocks: clientBlocks,
      inlineBlocks: clientInlineBlocks
    }),
    nodes: [BlockNode, InlineBlockNode],
    plugins: [{
      Component: BlocksPlugin,
      position: 'normal'
    }],
    sanitizedClientFeatureProps: props,
    slashMenu: {
      groups: [clientBlocks?.length ? {
        items: clientBlocks.map(block => {
          return {
            Icon: getBlockImageComponent(block.imageURL, block.imageAltText),
            key: 'block-' + block.slug,
            keywords: ['block', 'blocks', block.slug],
            label: ({
              i18n
            }) => {
              const blockDisplayName = block?.labels?.singular ? getTranslation(block.labels.singular, i18n) : block?.slug;
              return blockDisplayName;
            },
            onSelect: ({
              editor
            }) => {
              editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
                blockName: '',
                blockType: block.slug
              });
            }
          };
        }),
        key: 'blocks',
        label: ({
          i18n
        }) => {
          return i18n.t('lexical:blocks:label');
        }
      } : null, clientInlineBlocks?.length ? {
        items: clientInlineBlocks.map(inlineBlock => {
          return {
            Icon: InlineBlocksIcon,
            key: 'inlineBlocks-' + inlineBlock.slug,
            keywords: ['inlineBlock', 'inline block', inlineBlock.slug],
            label: ({
              i18n
            }) => {
              const blockDisplayName = inlineBlock?.labels?.singular ? getTranslation(inlineBlock.labels.singular, i18n) : inlineBlock?.slug;
              return blockDisplayName;
            },
            onSelect: ({
              editor
            }) => {
              editor.dispatchCommand(INSERT_INLINE_BLOCK_COMMAND, {
                blockName: '',
                blockType: inlineBlock.slug
              });
            }
          };
        }),
        key: 'inlineBlocks',
        label: ({
          i18n
        }) => {
          return i18n.t('lexical:blocks:inlineBlocks:label');
        }
      } : null].filter(Boolean)
    },
    toolbarFixed: {
      groups: [clientBlocks.length ? {
        type: 'dropdown',
        ChildComponent: BlockIcon,
        items: clientBlocks.map((block, index) => {
          return {
            ChildComponent: getBlockImageComponent(block.imageURL, block.imageAltText),
            isActive: undefined,
            key: 'block-' + block.slug,
            label: ({
              i18n
            }) => {
              const blockDisplayName = block?.labels?.singular ? getTranslation(block.labels.singular, i18n) : block?.slug;
              return blockDisplayName;
            },
            onSelect: ({
              editor
            }) => {
              editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
                blockName: '',
                blockType: block.slug
              });
            },
            order: index
          };
        }),
        key: 'blocks',
        order: 20
      } : null, clientInlineBlocks?.length ? {
        type: 'dropdown',
        ChildComponent: InlineBlocksIcon,
        items: clientInlineBlocks.map((inlineBlock, index) => {
          return {
            ChildComponent: inlineBlock.imageURL ? getBlockImageComponent(inlineBlock.imageURL, inlineBlock.imageAltText) : InlineBlocksIcon,
            isActive: undefined,
            key: 'inlineBlock-' + inlineBlock.slug,
            label: ({
              i18n
            }) => {
              const blockDisplayName = inlineBlock?.labels?.singular ? getTranslation(inlineBlock.labels.singular, i18n) : inlineBlock?.slug;
              return blockDisplayName;
            },
            onSelect: ({
              editor
            }) => {
              editor.dispatchCommand(INSERT_INLINE_BLOCK_COMMAND, {
                blockName: '',
                blockType: inlineBlock.slug
              });
            },
            order: index
          };
        }),
        key: 'inlineBlocks',
        order: 25
      } : null].filter(Boolean)
    }
  };
});
//# sourceMappingURL=index.js.map