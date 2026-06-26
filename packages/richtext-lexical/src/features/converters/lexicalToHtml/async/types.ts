import type { SerializedLexicalNode } from 'lexical'
import type { SelectType, TypeWithID } from 'payload'

import type {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedInlineBlockNode,
} from '../../../../types/nodeTypes.js'
import type { SerializedLexicalNodeWithParent } from '../shared/types.js'
export type HTMLPopulateArguments = {
  collectionSlug: string
  id: number | string
  select?: SelectType
}

export type HTMLPopulateFn = <TData extends object = TypeWithID>(
  args: HTMLPopulateArguments,
) => Promise<TData | undefined>

export type HTMLConverterAsync<
  T extends { [key: string]: any; type?: string } = SerializedLexicalNode,
> =
  | ((args: {
      childIndex: number
      converters: HTMLConvertersAsync
      node: T
      nodesToHTML: (args: {
        converters?: HTMLConvertersAsync
        disableIndent?: boolean | string[]
        disableTextAlign?: boolean | string[]
        nodes: SerializedLexicalNode[]
        parent?: SerializedLexicalNodeWithParent
      }) => Promise<string[]>
      parent: SerializedLexicalNodeWithParent
      populate?: HTMLPopulateFn
      providedCSSString: string
      providedStyleTag: string
    }) => Promise<string> | string)
  | string

export type HTMLConvertersAsync<
  T extends { [key: string]: any; type?: string } =
    | DefaultNodeTypes
    | SerializedBlockNode<{ blockName?: null | string; blockType: string }> // need these to ensure types for blocks and inlineBlocks work if no generics are provided
    | SerializedInlineBlockNode<{ blockName?: null | string; blockType: string }>, // need these to ensure types for blocks and inlineBlocks work if no generics are provided
> = {
  [key: string]:
    | {
        [blockSlug: string]: HTMLConverterAsync<any>
      }
    | HTMLConverterAsync<any>
    | undefined
} & {
  [nodeType in Exclude<NonNullable<T['type']>, 'block' | 'inlineBlock'>]?: HTMLConverterAsync<
    Extract<T, { type: nodeType }>
  >
} & {
  blocks?: {
    [K in Extract<T, { type: 'block' }>['fields']['blockType']]?: HTMLConverterAsync<
      Extract<T, { fields: { blockType: K }; type: 'block' }>
    >
  }
  inlineBlocks?: {
    [K in Extract<T, { type: 'inlineBlock' }>['fields']['blockType']]?: HTMLConverterAsync<
      Extract<T, { fields: { blockType: K }; type: 'inlineBlock' }>
    >
  }
  unknown?: HTMLConverterAsync<SerializedLexicalNode>
}

export type HTMLConvertersFunctionAsync<
  T extends { [key: string]: any; type?: string } =
    | DefaultNodeTypes
    | SerializedBlockNode<{ blockName?: null | string; blockType: string }>
    | SerializedInlineBlockNode<{ blockName?: null | string; blockType: string }>,
> = (args: { defaultConverters: HTMLConvertersAsync<T> }) => HTMLConvertersAsync<T>
