import { INSERT_UNORDERED_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list'

import type { FeatureProvider } from '../../types'

import { SlashMenuOption } from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { UnorderedListIcon } from '../../../lexical/ui/icons/UnorderedList'
import { ListHTMLConverter, ListItemHTMLConverter } from '../htmlConverter'
import { LexicalListPlugin } from '../plugin'
import { UNORDERED_LIST } from './markdownTransformer'

export const UnorderedListFeature = (): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        markdownTransformers: [UNORDERED_LIST],
        nodes: [
          {
            converters: {
              html: ListHTMLConverter,
            },
            node: ListNode,
            type: ListNode.getType(),
          },
          {
            converters: {
              html: ListItemHTMLConverter,
            },
            node: ListItemNode,
            type: ListItemNode.getType(),
          },
        ],
        plugins: [
          {
            Component: LexicalListPlugin,
            position: 'normal',
          },
        ],
        props: null,
        slashMenu: {
          options: [
            {
              options: [
                new SlashMenuOption('Unordered List', {
                  Icon: UnorderedListIcon,
                  keywords: ['unordered list', 'ul'],
                  onSelect: ({ editor }) => {
                    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
                  },
                }),
              ],
              title: 'Lists',
            },
          ],
        },
      }
    },
    key: 'unorderedList',
  }
}
