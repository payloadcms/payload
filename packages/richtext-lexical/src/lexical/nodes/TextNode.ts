import type { EditorConfig, SerializedTextNode as SerializedLexicalTextNode } from 'lexical'

import { TextNode as LexicalTextNode } from 'lexical'

type MutableClasses = { [classSuffix: string]: boolean | string }
type ReadOnlyClasses = { readonly [classSuffix: string]: boolean | string }

type SerializedTextNode = { classes?: ReadOnlyClasses } & SerializedLexicalTextNode

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
    const textNode = new TextNode(serializedNode.text)
    textNode.__classes = serializedNode.classes || {}
    return textNode
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config)
    // add classes to the text node
    if (this.__classes) {
      Object.entries(this.__classes).forEach(([classPrefix, classSufix]) => {
        if (typeof classSufix === 'string') {
          dom.classList.add(`${classPrefix}-${classSufix}`)
        } else {
          dom.classList.add(classPrefix)
        }
      })
    }

    return dom
  }

  exportJSON(): SerializedTextNode {
    const classes = Object.fromEntries(
      Object.entries(this.__classes).filter(([_, value]) => value !== undefined),
    )
    return {
      ...super.exportJSON(),
      type: TextNode.getType(),
      ...(Object.keys(classes).keys.length > 0 && { classes: this.__classes }),
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
