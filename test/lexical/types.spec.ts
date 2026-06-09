import type {
  RichTextNodes,
  SerializedBlockNode,
  SerializedParagraphNode,
  WithDefaultNodes,
} from '@payloadcms/richtext-lexical'
import type * as Runtime from '@payloadcms/richtext-lexical'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { JSXConverters, JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'

import { RichText } from '@payloadcms/richtext-lexical/react'
import { describe, expect, test } from 'tstyche'

// Every lexical node type is written twice: as a runtime type, and as a hardcoded string emitted into
// the generated payload-types.ts. `Runtime.*` are the real types; `Generated.*` are the emitted
// strings materialized. The `stay in sync` block at the bottom compares them.
import type * as Generated from './payload-types.js'
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

describe('constructing a block node literal narrows by blockType', () => {
  type Nodes = RichTextNodes<LexicalFullyFeatured['richText']>
  // Stands in for assigning a constructed node where the field's node union is expected.
  const accept = (node: Nodes): Nodes => node

  test('a valid field for the block is accepted', () => {
    expect(accept).type.toBeCallableWith({
      type: 'block',
      fields: { id: '1', blockType: 'Code', code: 'console.log()' },
      format: '',
      version: 0,
    })
  })

  test('a property that does not exist on the block is rejected', () => {
    expect(accept).type.not.toBeCallableWith({
      type: 'block',
      fields: { id: '1', blockType: 'Code', bogus: 'x' },
      format: '',
      version: 0,
    })
  })

  test('a field from another block is rejected', () => {
    expect(accept).type.not.toBeCallableWith({
      // `someText` belongs to the myBlock block, not Code.
      type: 'block',
      fields: { id: '1', blockType: 'Code', someText: 'x' },
      format: '',
      version: 0,
    })
  })
})

// Each lexical node type is declared twice in the source: as the real runtime type, and as a
// hardcoded `*_TS` string copied verbatim into every generated payload-types.ts (each tagged "MUST
// stay byte-for-byte in sync"). Nothing enforces that, so these assertions compare the runtime type
// (`Runtime.*`) against the same type materialized from the emitted string (`Generated.*`) - one per
// node - and fail if a runtime type and its emitted string ever drift apart.
describe('emitted node strings stay in sync with the runtime types', () => {
  // A sample children element and a sample block/link fields object - passed identically to both
  // sides, so each assertion isolates the node's own shape rather than its generic argument.
  interface Child {
    type: 'sample'
    version: number
  }
  interface Fields {
    blockName?: null | string
    blockType: 'sample'
    id: string
    value: number
  }

  // No type parameters
  test('LexicalTextMode', () => {
    expect<Runtime.LexicalTextMode>().type.toBe<Generated.LexicalTextMode>()
  })
  test('LexicalElementFormat', () => {
    expect<Runtime.LexicalElementFormat>().type.toBe<Generated.LexicalElementFormat>()
  })
  test('LexicalElementDirection', () => {
    expect<Runtime.LexicalElementDirection>().type.toBe<Generated.LexicalElementDirection>()
  })
  test('SerializedTextNode', () => {
    expect<Runtime.SerializedTextNode>().type.toBe<Generated.SerializedTextNode>()
  })
  test('SerializedTabNode', () => {
    expect<Runtime.SerializedTabNode>().type.toBe<Generated.SerializedTabNode>()
  })
  test('SerializedLineBreakNode', () => {
    expect<Runtime.SerializedLineBreakNode>().type.toBe<Generated.SerializedLineBreakNode>()
  })
  test('SerializedHorizontalRuleNode', () => {
    expect<Runtime.SerializedHorizontalRuleNode>().type.toBe<Generated.SerializedHorizontalRuleNode>()
  })
  test('LinkFields / LexicalLinkFields', () => {
    expect<Runtime.LinkFields>().type.toBe<Generated.LexicalLinkFields>()
  })

  // Generic over children
  test('SerializedLexicalElementBase', () => {
    expect<Runtime.SerializedLexicalElementBase<Child>>().type.toBe<
      Generated.SerializedLexicalElementBase<Child>
    >()
  })
  test('SerializedParagraphNode', () => {
    expect<Runtime.SerializedParagraphNode<Child>>().type.toBe<
      Generated.SerializedParagraphNode<Child>
    >()
  })
  test('SerializedQuoteNode', () => {
    expect<Runtime.SerializedQuoteNode<Child>>().type.toBe<Generated.SerializedQuoteNode<Child>>()
  })
  test('SerializedListNode', () => {
    expect<Runtime.SerializedListNode<Child>>().type.toBe<Generated.SerializedListNode<Child>>()
  })
  test('SerializedListItemNode', () => {
    expect<Runtime.SerializedListItemNode<Child>>().type.toBe<
      Generated.SerializedListItemNode<Child>
    >()
  })
  test('SerializedTableNode', () => {
    expect<Runtime.SerializedTableNode<Child>>().type.toBe<Generated.SerializedTableNode<Child>>()
  })
  test('SerializedTableCellNode', () => {
    expect<Runtime.SerializedTableCellNode<Child>>().type.toBe<
      Generated.SerializedTableCellNode<Child>
    >()
  })
  test('SerializedTableRowNode', () => {
    expect<Runtime.SerializedTableRowNode<Child>>().type.toBe<
      Generated.SerializedTableRowNode<Child>
    >()
  })

  // Children plus an extra parameter
  test('SerializedHeadingNode', () => {
    expect<Runtime.SerializedHeadingNode<Child, 'h1'>>().type.toBe<
      Generated.SerializedHeadingNode<Child, 'h1'>
    >()
  })
  test('SerializedLinkNode', () => {
    expect<Runtime.SerializedLinkNode<Child, Fields>>().type.toBe<
      Generated.SerializedLinkNode<Child, Fields>
    >()
  })
  test('SerializedAutoLinkNode', () => {
    expect<Runtime.SerializedAutoLinkNode<Child, Fields>>().type.toBe<
      Generated.SerializedAutoLinkNode<Child, Fields>
    >()
  })

  // Block fields
  test('SerializedBlockNode', () => {
    expect<Runtime.SerializedBlockNode<Fields>>().type.toBe<Generated.SerializedBlockNode<Fields>>()
  })
  test('SerializedInlineBlockNode', () => {
    expect<Runtime.SerializedInlineBlockNode<Fields>>().type.toBe<
      Generated.SerializedInlineBlockNode<Fields>
    >()
  })

  // Relationship / upload resolve their `value` against the editor's collections, so compare with a
  // concrete slug ('uploads' is an upload collection; 'lexical-fully-featured' is a regular one).
  test('SerializedRelationshipNode', () => {
    expect<Runtime.SerializedRelationshipNode<'lexical-fully-featured'>>().type.toBe<
      Generated.SerializedRelationshipNode<'lexical-fully-featured'>
    >()
  })
  test('SerializedUploadNode', () => {
    expect<Runtime.SerializedUploadNode<'uploads'>>().type.toBe<
      Generated.SerializedUploadNode<'uploads'>
    >()
  })

  // The root `richText` field wrapper (ROOT_NODE_TS).
  test('LexicalRichText', () => {
    expect<Runtime.LexicalRichText<Child>>().type.toBe<Generated.LexicalRichText<Child>>()
  })
})
