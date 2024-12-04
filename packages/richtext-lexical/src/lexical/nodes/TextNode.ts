import type { EditorConfig, SerializedTextNode } from 'lexical'

import { TextNode as LexicalTextNode } from 'lexical'

type MutableClasses = { [classSuffix: string]: string }
type ReadOnlyClasses = { readonly [classSuffix: string]: string }

export class TextNode extends LexicalTextNode {
  /** Don't use this directly, use `this.getClasses()` and `this.mutateClasses()` instead */
  private __classes: ReadOnlyClasses = {}

  static clone(node: TextNode) {
    const clonedNode = new TextNode(node.__text, node.__key)
    clonedNode.__classes = node.__classes
    return clonedNode
  }

  static getType() {
    return '$text'
  }

  static importJSON(serializedNode: SerializedTextNode): TextNode {
    return new TextNode(serializedNode.text)
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config)
    // add classes to the text node
    if (this.__classes) {
      Object.entries(this.__classes).forEach(([classSuffix, className]) => {
        dom.classList.add(`${classSuffix}-${className}`)
      })
    }

    return dom
  }

  exportJSON(): SerializedTextNode {
    return {
      ...super.exportJSON(),
      type: TextNode.getType(),
      // if is defined, add classes to the JSON
      ...(this.__classes && { classes: this.__classes }),
    }
  }

  /**
   * Returns an object of classes with the form `suffix: prefix`.
   * For example, the key-value `bg-color: “blue”`, will cause the node to be rendered with the class `bg-color-blue`.
   * This method is only for reading the classes object. If you need to mutate it use `muteClasses`.
   */
  getClasses() {
    const self = this.getLatest()
    return self.__classes
  }

  /**
   * Allows to mutate the object of classes whose form is `suffix: prefix`.
   * For example, the key-value `bg-color: “blue”`, will cause the node to be rendered with the class `bg-color-blue`.
   * @param fn A function that receives the current classes object and allows to mutate it.
   */
  mutateClasses(fn: (currentClasses: MutableClasses) => void) {
    const self = this.getWritable()
    fn(self.__classes)
  }
}
