'use client'

import { INDENT_CONTENT_COMMAND, OUTDENT_CONTENT_COMMAND } from 'lexical'

import type { FeatureProviderProviderClient } from '../types.js'

import { IndentDecreaseIcon } from '../../lexical/ui/icons/IndentDecrease/index.js'
import { IndentIncreaseIcon } from '../../lexical/ui/icons/IndentIncrease/index.js'
import { createClientComponent } from '../createClientComponent.js'
import { indentGroupWithItems } from './inlineToolbarIndentGroup.js'

const IndentFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => ({
      clientFeatureProps: props,
      toolbarInline: {
        groups: [
          indentGroupWithItems([
            {
              ChildComponent: IndentDecreaseIcon,
              isActive: () => false,
              isEnabled: ({ selection }) => {
                if (!selection || !selection?.getNodes()?.length) {
                  return false
                }
                for (const node of selection.getNodes()) {
                  // If at least one node is indented, this should be active
                  if (
                    ('__indent' in node && (node.__indent as number) > 0) ||
                    (node.getParent() &&
                      '__indent' in node.getParent() &&
                      node.getParent().__indent > 0)
                  ) {
                    return true
                  }
                }
                return false
              },
              key: 'indentDecrease',
              label: `Decrease Indent`,
              onSelect: ({ editor }) => {
                editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
              },
              order: 1,
            },
            {
              ChildComponent: IndentIncreaseIcon,
              isActive: () => false,
              key: 'indentIncrease',
              label: `Increase Indent`,
              onSelect: ({ editor }) => {
                editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
              },
              order: 2,
            },
          ]),
        ],
      },
    }),
  }
}

export const IndentFeatureClientComponent = createClientComponent(IndentFeatureClient)
