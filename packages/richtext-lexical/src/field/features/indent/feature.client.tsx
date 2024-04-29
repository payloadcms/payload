'use client'

import { INDENT_CONTENT_COMMAND, OUTDENT_CONTENT_COMMAND } from 'lexical'

import type { FeatureProviderProviderClient } from '../types.js'

import { IndentDecreaseIcon } from '../../lexical/ui/icons/IndentDecrease/index.js'
import { IndentIncreaseIcon } from '../../lexical/ui/icons/IndentIncrease/index.js'
import { createClientComponent } from '../createClientComponent.js'
import { IndentSectionWithEntries } from './floatingSelectToolbarIndentSection.js'

const IndentFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => ({
      clientFeatureProps: props,
      floatingSelectToolbar: {
        sections: [
          IndentSectionWithEntries([
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
              key: 'indent-decrease',
              label: `Decrease Indent`,
              onClick: ({ editor }) => {
                editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
              },
              order: 1,
            },
          ]),
          IndentSectionWithEntries([
            {
              ChildComponent: IndentIncreaseIcon,
              isActive: () => false,
              key: 'indent-increase',
              label: `Increase Indent`,
              onClick: ({ editor }) => {
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
