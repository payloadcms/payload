import type {
  RichTextNodes,
  SerializedBlockNode,
  SerializedParagraphNode,
  WithDefaultNodes,
} from '@payloadcms/richtext-lexical'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { JSXConverters, JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'

import { RichText } from '@payloadcms/richtext-lexical/react'
import { describe, expect, test } from 'tstyche'

import type {
  BannerBlock,
  LexicalFullyFeatured,
  LexicalViewsFrontend,
  MyBlock,
} from './payload-types.js'

// A user composes their node union from a generated block type (`BannerBlock` from `payload-types`).
type Nodes = WithDefaultNodes<SerializedBlockNode<BannerBlock>>

// A serialized editor state to satisfy the required `data` argument; the converters are what's under test.
declare const data: SerializedEditorState

describe('strongly-typed block converters', () => {
  test('RichText accepts JSXConvertersFunction<Nodes>', () => {
    const converters: JSXConvertersFunction<Nodes> = () => ({
      blocks: { banner: ({ node }) => node.fields.title },
    })

    expect(RichText).type.toBeCallableWith({ converters, data })
  })

  test('RichText accepts JSXConverters<Nodes>', () => {
    const converters: JSXConverters<Nodes> = {
      blocks: { banner: ({ node }) => node.fields.title },
    }

    expect(RichText).type.toBeCallableWith({ converters, data })
  })

  type ManualNodes = SerializedBlockNode<BannerBlock> | SerializedParagraphNode<ManualNodes>

  test('RichText accepts manually typed JSXConverters<Nodes>', () => {
    const converters: JSXConverters<ManualNodes> = {
      blocks: { banner: ({ node }) => node.fields.title },
      paragraph: () => 'paragraph',
    }

    expect(RichText).type.toBeCallableWith({ converters, data })
  })

  // The realistic path: pull the node union straight from a generated `richText` field instead of
  // assembling it by hand. `customFrontendViews`'s generated nodes already include the `banner` block.
  type GeneratedNodes = RichTextNodes<LexicalViewsFrontend['customFrontendViews']>

  test('RichText accepts JSXConvertersFunction<GeneratedNodes>', () => {
    const converters: JSXConvertersFunction<GeneratedNodes> = () => ({
      blocks: { banner: ({ node }) => node.fields.title },
    })

    expect(RichText).type.toBeCallableWith({ converters, data })
  })

  test('RichText accepts JSXConverters<GeneratedNodes>', () => {
    const converters: JSXConverters<GeneratedNodes> = {
      blocks: { banner: ({ node }) => node.fields.title },
    }

    expect(RichText).type.toBeCallableWith({ converters, data })
  })

  // `SerializedBlockNode` is distributive, so multiple blocks can be written either way and behave
  // identically. Both must give each converter only its own block's node (`banner.title`,
  // `myBlock.someText`):
  //   - separate:  SerializedBlockNode<A> | SerializedBlockNode<B>
  //   - combined:  SerializedBlockNode<A | B>   (what type generation emits, and our docs show)
  type SeparateBlockNodes = WithDefaultNodes<
    SerializedBlockNode<BannerBlock> | SerializedBlockNode<MyBlock>
  >
  type CombinedBlockNodes = WithDefaultNodes<SerializedBlockNode<BannerBlock | MyBlock>>

  test('RichText accepts converters for separate SerializedBlockNode<A> | SerializedBlockNode<B>', () => {
    const converters: JSXConvertersFunction<SeparateBlockNodes> = () => ({
      blocks: {
        banner: ({ node }) => node.fields.title,
        myBlock: ({ node }) => node.fields.someText ?? '',
      },
    })

    expect(RichText).type.toBeCallableWith({ converters, data })
  })

  test('RichText accepts converters for combined SerializedBlockNode<A | B>', () => {
    const converters: JSXConvertersFunction<CombinedBlockNodes> = () => ({
      blocks: {
        banner: ({ node }) => node.fields.title,
        myBlock: ({ node }) => node.fields.someText ?? '',
      },
    })

    expect(RichText).type.toBeCallableWith({ converters, data })
  })

  // The website-template / docs pattern: spread the built-in converters, then add block converters.
  // With `WithDefaultNodes`, blocks are threaded into every container's `children`, so the built-in
  // converters (typed for the default nodes) must still be spreadable into the wider node union.
  test('RichText accepts converters that spread ...defaultConverters', () => {
    const converters: JSXConvertersFunction<SeparateBlockNodes> = ({ defaultConverters }) => ({
      ...defaultConverters,
      blocks: {
        banner: ({ node }) => node.fields.title,
        myBlock: ({ node }) => node.fields.someText ?? '',
      },
    })

    expect(RichText).type.toBeCallableWith({ converters, data })
  })
})

// Converter-independent: this guards the *generated* types directly. `LexicalFullyFeatured.richText`
// has three blocks, emitted combined as `SerializedBlockNode<Code | PayloadCode | MyBlock>`. Because
// `SerializedBlockNode` is distributive, that expands to a discriminated union, so a block-specific
// field (myBlock's `someText`) is readable after narrowing by `blockType` - which it wouldn't be if
// the combined node's `Omit` collapsed the fields to the blocks' common keys.
describe('generated block node exposes per-block fields by blockType', () => {
  type FullyFeaturedNodes = RichTextNodes<LexicalFullyFeatured['richText']>
  type BlockNode = Extract<FullyFeaturedNodes, { type: 'block' }>

  test('a block-specific field is readable after narrowing by blockType', () => {
    const read = (node: BlockNode): string => {
      if (node.fields.blockType === 'myBlock') {
        return node.fields.someText ?? ''
      }
      return ''
    }

    expect(read).type.toBeCallableWith({} as BlockNode)
  })
})
