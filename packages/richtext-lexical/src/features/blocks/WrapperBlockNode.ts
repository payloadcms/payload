import type {
  BaseSelection,
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  ElementNode as ElementNodeType,
  LexicalNode,
  NodeKey,
  RangeSelection,
  SerializedElementNode,
  SerializedLexicalNode,
  Spread,
} from 'lexical'

import ObjectID from 'bson-objectid'
import { $isElementNode, $isRangeSelection, ElementNode } from 'lexical'
import { deepCopyObjectSimple } from 'payload/shared'

export type WrapperBlockFields = {
  /** Block form data */
  [key: string]: any
  blockType: string
  id: string
}

export type SerializedWrapperBlockNode<T extends SerializedLexicalNode = SerializedLexicalNode> =
  Spread<
    {
      fields: WrapperBlockFields
      type: 'wrapperBlock'
    },
    SerializedElementNode<T>
  >

export type DOMMap = {
  [blockType: string]: () => HTMLElement
}

export function getWrapperBlockNode(domMap: DOMMap) {
  class WrapperBlockNode extends ElementNode {
    __fields: WrapperBlockFields

    constructor({ fields, key }: { fields: WrapperBlockFields; key?: NodeKey }) {
      super(key)
      this.__fields = fields
    }

    static clone(node: WrapperBlockNode): WrapperBlockNode {
      return new this({
        fields: node.__fields,
        key: node.__key,
      })
    }

    static getType(): string {
      return 'wrapperBlock'
    }

    static importDOM(): DOMConversionMap<HTMLDivElement> | null {
      return {}
    }

    static importJSON(serializedNode: SerializedWrapperBlockNode): WrapperBlockNode {
      const node = $createWrapperBlockNode(serializedNode.fields)
      return node
    }

    canBeEmpty(): false {
      return false
    }

    canInsertTextAfter(): false {
      return false
    }

    canInsertTextBefore(): false {
      return false
    }

    createDOM() {
      return domMap[this.__fields.blockType]()
    }

    exportDOM(): DOMExportOutput {
      const element = document.createElement('span')
      element.classList.add('wrapper-block-container')

      const text = document.createTextNode(this.getTextContent())
      element.append(text)
      return { element }
    }

    exportJSON(): SerializedWrapperBlockNode {
      return {
        ...super.exportJSON(),
        type: 'wrapperBlock',
        fields: this.getFields(),
        version: 1,
      }
    }
    extractWithChild(
      child: LexicalNode,
      selection: BaseSelection,
      destination: 'clone' | 'html',
    ): boolean {
      if (!$isRangeSelection(selection)) {
        return false
      }

      const anchorNode = selection.anchor.getNode()
      const focusNode = selection.focus.getNode()

      return (
        this.isParentOf(anchorNode) &&
        this.isParentOf(focusNode) &&
        selection.getTextContent().length > 0
      )
    }

    getFields(): WrapperBlockFields {
      return this.getLatest().__fields
    }

    insertNewAfter(selection: RangeSelection, restoreSelection = true): ElementNodeType | null {
      const element = this.getParentOrThrow().insertNewAfter(selection, restoreSelection)
      if ($isElementNode(element)) {
        const wrapperBlockNode = $createWrapperBlockNode(this.__fields)
        element.append(wrapperBlockNode)
        return wrapperBlockNode
      }
      return null
    }

    isInline(): true {
      return true
    }

    setFields(fields: WrapperBlockFields): void {
      const fieldsCopy = deepCopyObjectSimple(fields)

      const writable = this.getWritable()
      writable.__fields = fieldsCopy
    }

    updateDOM(
      prevNode: WrapperBlockNode,
      anchor: HTMLAnchorElement,
      config: EditorConfig,
    ): boolean {
      return false
    }
  }

  function $createWrapperBlockNode(fields: Exclude<WrapperBlockFields, 'id'>): WrapperBlockNode {
    return new WrapperBlockNode({
      fields: {
        ...fields,
        id: fields?.id || new ObjectID.default().toHexString(),
      },
    })
  }

  function $isWrapperBlockNode(
    node: LexicalNode | null | typeof WrapperBlockNode | undefined,
  ): node is WrapperBlockNode {
    return node instanceof WrapperBlockNode
  }

  type WrapperBlockNodeInstance = InstanceType<typeof WrapperBlockNode>

  return {
    $createWrapperBlockNode,
    $isWrapperBlockNode,
    WrapperBlockNode,
    WrapperBlockNodeInstance: null as unknown as WrapperBlockNodeInstance,
  } as {
    $createWrapperBlockNode: (fields: WrapperBlockFields) => WrapperBlockNodeInstance
    $isWrapperBlockNode: (
      node: LexicalNode | null | typeof WrapperBlockNode | undefined,
    ) => node is WrapperBlockNode
    WrapperBlockNode: typeof WrapperBlockNode
    WrapperBlockNodeInstance: WrapperBlockNodeInstance
  }
}

//export type WrapperBlockNodeType = ReturnType<typeof getWrapperBlockNode>['WrapperBlockNode']

export type WrapperBlockNodeType = ReturnType<
  typeof getWrapperBlockNode
>['WrapperBlockNodeInstance']

export type IsWrapperBlockNodeFn = ReturnType<typeof getWrapperBlockNode>['$isWrapperBlockNode']

export type CreateWrapperBlockNodeFn = ReturnType<
  typeof getWrapperBlockNode
>['$createWrapperBlockNode']
