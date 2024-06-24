import type { SerializedLexicalNode } from 'lexical'
import type React from 'react'

export type SlateNodeConverter<T extends SerializedLexicalNode = SerializedLexicalNode> = {
  converter: ({
    childIndex,
    converters,
    parentNodeType,
    slateNode,
  }: {
    childIndex: number
    converters: SlateNodeConverter[]
    parentNodeType: string
    slateNode: SlateNode
  }) => T
  nodeTypes: string[]
}

export type SlateNode = {
  [key: string]: any
  children?: SlateNode[]
  type?: string // doesn't always have type, e.g. for paragraphs
}

export type SlateNodeConverterClientComponent = React.FC<{
  componentKey: string
  featureKey: string
}>

export type SlateNodeConverterProvider = {
  ClientComponent: SlateNodeConverterClientComponent
  converter: SlateNodeConverter
}
