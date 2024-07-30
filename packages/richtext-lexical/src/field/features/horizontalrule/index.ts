import type { HTMLConverter } from '../converters/html/converter/types'
import type { FeatureProvider } from '../types'
import type { SerializedHorizontalRuleNode } from './nodes/HorizontalRuleNode'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { HorizontalRuleNode, INSERT_HORIZONTAL_RULE_COMMAND } from './nodes/HorizontalRuleNode'

export const HorizontalRuleFeature = (): FeatureProvider => {
  return {
    feature: () => {
      return {
        /**
         * Define the nodes that this feature provides. Nodes define how the node is rendered in the lexical editor, what data is saved, and other lexical node behavior.
         */
        nodes: [
          {
            type: HorizontalRuleNode.getType(),
            converters: {
              html: {
                converter: () => {
                  return `<hr/>`
                },
                nodeTypes: [HorizontalRuleNode.getType()],
              } as HTMLConverter<SerializedHorizontalRuleNode>,
            },
            node: HorizontalRuleNode,
          },
        ],
        /**
         * Plugins are React components which can interact with the lexical API. This one specifically registers the INSERT_HORIZONTAL_RULE_COMMAND command and defines the behavior for when it is called.
         */
        plugins: [
          {
            Component: () =>
              // @ts-expect-error
              import('./plugin').then((module) => module.HorizontalRulePlugin),
            position: 'normal',
          },
        ],
        props: null,
        /**
         * Add a new slash menu option for inserting a horizontal rule. When running /hr in the editor, the user will be able to insert a horizontal rule. This runs the onSelect function when the option is selected.
         * Inside onSelect, we run the INSERT_HORIZONTAL_RULE_COMMAND command whose behavior is defined in the plugin.
         */
        slashMenu: {
          options: [
            {
              displayName: 'Basic',
              key: 'basic',
              options: [
                new SlashMenuOption(`horizontalrule`, {
                  Icon: () =>
                    // @ts-expect-error
                    import('../../lexical/ui/icons/HorizontalRule').then(
                      (module) => module.HorizontalRuleIcon,
                    ),
                  displayName: `Horizontal Rule`,
                  keywords: ['hr', 'horizontal rule', 'line', 'separator'],
                  onSelect: ({ editor }) => {
                    editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
                  },
                }),
              ],
            },
          ],
        },
      }
    },
    /**
     * Every feature needs a unique key
     */
    key: 'horizontalrule',
  }
}
