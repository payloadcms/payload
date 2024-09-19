'use client'

import type { HeadingTagType } from '@lexical/rich-text'

import { $createHeadingNode, $isHeadingNode, HeadingNode } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { $getSelection, $isRangeSelection } from 'lexical'

import type { ToolbarGroup } from '../../toolbars/types.js'
import type { HeadingFeatureProps } from '../server/index.js'

import { H1Icon } from '../../../lexical/ui/icons/H1/index.js'
import { H2Icon } from '../../../lexical/ui/icons/H2/index.js'
import { H3Icon } from '../../../lexical/ui/icons/H3/index.js'
import { H4Icon } from '../../../lexical/ui/icons/H4/index.js'
import { H5Icon } from '../../../lexical/ui/icons/H5/index.js'
import { H6Icon } from '../../../lexical/ui/icons/H6/index.js'
import { createClientFeature } from '../../../utilities/createClientFeature.js'
import { slashMenuBasicGroupWithItems } from '../../shared/slashMenu/basicGroup.js'
import { toolbarTextDropdownGroupWithItems } from '../../shared/toolbar/textDropdownGroup.js'
import { MarkdownTransformer } from '../markdownTransformer.js'

const $setHeading = (headingSize: HeadingTagType) => {
  const selection = $getSelection()
  $setBlocksType(selection, () => $createHeadingNode(headingSize))
}

const iconImports = {
  h1: H1Icon,
  h2: H2Icon,
  h3: H3Icon,
  h4: H4Icon,
  h5: H5Icon,
  h6: H6Icon,
}

export const HeadingFeatureClient = createClientFeature<HeadingFeatureProps>(({ props }) => {
  const { enabledHeadingSizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] } = props

  const toolbarGroups: ToolbarGroup[] = [
    toolbarTextDropdownGroupWithItems(
      enabledHeadingSizes.map((headingSize, i) => {
        return {
          ChildComponent: iconImports[headingSize],
          isActive: ({ selection }) => {
            if (!$isRangeSelection(selection)) {
              return false
            }
            for (const node of selection.getNodes()) {
              if ($isHeadingNode(node) && node.getTag() === headingSize) {
                continue
              }

              const parent = node.getParent()
              if ($isHeadingNode(parent) && parent.getTag() === headingSize) {
                continue
              }

              return false
            }
            return true
          },
          key: headingSize,
          label: ({ i18n }) => {
            return i18n.t('lexical:heading:label', { headingLevel: headingSize.charAt(1) })
          },
          onSelect: ({ editor }) => {
            editor.update(() => {
              $setHeading(headingSize)
            })
          },
          order: i + 2,
        }
      }),
    ),
  ]

  return {
    markdownTransformers: [MarkdownTransformer(enabledHeadingSizes)],
    nodes: [HeadingNode],
    sanitizedClientFeatureProps: props,
    slashMenu: {
      groups: enabledHeadingSizes?.length
        ? [
            slashMenuBasicGroupWithItems(
              enabledHeadingSizes.map((headingSize) => {
                return {
                  Icon: iconImports[headingSize],
                  key: `heading-${headingSize.charAt(1)}`,
                  keywords: ['heading', headingSize],
                  label: ({ i18n }) => {
                    return i18n.t('lexical:heading:label', {
                      headingLevel: headingSize.charAt(1),
                    })
                  },
                  onSelect: ({ editor }) => {
                    editor.update(() => {
                      $setHeading(headingSize)
                    })
                  },
                }
              }),
            ),
          ]
        : [],
    },
    toolbarFixed: {
      groups: enabledHeadingSizes?.length ? toolbarGroups : [],
    },
    toolbarInline: {
      groups: enabledHeadingSizes?.length ? toolbarGroups : [],
    },
  }
})
