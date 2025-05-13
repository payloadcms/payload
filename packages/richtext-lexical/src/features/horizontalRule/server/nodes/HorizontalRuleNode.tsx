import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalCommand,
  LexicalNode,
  SerializedLexicalNode,
  Spread,
} from 'lexical'
import type * as React from 'react'

import { addClassNamesToElement } from '@lexical/utils'
import { $applyNodeReplacement, createCommand, DecoratorNode } from 'lexical'

/**
 * Serialized representation of a horizontal rule node. Serialized = converted to JSON. This is what is stored in the database / in the lexical editor state.
 */
export type SerializedHorizontalRuleNode = Spread<
  {
    children?: never // required so that our typed editor state doesn't automatically add children
    type: 'horizontalrule'
  },
  SerializedLexicalNode
>

export const INSERT_HORIZONTAL_RULE_COMMAND: LexicalCommand<void> = createCommand(
  'INSERT_HORIZONTAL_RULE_COMMAND',
)

/**
 * This node is a DecoratorNode. DecoratorNodes allow you to render React components in the editor.
 *
 * They need both createDom and decorate functions. createDom => outside of the html. decorate => React Component inside of the html.
 *
 * If we used DecoratorBlockNode instead, we would only need a decorate method
 */
export class HorizontalRuleServerNode extends DecoratorNode<null | React.ReactElement> {
  static override clone(node: HorizontalRuleServerNode): HorizontalRuleServerNode {
    return new this(node.__key)
  }

  static override getType(): string {
    return 'horizontalrule'
  }

  /**
   * Defines what happens if you copy an hr element from another page and paste it into the lexical editor
   *
   * This also determines the behavior of lexical's internal HTML -> Lexical converter
   */
  static override importDOM(): DOMConversionMap | null {
    return {
      hr: () => ({
        conversion: $convertHorizontalRuleElement,
        priority: 0,
      }),
    }
  }

  /**
   * The data for this node is stored serialized as JSON. This is the "load function" of that node: it takes the saved data and converts it into a node.
   */
  static override importJSON(
    serializedNode: SerializedHorizontalRuleNode,
  ): HorizontalRuleServerNode {
    return $createHorizontalRuleServerNode()
  }

  /**
   * Determines how the hr element is rendered in the lexical editor. This is only the "initial" / "outer" HTML element.
   */
  override createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('hr')
    addClassNamesToElement(element, config.theme.hr)
    return element
  }

  override decorate(): null | React.ReactElement {
    return null
  }

  /**
   * Opposite of importDOM, this function defines what happens when you copy an hr element from the lexical editor and paste it into another page.
   *
   * This also determines the behavior of lexical's internal Lexical -> HTML converter
   */
  override exportDOM(): DOMExportOutput {
    return { element: document.createElement('hr') }
  }
  /**
   * Opposite of importJSON. This determines what data is saved in the database / in the lexical editor state.
   */
  override exportJSON(): SerializedLexicalNode {
    return {
      type: 'horizontalrule',
      version: 1,
    }
  }

  override getTextContent(): string {
    return '\n'
  }

  override isInline(): false {
    return false
  }

  override updateDOM(): boolean {
    return false
  }
}

function $convertHorizontalRuleElement(): DOMConversionOutput {
  return { node: $createHorizontalRuleServerNode() }
}

export function $createHorizontalRuleServerNode(): HorizontalRuleServerNode {
  return $applyNodeReplacement(new HorizontalRuleServerNode())
}

export function $isHorizontalRuleServerNode(
  node: LexicalNode | null | undefined,
): node is HorizontalRuleServerNode {
  return node instanceof HorizontalRuleServerNode
}
