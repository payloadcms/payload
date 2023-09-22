import { $setBlocksType } from '@lexical/selection'
import { $createParagraphNode, $getSelection, $isRangeSelection } from 'lexical'

import type { Feature } from './types'

import { SlashMenuOption } from '../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/LexicalMenu'
import { BlockIcon } from '../lexical/ui/icons/Block'

export function ParagraphFeature(): Feature {
  return {
    slashMenu: {
      options: [
        {
          options: [
            new SlashMenuOption('Paragraph', {
              Icon: BlockIcon,
              keywords: ['normal', 'paragraph', 'p', 'text'],
              onSelect: (editor) =>
                editor.update(() => {
                  const selection = $getSelection()
                  if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createParagraphNode())
                  }
                }),
            }),
          ],
          title: 'Basic',
        },
      ],
    },
  }
}
