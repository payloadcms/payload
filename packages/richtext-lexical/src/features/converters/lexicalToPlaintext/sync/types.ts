import type { SerializedLexicalNode } from 'lexical'

import type {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedInlineBlockNode,
} from '../../../../types/nodeTypes.js'
import type { SerializedLexicalNodeWithParent } from '../shared/types.js'

export type PlaintextConverter<
  T extends { [key: string]: any; type?: string } = SerializedLexicalNode,
> =
  | ((args: {
      childIndex: number
      converters: PlaintextConverters
      node: T
      nodesToPlaintext: (args: {
        converters?: PlaintextConverters
        nodes: SerializedLexicalNode[]
        parent?: SerializedLexicalNodeWithParent
      }) => string[]
      parent: SerializedLexicalNodeWithParent
    }) => string)
  | string

export type DefaultPlaintextNodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<{ blockName?: null | string; blockType: string }> // need these to ensure types for blocks and inlineBlocks work if no generics are provided
  | SerializedInlineBlockNode<{ blockName?: null | string; blockType: string }>

export type PlaintextConverters<
  T extends { [key: string]: any; type?: string } = DefaultPlaintextNodeTypes,
> = {
  [key: string]:
    | {
        [blockSlug: string]: PlaintextConverter<any>
      }
    | PlaintextConverter<any>
    | undefined
} & {
  [nodeType in Exclude<NonNullable<T['type']>, 'block' | 'inlineBlock'>]?: PlaintextConverter<
    Extract<T, { type: nodeType }>
  >
} & {
  blocks?: {
    [K in Extract<T, { type: 'block' }>['fields']['blockType']]?: PlaintextConverter<
      Extract<T, { fields: { blockType: K }; type: 'block' }>
    >
  }
  inlineBlocks?: {
    [K in Extract<T, { type: 'inlineBlock' }>['fields']['blockType']]?: PlaintextConverter<
      Extract<T, { fields: { blockType: K }; type: 'inlineBlock' }>
    >
  }
}
