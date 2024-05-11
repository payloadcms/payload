import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalCommand,
  LexicalNode,
  SerializedLexicalNode,
} from 'lexical'

import { $applyNodeReplacement, DecoratorNode, createCommand } from 'lexical'
import * as React from 'react'

const HorizontalRuleComponent = React.lazy(() =>
  // @ts-expect-error TypeScript being dumb
  import('../component').then((module) => ({
    default: module.HorizontalRuleComponent,
  })),
)

/**
 * Serialized representation of a horizontal rule node. Serialized = converted to JSON. This is what is stored in the database / in the lexical editor state.
 */
export type SerializedHorizontalRuleNode = SerializedLexicalNode

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
export class HorizontalRuleNode extends DecoratorNode<React.ReactElement> {
  static clone(node: HorizontalRuleNode): HorizontalRuleNode {
    return new HorizontalRuleNode(node.__key)
  }

  static getType(): string {
    return 'horizontalrule'
  }

  /**
   * Defines what happens if you copy an hr element from another page and paste it into the lexical editor
   *
   * This also determines the behavior of lexical's internal HTML -> Lexical converter
   */
  static importDOM(): DOMConversionMap | null {
    return {
      hr: () => ({
        conversion: convertHorizontalRuleElement,
        priority: 0,
      }),
    }
  }

  /**
   * The data for this node is stored serialized as JSON. This is the "load function" of that node: it takes the saved data and converts it into a node.
   */
  static importJSON(serializedNode: SerializedHorizontalRuleNode): HorizontalRuleNode {
    return $createHorizontalRuleNode()
  }

  /**
   * Determines how the hr element is rendered in the lexical editor. This is only the "initial" / "outer" HTML element.
   */
  createDOM(): HTMLElement {
    return document.createElement('hr')
  }

  /**
   * Allows you to render a React component within whatever createDOM returns.
   */
  decorate(): React.ReactElement {
    return <HorizontalRuleComponent nodeKey={this.__key} />
  }

  /**
   * Opposite of importDOM, this function defines what happens when you copy an hr element from the lexical editor and paste it into another page.
   *
   * This also determines the behavior of lexical's internal Lexical -> HTML converter
   */
  exportDOM(): DOMExportOutput {
    return { element: document.createElement('hr') }
  }
  /**
   * Opposite of importJSON. This determines what data is saved in the database / in the lexical editor state.
   */
  exportJSON(): SerializedLexicalNode {
    return {
      type: 'horizontalrule',
      version: 1,
    }
  }

  getTextContent(): string {
    return '\n'
  }

  isInline(): false {
    return false
  }

  updateDOM(): boolean {
    return false
  }
}

function convertHorizontalRuleElement(): DOMConversionOutput {
  return { node: $createHorizontalRuleNode() }
}

export function $createHorizontalRuleNode(): HorizontalRuleNode {
  return $applyNodeReplacement(new HorizontalRuleNode())
}

export function $isHorizontalRuleNode(
  node: LexicalNode | null | undefined,
): node is HorizontalRuleNode {
  return node instanceof HorizontalRuleNode
}
