import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalCommand,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
} from 'lexical'

import { $applyNodeReplacement, DecoratorNode, ElementNode, createCommand } from 'lexical'
import * as React from 'react'

const LargeBodyComponent = React.lazy(() =>
  import('../component').then((module) => ({
    default: module.LargeBodyComponent,
  })),
)

/**
 * Serialized representation of a horizontal rule node. Serialized = converted to JSON. This is what is stored in the database / in the lexical editor state.
 */
export type SerializedLargeBodyNode = SerializedElementNode

export const INSERT_LARGE_BODY_COMMAND: LexicalCommand<void> = createCommand(
  'INSERT_LARGE_BODY_COMMAND',
)

/**
 * This node is a DecoratorNode. DecoratorNodes allow you to render React components in the editor.
 *
 * They need both createDom and decorate functions. createDom => outside of the html. decorate => React Component inside of the html.
 *
 * If we used DecoratorBlockNode instead, we would only need a decorate method
 */
export class LargeBodyNode extends ElementNode {
  constructor(key?: NodeKey) {
    super(key)
  }

  static clone(node: LargeBodyNode): LargeBodyNode {
    return new LargeBodyNode(node.__key)
  }

  static getType(): string {
    return 'LargeBody'
  }

  /**
   * Defines what happens if you copy an hr element from another page and paste it into the lexical editor
   *
   * This also determines the behavior of lexical's internal HTML -> Lexical converter
   */
  static importDOM(): DOMConversionMap | null {
    return {
      hr: () => ({
        conversion: convertLargeBodyElement,
        priority: 0,
      }),
    }
  }

  /**
   * The data for this node is stored serialized as JSON. This is the "load function" of that node: it takes the saved data and converts it into a node.
   */
  static importJSON(serializedNode: SerializedLargeBodyNode): LargeBodyNode {
    return $createLargeBodyNode()
  }

  /**
   * Determines how the hr element is rendered in the lexical editor. This is only the "initial" / "outer" HTML element.
   */
  createDOM(): HTMLElement {
    const element = document.createElement('p')
    element.classList.add('rich-text-large-body')
    return element
  }

  /**
   * Allows you to render a React component within whatever createDOM returns.
   */
  decorate(): React.ReactElement {
    return <LargeBodyComponent nodeKey={this.__key} />
  }

  /**
   * Opposite of importDOM, this function defines what happens when you copy an hr element from the lexical editor and paste it into another page.
   *
   * This also determines the behavior of lexical's internal Lexical -> HTML converter
   */
  exportDOM(): DOMExportOutput {
    const element = document.createElement('p')
    element.classList.add('rich-text-large-body')

    return { element }
  }
  /**
   * Opposite of importJSON. This determines what data is saved in the database / in the lexical editor state.
   */
  exportJSON(): SerializedLargeBodyNode {
    return {
      ...super.exportJSON(),
      type: 'LargeBody',
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

function convertLargeBodyElement(): DOMConversionOutput {
  return { node: $createLargeBodyNode() }
}

export function $createLargeBodyNode(): LargeBodyNode {
  return $applyNodeReplacement(new LargeBodyNode())
}

export function $isLargeBodyNode(node: LexicalNode | null | undefined): node is LargeBodyNode {
  return node instanceof LargeBodyNode
}
