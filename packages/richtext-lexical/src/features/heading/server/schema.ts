import type {
  SerializedHeadingNode as _SerializedHeadingNode,
  HeadingTagType,
} from '@lexical/rich-text'
import type { SerializedLexicalNode } from 'lexical'

import type { StronglyTypedElementNode } from '../../../types/nodeTypes.js'
import type { JSONSchemaFn } from '../../typesServer.js'

export type SerializedHeadingNode<
  TChildren extends SerializedLexicalNode = SerializedLexicalNode,
  TTag extends HeadingTagType = HeadingTagType,
> = { tag: TTag } & StronglyTypedElementNode<_SerializedHeadingNode, 'heading', TChildren>

const ALL_HEADING_TAGS: HeadingTagType[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

const SERIALIZED_HEADING_NODE_TS = `export interface SerializedHeadingNode<
  TChildren,
  TTag extends 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
> extends SerializedLexicalElementBase<TChildren> {
  type: 'heading';
  tag: TTag;
}`

export const createHeadingJSONSchema =
  (enabledHeadingSizes: HeadingTagType[]): JSONSchemaFn =>
  ({ elementNodeSchema, nodeUnionName, typeStringDefinitions }) => {
    typeStringDefinitions.add(SERIALIZED_HEADING_NODE_TS)
    // Skip the second generic arg when every tag is enabled — the helper
    // type's default already covers all six.
    const isAllTags =
      enabledHeadingSizes.length === ALL_HEADING_TAGS.length &&
      ALL_HEADING_TAGS.every((tag) => enabledHeadingSizes.includes(tag))
    const tagUnion = enabledHeadingSizes.map((tag) => `'${tag}'`).join(' | ')
    const tsType = isAllTags
      ? `SerializedHeadingNode<${nodeUnionName}>`
      : `SerializedHeadingNode<${nodeUnionName}, ${tagUnion}>`

    return elementNodeSchema({
      nodeType: 'heading',
      properties: { tag: { type: 'string', enum: enabledHeadingSizes } },
      required: ['tag'],
      tsType,
    })
  }
