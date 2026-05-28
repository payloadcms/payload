import type {
  SerializedHeadingNode as _SerializedHeadingNode,
  HeadingTagType,
} from '@lexical/rich-text'
import type { JSONSchema4 } from 'json-schema'
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
    // Empty array means the user disabled every heading size. Treat the same
    // as "no tag constraint" rather than emitting an invalid `<T, >` generic
    // and an unsatisfiable `enum: []`.
    const isAllTags =
      enabledHeadingSizes.length === 0 ||
      (enabledHeadingSizes.length === ALL_HEADING_TAGS.length &&
        ALL_HEADING_TAGS.every((tag) => enabledHeadingSizes.includes(tag)))
    const tagSchema: JSONSchema4 =
      enabledHeadingSizes.length === 0
        ? { type: 'string' }
        : { type: 'string', enum: enabledHeadingSizes }
    const tagUnion = enabledHeadingSizes.map((tag) => `'${tag}'`).join(' | ')
    const tsType = isAllTags
      ? `SerializedHeadingNode<${nodeUnionName}>`
      : `SerializedHeadingNode<${nodeUnionName}, ${tagUnion}>`

    return elementNodeSchema({
      nodeType: 'heading',
      properties: { tag: tagSchema },
      required: ['tag'],
      tsType,
    })
  }
