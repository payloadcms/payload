import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { useAuth } from '@payloadcms/ui'
import type {
  AuthenticatedUser,
  BulkOperationResult,
  CollectionAfterChangeHook,
  CollectionAfterOperationHook,
  CollectionAfterReadHook,
  CollectionBeforeChangeHook,
  CollectionSlug,
  CreateAction,
  CustomDocumentViewConfig,
  DefaultDocumentViewConfig,
  FieldHook,
  GeneratedTypes,
  GlobalAfterChangeHook,
  GlobalBeforeChangeHook,
  Job,
  JobTaskStatus,
  JoinQuery,
  MeOperationResult,
  PaginatedDocs,
  PayloadRequest,
  PayloadTypesShape,
  RestoreAction,
  SelectType,
  TypedCollectionSelect,
  TypeWithVersion,
  UntypedPayloadTypes,
  UpdateAction,
  Where,
  WriteAction,
} from 'payload'

import {
  buildEditorState,
  type DefaultNodeTypes,
  type DefaultTypedEditorState,
  type SerializedAutoLinkNode,
  type SerializedBlockNode,
  type SerializedHeadingNode,
  type SerializedHorizontalRuleNode,
  type SerializedLineBreakNode,
  type SerializedLinkNode,
  type SerializedListItemNode,
  type SerializedListNode,
  type SerializedParagraphNode,
  type SerializedQuoteNode,
  type SerializedRelationshipNode,
  type SerializedTabNode,
  type SerializedTextNode,
  type TypedEditorState,
  type WithDefaultNodes,
} from '@payloadcms/richtext-lexical'
import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import { PayloadSDK } from '@payloadcms/sdk'
import payload from 'payload'
import { describe, expect, test } from 'tstyche'

import type {
  DraftPost,
  DraftPostInput,
  FallbackUser,
  LexicalUploadFields_9521FA4A as GalleryUploadFields,
  SerializedAutoLinkNode as GenAutoLink,
  SerializedHeadingNode as GenHeading,
  SerializedHorizontalRuleNode as GenHR,
  SerializedLineBreakNode as GenLB,
  SerializedListItemNode as GenLI,
  SerializedLinkNode as GenLink,
  SerializedListNode as GenList,
  LexicalNodes_D5E7E2D8 as GenNodeUnion,
  SerializedParagraphNode as GenParagraph,
  SerializedQuoteNode as GenQuote,
  SerializedTabNode as GenTab,
  SerializedTextNode as GenText,
  InputType,
  InputTypeInput,
  Config as LocalConfig,
  Media,
  LexicalUploadFields_7C90EEAC as MediaUploadFields,
  Menu,
  MyRadioOptions,
  MySelectOptions,
  Page,
  PagesCategory,
  PagesCategoryInput,
  Post,
  PostInput,
  SupportedTimezones,
  User,
  UserInput,
} from './payload-types.js'

describe('Types testing', () => {
  test('should fall back when generated types do not include jobs', () => {
    expect<Job['id']>().type.toBe<number | string>()
    expect<Job['processingToken']>().type.toBe<null | string | undefined>()
    expect<Job['taskStatus']>().type.toBe<JobTaskStatus>()
    expect<'payload-jobs'>().type.not.toBeAssignableTo<CollectionSlug>()
  })

  describe('authenticated user', () => {
    test('should use AuthenticatedUser for request and me operation users', () => {
      expect<PayloadRequest['user']>().type.toBe<AuthenticatedUser | null>()
      expect<MeOperationResult['user']>().type.toBe<AuthenticatedUser | null | undefined>()
    })

    test('should not expose strategy on core or UI auth result types', () => {
      expect<MeOperationResult>().type.not.toHaveProperty('strategy')
      expect<ReturnType<typeof useAuth>>().type.not.toHaveProperty('strategy')
    })
  })

  test('payload.find', () => {
    expect(payload.find({ collection: 'users' })).type.toBe<Promise<PaginatedDocs<User>>>()
  })

  test('payload.findByID', () => {
    expect(payload.findByID({ id: 1, collection: 'users' })).type.toBe<Promise<User>>()
  })

  test('payload.findByID with disableErrors: true', () => {
    expect(payload.findByID({ id: 1, collection: 'users', disableErrors: true })).type.toBe<
      Promise<null | User>
    >()
  })

  test('payload.create', () => {
    expect(payload.create({ collection: 'users', data: { email: 'user@email.com' } })).type.toBe<
      Promise<User>
    >()
  })

  test('payload.update by ID', () => {
    expect(payload.update({ id: 1, collection: 'users', data: {} })).type.toBe<Promise<User>>()
  })

  test('payload.update many', () => {
    expect(payload.update({ collection: 'users', data: {}, where: {} })).type.toBe<
      Promise<BulkOperationResult<'users', SelectType>>
    >()
  })

  test('payload.delete by ID', () => {
    expect(payload.delete({ id: 1, collection: 'users' })).type.toBe<Promise<User>>()
  })

  test('payload.delete many', () => {
    expect(payload.delete({ collection: 'users', where: {} })).type.toBe<
      Promise<BulkOperationResult<'users', SelectType>>
    >()
  })

  test('payload.findGlobal', () => {
    expect(payload.findGlobal({ slug: 'menu' })).type.toBe<Promise<Menu>>()
  })

  test('payload.updateGlobal', () => {
    expect(payload.updateGlobal({ slug: 'menu', data: {} })).type.toBe<Promise<Menu>>()
  })

  test('payload.findVersions', () => {
    expect(payload.findVersions({ collection: 'posts' })).type.toBe<
      Promise<PaginatedDocs<TypeWithVersion<Post>>>
    >()
  })

  test('payload.findVersionByID', () => {
    expect(payload.findVersionByID({ id: 'id', collection: 'posts' })).type.toBe<
      Promise<TypeWithVersion<Post>>
    >()
  })

  test('payload.findGlobalVersions', () => {
    expect(payload.findGlobalVersions({ slug: 'menu' })).type.toBe<
      Promise<PaginatedDocs<TypeWithVersion<Menu>>>
    >()
  })

  test('payload.findGlobalVersionByID', () => {
    expect(payload.findGlobalVersionByID({ id: 'id', slug: 'menu' })).type.toBe<
      Promise<TypeWithVersion<Menu>>
    >()
  })

  describe('select', () => {
    test('should include only ID if select is an empty object', () => {
      expect(payload.findByID({ id: 'id', collection: 'posts', select: {} })).type.toBe<
        Promise<{ id: Post['id'] }>
      >()
    })

    test('should include only title and ID', () => {
      expect(
        payload.findByID({ id: 'id', collection: 'posts', select: { title: true } }),
      ).type.toBe<Promise<{ id: Post['id']; title?: Post['title'] }>>()
    })

    test('should exclude title', () => {
      expect(
        payload.findByID({ id: 'id', collection: 'posts', select: { title: false } }),
      ).type.toBe<Promise<Omit<Post, 'title'>>>()
    })
  })

  describe('joins', () => {
    test('join query for pages should have type never as pages does not define any joins', () => {
      expect<JoinQuery<'pages'>>().type.toBe<never>()
    })

    test('join query for pages-categories should be defined with the relatedPages key', () => {
      expect<JoinQuery<'pages-categories'>>().type.toBeAssignableFrom<{
        relatedPages?: {
          limit?: number
          sort?: string
          where?: Where
        }
      }>()
    })
  })

  describe('generated types', () => {
    test('has SupportedTimezones', () => {
      expect<SupportedTimezones>().type.toBeAssignableTo<string>()
    })

    test('auth collection has collection property in generated User type', () => {
      // The collection property should be directly on the User interface, not an intersection
      expect<User>().type.toHaveProperty('collection')
      expect<User['collection']>().type.toBe<'users'>()
    })

    test('generated User is assignable to the untyped fallback user type', () => {
      // Payload uses this auth contract when generated types are unavailable, so every generated
      // user must be readable through it.
      type UntypedFallbackUser = UntypedPayloadTypes['user']

      expect<User>().type.toBeAssignableTo<UntypedFallbackUser>()
      expect<FallbackUser>().type.toBeAssignableTo<UntypedFallbackUser>()
    })

    test('payload operations return users with collection property', async () => {
      const user = await payload.findByID({ id: 'id', collection: 'users' })
      expect(user.collection).type.toBe<'users'>()
    })

    test('collection property is not required in update data for auth collections', () => {
      // The collection property should not be required when updating users
      // It is auto-populated by the system
      expect(payload.update).type.toBeCallableWith({
        id: 'id',
        collection: 'users',
        data: {
          email: 'test@example.com',
        },
      })
    })

    test('has global generated options interface based on select field', () => {
      expect<Post['selectField']>().type.toBe<MySelectOptions>()
    })

    test('has global generated options interface based on radio field', () => {
      expect<Post['radioField']>().type.toBe<MyRadioOptions>()
    })

    test('resolves external schema file references', () => {
      // The externalType field uses a $ref to ./test/types/schemas/custom-type.json
      expect<Post>().type.toHaveProperty('externalType')
      expect<NonNullable<Post['externalType']>>().type.toHaveProperty('externalField')
      expect<NonNullable<Post['externalType']>>().type.toHaveProperty('externalNumber')
    })
  })

  test('ResolveFallback allows generic indexing', () => {
    type Select<
      T extends PayloadTypesShape,
      S extends CollectionSlug<T>,
    > = TypedCollectionSelect<T>[S]
    expect<Select<GeneratedTypes, 'users'>>().type.not.toBe<never>()
  })

  test('TypedCollectionSelect resolves correctly with concrete types', () => {
    type SelectUsers = TypedCollectionSelect<GeneratedTypes>['users']
    expect<SelectUsers>().type.not.toBe<never>()

    // Test with Config - should also work
    type SelectPosts = TypedCollectionSelect<LocalConfig>['posts']
    expect<SelectPosts>().type.not.toBe<never>()
  })

  describe('fields', () => {
    describe('Group', () => {
      test('correctly ignores unnamed group', () => {
        expect<Post>().type.toHaveProperty('insideUnnamedGroup')
      })

      test('generates nested group name', () => {
        expect<Post>().type.toHaveProperty('namedGroup')
        expect<NonNullable<Post['namedGroup']>>().type.toHaveProperty('insideNamedGroup')
      })
    })
  })

  describe('views', () => {
    test('default view config', () => {
      expect<DefaultDocumentViewConfig>().type.not.toBeAssignableFrom<{
        path: `/${string}`
      }>()

      expect<CustomDocumentViewConfig>().type.toBeAssignableFrom<{
        Component: string
        path: `/${string}`
      }>()
    })
  })

  describe('lexical', () => {
    type _Hardcoded_DefaultNodeTypes =
      | 'autolink'
      | 'heading'
      | 'horizontalrule'
      | 'linebreak'
      | 'link'
      | 'list'
      | 'listitem'
      | 'paragraph'
      | 'quote'
      | 'relationship'
      | 'tab'
      | 'text'
      | 'upload'

    test('ensure TypedEditorState node type without generic is string', () => {
      expect<TypedEditorState['root']['children'][number]['type']>().type.toBe<string>()
    })

    test('ensure TypedEditorState<1 generic> node type is correct', () => {
      expect<
        TypedEditorState<{
          type: 'custom-node'
          version: 1
        }>['root']['children'][number]['type']
      >().type.toBe<'custom-node'>()
    })

    test('ensure TypedEditorState<2 generics> node type is correct', () => {
      expect<
        TypedEditorState<
          | {
              type: 'custom-node'
              version: 1
            }
          | {
              type: 'custom-node-2'
              version: 1
            }
        >['root']['children'][number]['type']
      >().type.toBe<'custom-node' | 'custom-node-2'>()
    })

    test('ensure DefaultTypedEditorState node type is a union of all possible node types', () => {
      expect<
        DefaultTypedEditorState['root']['children'][number]['type']
      >().type.toBe<_Hardcoded_DefaultNodeTypes>()
    })

    test('ensure TypedEditorState<DefaultNodeTypes> node type is identical to DefaultTypedEditorState', () => {
      expect<
        TypedEditorState<DefaultNodeTypes>['root']['children'][number]['type']
      >().type.toBe<_Hardcoded_DefaultNodeTypes>()
    })

    test('ensure DefaultTypedEditorState<custom node> adds custom node type to union of default nodes', () => {
      expect<
        DefaultTypedEditorState<{
          type: 'custom-node'
          version: 1
        }>['root']['children'][number]['type']
      >().type.toBe<'custom-node' | _Hardcoded_DefaultNodeTypes>()
    })

    test('ensure DefaultTypedEditorState<multiple custom nodes> adds custom node types to union of default nodes', () => {
      expect<
        DefaultTypedEditorState<
          | {
              type: 'custom-node'
              version: 1
            }
          | {
              type: 'custom-node-2'
              version: 1
            }
        >['root']['children'][number]['type']
      >().type.toBe<'custom-node' | 'custom-node-2' | _Hardcoded_DefaultNodeTypes>()
    })

    test("ensure link node automatically narrows type so that node accepts fields property if type === 'link' is checked", () => {
      type NodeType = DefaultTypedEditorState['root']['children'][number]

      const node = {
        type: 'link',
      } as NodeType

      if (node.type === 'link') {
        expect(node).type.toHaveProperty('fields')
      } else {
        expect(node).type.not.toHaveProperty('fields')
      }
    })

    test('ensure generated richText types can be assigned to DefaultTypedEditorState when no custom upload fields exist', () => {
      // When no UploadFeature extra fields are configured, the generated type and DefaultTypedEditorState
      // are bidirectionally assignable. With per-collection upload fields (as in this config), the generated
      // type has narrower upload field types, so they diverge. In that case, use `buildEditorState<Post['richText']>()`
      // instead of `buildEditorState<DefaultNodeTypes>()`.
      //
      // This test intentionally documents the divergence when custom upload fields are configured.
      type GeneratedRichTextType = Post['richText']

      // The generated type and DefaultTypedEditorState are NOT bidirectionally assignable when custom
      // upload fields narrow the node union. buildEditorState<Post['richText']> is the correct path.
      expect<Post['richText']>().type.toBeAssignableFrom<
        ReturnType<typeof buildEditorState<GeneratedRichTextType>>
      >()
    })

    test('ensure generated richText types can be assigned to SerializedEditorState (what converters consume)', () => {
      // Every lexical converter (convertLexicalToHTML, convertLexicalToPlaintext, ...) accepts
      // `data: SerializedEditorState`, so data straight from the local API must be assignable to it.
      type GeneratedRichTextType = Post['richText']

      expect<SerializedEditorState>().type.toBeAssignableFrom<GeneratedRichTextType>()

      // ...and the converter must accept the generated type directly, with no cast.
      expect(convertLexicalToPlaintext).type.toBeCallableWith({
        data: null as unknown as GeneratedRichTextType,
      })
    })

    test('ensure type property in editorState.root.children.push() is correctly typed as union of all node types', () => {
      const _editorState: DefaultTypedEditorState = null as unknown as DefaultTypedEditorState

      // Test that the type parameter is correctly typed
      type PushParameterType = Parameters<typeof _editorState.root.children.push>[0]

      expect<PushParameterType['type']>().type.toBe<_Hardcoded_DefaultNodeTypes>()
    })

    test('ensure leaf nodes (linebreak, text, tab) do not have children property', () => {
      type NodeType = DefaultTypedEditorState['root']['children'][number]

      // When narrowed to linebreak, children should not exist
      const linebreakNode = {
        type: 'linebreak',
      } as NodeType

      if (linebreakNode.type === 'linebreak') {
        expect(linebreakNode).type.not.toHaveProperty('children')
      }

      // When narrowed to text, children should not exist
      const textNode = {
        type: 'text',
      } as NodeType

      if (textNode.type === 'text') {
        expect(textNode).type.not.toHaveProperty('children')
      }

      // When narrowed to tab, children should not exist
      const tabNode = {
        type: 'tab',
      } as NodeType

      if (tabNode.type === 'tab') {
        expect(tabNode).type.not.toHaveProperty('children')
      }
    })

    test('ensure container nodes (heading, paragraph, list) have children property', () => {
      type NodeType = DefaultTypedEditorState['root']['children'][number]

      // When narrowed to heading, children should exist
      const headingNode = {
        type: 'heading',
      } as NodeType

      if (headingNode.type === 'heading') {
        expect(headingNode).type.toHaveProperty('children')
      }

      // When narrowed to paragraph, children should exist
      const paragraphNode = {
        type: 'paragraph',
      } as NodeType

      if (paragraphNode.type === 'paragraph') {
        expect(paragraphNode).type.toHaveProperty('children')
      }

      // When narrowed to list, children should exist
      const listNode = {
        type: 'list',
      } as NodeType

      if (listNode.type === 'list') {
        expect(listNode).type.toHaveProperty('children')
      }
    })

    test('ensure children accept all node types from the union, not just parent type', () => {
      type NodeType = DefaultTypedEditorState['root']['children'][number]

      const headingNode = {
        type: 'heading',
      } as NodeType

      if (headingNode.type === 'heading') {
        // Children should accept all node types from the union
        expect(headingNode.children[0]!.type).type.toBe<_Hardcoded_DefaultNodeTypes>()
      }
    })

    test('ensure nested children preserve full union type at all depths', () => {
      type RootChildren = DefaultTypedEditorState['root']['children'][number]
      type Level1Children = Extract<RootChildren, { children?: any }>['children']
      type Level2Children = NonNullable<Level1Children>[number]

      // Level 2 children should still have access to all node types
      expect<Level2Children['type']>().type.toBe<_Hardcoded_DefaultNodeTypes>()

      // Level 3 children (if they exist) should also have all node types
      type Level3Children = Extract<Level2Children, { children?: any }>['children']
      type Level3Node = NonNullable<Level3Children>[number]
      expect<Level3Node['type']>().type.toBe<_Hardcoded_DefaultNodeTypes>()
    })

    test('ensure linebreak nodes cannot have children even when nested', () => {
      // This test verifies that the self-recursive `DefaultNodeTypes` union doesn't add children to leaf nodes
      type RootChildren = DefaultTypedEditorState['root']['children'][number]

      // At top level
      type TopLevelLinebreak = Extract<RootChildren, { type: 'linebreak' }>
      expect<TopLevelLinebreak>().type.not.toHaveProperty('children')

      // At nested level (inside a heading's children)
      type HeadingNode = Extract<RootChildren, { type: 'heading' }>
      type HeadingChildren = NonNullable<HeadingNode['children']>[number]
      type NestedLinebreak = Extract<HeadingChildren, { type: 'linebreak' }>
      expect<NestedLinebreak>().type.not.toHaveProperty('children')
    })

    test('ensure type property uses literal types, not string', () => {
      // This verifies the Omit<_, 'type'> fix prevents base Lexical type: string from overriding literals
      type NodeType = DefaultTypedEditorState['root']['children'][number]

      // Type should be a union of literals, not string
      expect<NodeType['type']>().type.toBe<_Hardcoded_DefaultNodeTypes>()
      expect<NodeType['type']>().type.not.toBe<string>()
    })

    test('ensure leaf nodes have NO children key at all (not even children?: never)', () => {
      // This test prevents regression where someone adds `children?: never` back to leaf nodes.
      //
      // WHY `children?: never` BREAKS VS CODE AUTOCOMPLETE:
      // When you have a union like `SerializedHeadingNode | SerializedLineBreakNode`:
      // - If linebreak has `children?: never`, VS Code's IntelliSense gets confused
      // - When typing `type: ''` and pressing Ctrl+Space, it only suggests 'linebreak'
      // - It doesn't suggest 'heading' or other types that have `children?: Array<...>`
      // - This is a VS Code quirk with unions that have conflicting optional properties
      // - TypeScript's type checker works fine, but autocomplete heuristics fail
      //
      // SOLUTION: Use `Omit<_, 'children'>` to completely remove the property
      // - With no `children` key at all, VS Code correctly suggests all types in the union

      // Extract individual node types from the union
      type LinebreakNode = Extract<DefaultNodeTypes, { type: 'linebreak' }>
      type TextNode = Extract<DefaultNodeTypes, { type: 'text' }>
      type TabNode = Extract<DefaultNodeTypes, { type: 'tab' }>

      // 'children' should NOT be a key in these types at all
      // If someone adds `children?: never`, this test will fail
      expect<'children' extends keyof LinebreakNode ? true : false>().type.toBe<false>()
      expect<'children' extends keyof TextNode ? true : false>().type.toBe<false>()
      expect<'children' extends keyof TabNode ? true : false>().type.toBe<false>()
    })

    test('accepts complete heading node as part of DefaultNodeTypes if heading node is explicitly typed', () => {
      const headingNode: SerializedHeadingNode<DefaultNodeTypes> = {
        type: 'heading',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Title',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        tag: 'h1',
        version: 1,
      }

      const editorState: DefaultTypedEditorState = {
        root: {
          type: 'root',
          children: [headingNode],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      }

      expect(editorState).type.toBe<TypedEditorState<DefaultNodeTypes>>()
    })

    test('accepts complete heading node as part of nested children within DefaultNodeTypes if heading node is explicitly typed', () => {
      const headingNode: SerializedHeadingNode<DefaultNodeTypes> = {
        type: 'heading',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Title',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        tag: 'h1',
        version: 1,
      }

      const editorState: DefaultTypedEditorState = {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [headingNode],
              direction: 'ltr',
              format: 'left',
              indent: 0,
              textFormat: 0,
              textStyle: '',
              version: 0,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      }

      expect(editorState).type.toBe<TypedEditorState<DefaultNodeTypes>>()
    })

    test('accepts complete heading node as part of nested, nested children within DefaultNodeTypes if heading node is explicitly typed', () => {
      // Extract the correct children type from DefaultTypedEditorState
      type DefaultChildren = DefaultTypedEditorState['root']['children'][number]

      const headingNode: SerializedHeadingNode<DefaultChildren> = {
        type: 'heading',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Title',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        tag: 'h1',
        version: 1,
      }

      const editorState: DefaultTypedEditorState = {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [],
              direction: 'ltr',
              format: 'left',
              indent: 0,
              textFormat: 0,
              textStyle: '',
              version: 0,
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'link',
                  children: [headingNode],
                  direction: 'ltr',
                  fields: {
                    linkType: 'custom',
                    newTab: false,
                    url: 'https://www.payloadcms.com',
                  },
                  format: 'left',
                  indent: 0,
                  textFormat: 0,
                  version: 0,
                },
              ],
              direction: 'ltr',
              format: 'left',
              indent: 0,
              textFormat: 0,
              textStyle: '',
              version: 0,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      }

      expect(editorState).type.toBe<TypedEditorState<DefaultNodeTypes>>()
    })

    describe('buildEditorState', () => {
      test('buildEditorState returns DefaultTypedEditorState', () => {
        const result = buildEditorState<DefaultNodeTypes>({ text: 'hello' })
        expect(result).type.toBe<DefaultTypedEditorState>()
      })

      test('buildEditorState with text parameter returns DefaultTypedEditorState', () => {
        const result = buildEditorState<DefaultNodeTypes>({ text: 'Hello world' })
        expect(result).type.toBe<DefaultTypedEditorState>()
      })

      test('buildEditorState with nodes parameter returns DefaultTypedEditorState', () => {
        const result = buildEditorState<DefaultNodeTypes>({
          nodes: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'hello',
              version: 1,
            },
          ],
        })
        expect(result).type.toBe<DefaultTypedEditorState>()
      })

      test('buildEditorState with explicit generic returns TypedEditorState<T>', () => {
        const result = buildEditorState<DefaultNodeTypes | SerializedBlockNode>({
          nodes: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'hello',
              version: 1,
            },
          ],
        })
        expect(result).type.toBe<TypedEditorState<DefaultNodeTypes | SerializedBlockNode>>()
      })

      test('buildEditorState with explicit SerializedBlockNode generic returns TypedEditorState<SerializedBlockNode>', () => {
        const result = buildEditorState<SerializedBlockNode>({
          nodes: [
            {
              type: 'block',
              fields: {
                id: 'id',
                blockName: 'Cool block',
                blockType: 'myBlock',
              },
              format: 'left',
              version: 1,
            },
          ],
        })
        expect(result).type.toBe<TypedEditorState<SerializedBlockNode>>()
      })

      test('buildEditorState return type includes correct node types in children', () => {
        const result = buildEditorState<DefaultNodeTypes>({ text: 'hello' })
        expect(result.root.children[0]!.type).type.toBe<_Hardcoded_DefaultNodeTypes>()
      })

      test('buildEditorState with explicit generic includes custom node types in children', () => {
        const result = buildEditorState<DefaultNodeTypes | SerializedBlockNode>({ text: 'hello' })
        expect(result.root.children[0]!.type).type.toBe<'block' | _Hardcoded_DefaultNodeTypes>()
      })

      test('buildEditorState with generated field type can be assigned to Post richText field', () => {
        const result = buildEditorState<Post['richText']>({ text: 'hello' })
        expect(result).type.toBeAssignableTo<Post['richText']>()
      })

      test('buildEditorState accepts a generated field type directly and returns exactly it', () => {
        // The ergonomic path for users with generated types: pass the field type, no node extraction.
        const result = buildEditorState<Post['richText']>({ text: 'hello' })
        expect(result).type.toBe<Post['richText']>()
      })

      test('buildEditorState with a generated field type directly narrows `nodes` to the field — a registered node type is accepted', () => {
        // `horizontalrule` is part of this editor, so calling with it is valid.
        expect(buildEditorState<Post['richText']>).type.toBeCallableWith({
          nodes: [{ type: 'horizontalrule', version: 1 }],
        })
      })

      test('buildEditorState with a generated field type directly narrows `nodes` to the field — an unregistered node type errors', () => {
        // `block` is not enabled on this editor, so calling with it is rejected.
        expect(buildEditorState<Post['richText']>).type.not.toBeCallableWith({
          nodes: [
            {
              type: 'block',
              fields: { id: 'x', blockName: '', blockType: 'whatever' },
              format: '',
              version: 1,
            },
          ],
        })
      })

      test('buildEditorState allows pushing typed nodes to children', () => {
        const result = buildEditorState<DefaultNodeTypes>({ text: 'hello' })
        result.root.children.push({
          type: 'heading',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Heading text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          tag: 'h1',
          version: 1,
        })
        expect(result).type.toBe<DefaultTypedEditorState>()
      })

      test('buildEditorState correctly validates incomplete text node (missing text property)', () => {
        expect(buildEditorState<DefaultNodeTypes>).type.not.toBeCallableWith({
          nodes: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              version: 1,
              // Missing 'text' property - this should be a type error
            },
          ],
        })
      })

      test('buildEditorState validates complete text node correctly', () => {
        const result = buildEditorState<DefaultNodeTypes>({
          nodes: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'hello',
              version: 1,
            },
          ],
        })
        expect(result).type.toBe<DefaultTypedEditorState>()
        expect(result).type.toBe<TypedEditorState<DefaultNodeTypes>>()
      })

      test('buildEditorState correctly validates incomplete heading node (missing tag property)', () => {
        expect(buildEditorState<DefaultNodeTypes>).type.not.toBeCallableWith({
          nodes: [
            {
              type: 'heading',
              children: [],
              direction: 'ltr',
              format: '',
              indent: 0,
              version: 1,
              // Missing 'tag' property - this should be a type error
            },
          ],
        })
      })

      test('buildEditorState with explicit generic allows custom nodes', () => {
        const result = buildEditorState<DefaultNodeTypes | SerializedBlockNode>({
          nodes: [
            {
              type: 'block',
              fields: {
                id: 'id',
                blockName: 'Cool block',
                blockType: 'myBlock',
              },
              format: 'left',
              version: 1,
            },
          ],
        })
        expect(result).type.toBe<TypedEditorState<DefaultNodeTypes | SerializedBlockNode>>()
      })

      test('buildEditorState returns DefaultTypedEditorState even with incomplete nodes (though nodes cause errors)', () => {
        const result = buildEditorState<DefaultNodeTypes>({
          nodes: [
            {
              type: 'text',
              version: 1,
              // Missing many properties
            } as any, // Using 'as any' to bypass the error for testing purposes
          ],
        })
        expect(result).type.toBe<DefaultTypedEditorState>()
      })

      test('accepts complete heading node with DefaultNodeTypes', () => {
        const result = buildEditorState<DefaultNodeTypes>({
          nodes: [
            {
              type: 'heading',
              children: [
                {
                  type: 'text',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'Title',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              tag: 'h1',
              version: 1,
            },
          ],
        })
        expect(result).type.toBe<TypedEditorState<DefaultNodeTypes>>()
      })

      test('throws error for invalid children of non-explicit typed heading node', () => {
        expect(buildEditorState<DefaultNodeTypes>).type.not.toBeCallableWith({
          nodes: [
            {
              type: 'heading',
              children: [
                {
                  type: 'text',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'Title',
                  version: 1,
                },
                {
                  type: 'invalid',
                  test: 'test',
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              tag: 'h1',
              version: 1,
            },
          ],
        })
      })

      test('accepts complete heading node with DefaultNodeTypes if heading node is explicitly typed', () => {
        // Extract the correct children type for the heading node
        type DefaultChildren = TypedEditorState<DefaultNodeTypes>['root']['children'][number]

        const headingNode: SerializedHeadingNode<DefaultChildren> = {
          type: 'heading',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Title',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          tag: 'h1',
          version: 1,
        }
        const result = buildEditorState<DefaultNodeTypes>({
          nodes: [headingNode],
        })
        expect(result).type.toBe<TypedEditorState<DefaultNodeTypes>>()
      })
    })

    describe('generated <-> runtime per-node compatibility', () => {
      // Per-node assertions pinpoint which node differs when the whole-tree
      // assertions above fail.

      test('SerializedTextNode: generated <-> runtime', () => {
        expect<GenText>().type.toBeAssignableFrom<SerializedTextNode>()
        expect<SerializedTextNode>().type.toBeAssignableFrom<GenText>()
      })

      test('SerializedTabNode: generated <-> runtime', () => {
        expect<GenTab>().type.toBeAssignableFrom<SerializedTabNode>()
        expect<SerializedTabNode>().type.toBeAssignableFrom<GenTab>()
      })

      test('SerializedLineBreakNode: generated <-> runtime', () => {
        expect<GenLB>().type.toBeAssignableFrom<SerializedLineBreakNode>()
        expect<SerializedLineBreakNode>().type.toBeAssignableFrom<GenLB>()
      })

      test('SerializedHorizontalRuleNode: generated <-> runtime', () => {
        expect<GenHR>().type.toBeAssignableFrom<SerializedHorizontalRuleNode>()
        expect<SerializedHorizontalRuleNode>().type.toBeAssignableFrom<GenHR>()
      })

      test('SerializedParagraphNode<T>: generated <-> runtime', () => {
        expect<GenParagraph<GenNodeUnion>>().type.toBeAssignableFrom<
          SerializedParagraphNode<GenNodeUnion>
        >()
        expect<SerializedParagraphNode<GenNodeUnion>>().type.toBeAssignableFrom<
          GenParagraph<GenNodeUnion>
        >()
      })

      test('SerializedHeadingNode<T>: generated <-> runtime', () => {
        expect<GenHeading<GenNodeUnion>>().type.toBeAssignableFrom<
          SerializedHeadingNode<GenNodeUnion>
        >()
        expect<SerializedHeadingNode<GenNodeUnion>>().type.toBeAssignableFrom<
          GenHeading<GenNodeUnion>
        >()
      })

      test('SerializedQuoteNode<T>: generated <-> runtime', () => {
        expect<GenQuote<GenNodeUnion>>().type.toBeAssignableFrom<
          SerializedQuoteNode<GenNodeUnion>
        >()
        expect<SerializedQuoteNode<GenNodeUnion>>().type.toBeAssignableFrom<
          GenQuote<GenNodeUnion>
        >()
      })

      test('SerializedListNode<T>: generated <-> runtime', () => {
        expect<GenList<GenNodeUnion>>().type.toBeAssignableFrom<SerializedListNode<GenNodeUnion>>()
        expect<SerializedListNode<GenNodeUnion>>().type.toBeAssignableFrom<GenList<GenNodeUnion>>()
      })

      test('SerializedListItemNode<T>: generated <-> runtime', () => {
        expect<GenLI<GenNodeUnion>>().type.toBeAssignableFrom<
          SerializedListItemNode<GenNodeUnion>
        >()
        expect<SerializedListItemNode<GenNodeUnion>>().type.toBeAssignableFrom<
          GenLI<GenNodeUnion>
        >()
      })

      test('SerializedLinkNode<T>: generated <-> runtime', () => {
        expect<GenLink<GenNodeUnion>>().type.toBeAssignableFrom<SerializedLinkNode<GenNodeUnion>>()
        expect<SerializedLinkNode<GenNodeUnion>>().type.toBeAssignableFrom<GenLink<GenNodeUnion>>()
      })

      test('SerializedAutoLinkNode<T>: generated <-> runtime', () => {
        expect<GenAutoLink<GenNodeUnion>>().type.toBeAssignableFrom<
          SerializedAutoLinkNode<GenNodeUnion>
        >()
        expect<SerializedAutoLinkNode<GenNodeUnion>>().type.toBeAssignableFrom<
          GenAutoLink<GenNodeUnion>
        >()
      })

      test('SerializedRelationshipNode: generated <-> runtime', () => {
        // The relationship node excludes upload collections, so compare against the
        // relationship member as it actually appears in the generated union.
        type GenRelationshipInUnion = Extract<GenNodeUnion, { type: 'relationship' }>
        expect<GenRelationshipInUnion>().type.toBeAssignableFrom<SerializedRelationshipNode>()
        expect<SerializedRelationshipNode>().type.toBeAssignableFrom<GenRelationshipInUnion>()
      })

      test('SerializedUploadNode: generated narrows correctly per collection', () => {
        // With per-collection upload fields, the generated type is a discriminated union of
        // per-collection variants rather than one SerializedUploadNode with unioned generics.
        type GenUploadInUnion = Extract<GenNodeUnion, { type: 'upload' }>
        type MediaVariant = Extract<GenUploadInUnion, { relationTo: 'media' }>
        type GalleryVariant = Extract<GenUploadInUnion, { relationTo: 'gallery' }>

        expect<MediaVariant>().type.toHaveProperty('fields')
        expect<GalleryVariant>().type.toHaveProperty('fields')

        expect<MediaVariant['relationTo']>().type.toBe<'media'>()
        expect<GalleryVariant['relationTo']>().type.toBe<'gallery'>()
      })

      test('SerializedUploadNode: discriminated fields per collection', () => {
        type GenUpload = Extract<GenNodeUnion, { type: 'upload' }>

        type MediaUpload = Extract<GenUpload, { relationTo: 'media' }>
        type GalleryUpload = Extract<GenUpload, { relationTo: 'gallery' }>

        expect<MediaUpload['fields']>().type.toBe<MediaUploadFields>()
        expect<GalleryUpload['fields']>().type.toBe<GalleryUploadFields>()

        expect<MediaUpload['fields']>().type.toHaveProperty('caption')
        expect<GalleryUpload['fields']>().type.toHaveProperty('altText')

        expect<MediaUpload['fields']>().type.not.toHaveProperty('altText')
        expect<GalleryUpload['fields']>().type.not.toHaveProperty('caption')
      })

      test('LexicalRichText<T>.root: generated root children are typed as the generated node union', () => {
        type GenChild = Post['richText']['root']['children'][number]
        expect<GenChild>().type.toBe<GenNodeUnion>()
      })
    })

    describe('node union composition (WithDefaultNodes)', () => {
      type MyBlock = SerializedBlockNode<{ blockType: 'myBlock'; foo: string }>

      // Previously impossible: `DefaultNodeTypesOf<Self>` was a circular reference (TS2456), and
      // `DefaultNodeTypes | Block` only adds the block at the top level. WithDefaultNodes threads it.
      test('WithDefaultNodes<Block> threads the block into container children', () => {
        type Nodes = WithDefaultNodes<MyBlock>
        type ParagraphChild = Extract<Nodes, { type: 'paragraph' }>['children'][number]
        expect<Extract<ParagraphChild, { type: 'block' }>>().type.toBe<MyBlock>()
      })

      // Same assertion for DefaultTypedEditorState - does its `TAdditional` thread into children too?
      test('DefaultTypedEditorState<Block> threads the block into container children', () => {
        type Nodes = DefaultTypedEditorState<MyBlock>['root']['children'][number]
        type ParagraphChild = Extract<Nodes, { type: 'paragraph' }>['children'][number]
        expect<Extract<ParagraphChild, { type: 'block' }>>().type.toBe<MyBlock>()
      })
    })
  })

  describe('sdk', () => {
    test('ensure generated types can be manually assigned to PayloadSDK generic', () => {
      expect(PayloadSDK<LocalConfig>).type.toBeConstructableWith({ baseURL: '' })
    })

    test('ensure SDK without generic automatically uses GeneratedTypes', () => {
      const _sdk = new PayloadSDK({ baseURL: '' })
      expect<Parameters<typeof _sdk.create>[0]['collection']>().type.toBe<
        | 'draft-posts'
        | 'fallback-users'
        | 'gallery'
        | 'input-types'
        | 'media'
        | 'pages'
        | 'pages-categories'
        | 'payload-kv'
        | 'payload-locked-documents'
        | 'payload-migrations'
        | 'payload-preferences'
        | 'posts'
        | 'users'
      >()
    })

    test('should expose strategy only on SDK auth result users', async () => {
      const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })
      const meResult = await _sdk.me({ collection: 'users' })
      const refreshResult = await _sdk.refreshToken({ collection: 'users' })

      expect(meResult).type.not.toHaveProperty('strategy')
      expect(meResult.user).type.toHaveProperty('_strategy')
      expect(refreshResult).type.not.toHaveProperty('strategy')
      expect(refreshResult.user).type.toHaveProperty('_strategy')
    })

    test('ensure SDK with explicit generic uses has correct collection types', () => {
      const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })
      // ensure collection property of sdk.create has posts in the union type
      expect<Parameters<typeof _sdk.create>[0]['collection']>().type.toBe<
        | 'draft-posts'
        | 'fallback-users'
        | 'gallery'
        | 'input-types'
        | 'media'
        | 'pages'
        | 'pages-categories'
        | 'payload-kv'
        | 'payload-locked-documents'
        | 'payload-migrations'
        | 'payload-preferences'
        | 'posts'
        | 'users'
      >()
    })

    test('ensure SDK with explicit generic uses has correct data for collection in create', async () => {
      const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })
      const result = await _sdk.create({
        collection: 'posts',
        data: {
          radioField: 'option-1',
          richText: {
            root: {
              type: 'root',
              children: [],
              direction: null,
              format: '',
              indent: 0,
              version: 0,
            },
          },
          selectField: 'option-1',
          title: 'Test Post',
        },
      })
      expect(result).type.toBe<LocalConfig['collections']['posts']>()
    })

    test('SDK create data should be typed and reject invalid properties', () => {
      const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })
      expect(_sdk.create).type.not.toBeCallableWith({
        collection: 'posts',
        data: {
          invalidProperty: 'should error',
          radioField: 'option-1',
          richText: {
            root: {
              type: 'root',
              children: [],
              direction: null,
              format: '',
              indent: 0,
              version: 0,
            },
          },
          selectField: 'option-1',
          title: 'Test Post',
        },
      })
    })

    test('SDK with select in findByID returns correct types', async () => {
      const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })
      const result = await _sdk.findByID({
        id: 'id',
        collection: 'posts',
        select: { namedGroup: true, title: true },
      })
      expect(result).type.toBe<Pick<Post, 'id' | 'namedGroup' | 'title'>>()
    })

    test('SDK with empty select only returns id', async () => {
      const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })

      const result = await _sdk.findByID({
        id: 'id',
        collection: 'posts',
        select: {},
      })
      expect(result).type.toBe<{ id: string }>()
    })

    test('SDK with select excluding field in findByID returns correct types', async () => {
      const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })
      const result = await _sdk.findByID({
        id: 'id',
        collection: 'posts',
        select: { richText: false },
      })
      expect(result).type.toBe<Omit<Post, 'richText'>>()
    })

    describe('version and action types', () => {
      test('should type required fields as optional for latest and draft reads', async () => {
        const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })
        const latest = await _sdk.find({
          collection: 'draft-posts',
          version: 'latest',
        })
        const draftOnly = await _sdk.find({
          collection: 'draft-posts',
          version: 'draft',
        })

        expect(latest.docs[0]!.description).type.toBe<string | undefined>()
        expect(latest.docs[0]!.title).type.toBe<string | undefined>()
        expect(latest.docs[0]!.id).type.not.toBe<undefined>()

        expect(draftOnly.docs[0]!.title).type.toBe<string | undefined>()
      })

      test('should keep required fields required for published and omitted reads', async () => {
        const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })
        const omitted = await _sdk.find({
          collection: 'draft-posts',
        })
        const published = await _sdk.find({
          collection: 'draft-posts',
          version: 'published',
        })

        expect(omitted.docs[0]!.description).type.toBe<string>()
        expect(omitted.docs[0]!.title).type.toBe<string>()
        expect(published.docs[0]!.title).type.toBe<string>()
      })

      test('should type latest and draft auth users with optional user fields', async () => {
        type DraftAuthConfig = {
          auth: {
            'draft-users': unknown
          }
          collections: {
            'draft-users': {
              displayName: string
              email: string
              id: string
            }
          }
          collectionsSelect: {
            'draft-users': Record<string, boolean>
          }
        } & Omit<LocalConfig, 'auth' | 'collections' | 'collectionsSelect'>

        const _sdk = new PayloadSDK<DraftAuthConfig>({ baseURL: '' })
        const omitted = await _sdk.me({ collection: 'draft-users' })
        const published = await _sdk.me({ collection: 'draft-users', version: 'published' })
        const latest = await _sdk.me({ collection: 'draft-users', version: 'latest' })
        const draft = await _sdk.me({ collection: 'draft-users', version: 'draft' })

        expect(omitted.user.email).type.toBe<string>()
        expect(published.user.email).type.toBe<string>()
        expect(latest.user.email).type.toBe<string | undefined>()
        expect(draft.user.displayName).type.toBe<string | undefined>()
        expect(draft.user.id).type.toBe<string>()
      })

      test('should reject the old draft option', () => {
        const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })

        expect(_sdk.find).type.not.toBeCallableWith({ collection: 'draft-posts', draft: true })
        expect(_sdk.findByID).type.not.toBeCallableWith({
          id: 1,
          collection: 'draft-posts',
          draft: true,
        })
        expect(_sdk.create).type.not.toBeCallableWith({
          collection: 'draft-posts',
          data: {
            description: 'Description',
            title: 'Test',
          },
          draft: true,
        })
        expect(_sdk.update).type.not.toBeCallableWith({
          id: 1,
          collection: 'draft-posts',
          data: { title: 'Test' },
          draft: true,
        })
        expect(_sdk.restoreVersion).type.not.toBeCallableWith({
          id: 'id',
          collection: 'draft-posts',
          draft: true,
        })
        expect(_sdk.delete).type.not.toBeCallableWith({
          id: 1,
          collection: 'draft-posts',
          draft: true,
        })
      })

      test('should allow partial create data with saveDraft regardless of status', () => {
        const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })

        expect(_sdk.create).type.toBeCallableWith({
          action: 'saveDraft',
          collection: 'draft-posts',
          data: {
            title: 'Test',
          },
        })

        expect(_sdk.create).type.toBeCallableWith({
          action: 'saveDraft',
          collection: 'draft-posts',
          data: {
            _status: 'published',
            title: 'Test',
          },
        })
      })

      test('should require all required create fields with publish regardless of status', () => {
        const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })

        expect(_sdk.create).type.not.toBeCallableWith({
          action: 'publish',
          collection: 'draft-posts',
          data: {
            title: 'Test',
          },
        })

        expect(_sdk.create).type.toBeCallableWith({
          action: 'publish',
          collection: 'draft-posts',
          data: {
            description: 'Description',
            title: 'Test',
          },
        })
      })

      test('should require all required create fields when action is omitted and status is published', () => {
        const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })

        expect(_sdk.create).type.not.toBeCallableWith({
          collection: 'draft-posts',
          data: {
            _status: 'published',
            title: 'Test',
          },
        })

        expect(_sdk.create).type.toBeCallableWith({
          collection: 'draft-posts',
          data: {
            _status: 'published',
            description: 'Description',
            title: 'Test',
          },
        })
      })

      test('should allow partial create data when action is omitted and status is draft or omitted', () => {
        const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })

        expect(_sdk.create).type.toBeCallableWith({
          collection: 'draft-posts',
          data: {
            title: 'Test',
          },
        })

        expect(_sdk.create).type.toBeCallableWith({
          collection: 'draft-posts',
          data: {
            _status: 'draft',
            title: 'Test',
          },
        })
      })

      test('should still accept _status in create data', () => {
        const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })

        expect(_sdk.create).type.toBeCallableWith({
          action: 'publish',
          collection: 'draft-posts',
          data: {
            _status: 'published',
            description: 'Description',
            title: 'Test',
          },
        })
      })

      test('should forbid draft-only create actions on non-draft collections', () => {
        const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })

        expect(_sdk.create).type.not.toBeCallableWith({
          action: 'saveDraft',
          collection: 'pages',
          data: {
            title: 'Test',
          },
        })

        expect(_sdk.create).type.toBeCallableWith({
          collection: 'pages',
          data: {
            title: 'Test',
          },
        })

        expect(_sdk.create).type.toBeCallableWith({
          action: 'publish',
          collection: 'pages',
          data: {
            title: 'Test',
          },
        })
      })

      test('should reject version in find on non-draft collections', () => {
        const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })

        expect(_sdk.find).type.not.toBeCallableWith({ collection: 'pages', version: 'latest' })
        expect(_sdk.find).type.toBeCallableWith({ collection: 'pages' })
        expect(_sdk.find).type.toBeCallableWith({ collection: 'draft-posts', version: 'latest' })
        expect(_sdk.find).type.toBeCallableWith({
          collection: 'draft-posts',
          version: 'published',
        })
        expect(_sdk.find).type.toBeCallableWith({ collection: 'draft-posts', version: 'draft' })
      })

      test('should reject draft-only update actions on non-draft collections', () => {
        const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })

        expect(_sdk.update).type.not.toBeCallableWith({
          id: 1,
          action: 'saveDraft',
          collection: 'pages',
          data: { title: 'Test' },
        })
        expect(_sdk.update).type.not.toBeCallableWith({
          id: 1,
          action: 'unpublish',
          collection: 'pages',
          data: { title: 'Test' },
        })
        expect(_sdk.update).type.toBeCallableWith({
          id: 1,
          action: 'saveDraft',
          collection: 'draft-posts',
          data: { title: 'Test' },
        })
        expect(_sdk.update).type.toBeCallableWith({
          id: 1,
          action: 'unpublish',
          collection: 'draft-posts',
          data: { title: 'Test' },
        })
      })

      test('should allow saveDraft and publish but reject unpublish for restoreVersion', () => {
        const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })

        expect(_sdk.restoreVersion).type.toBeCallableWith({
          id: 'id',
          collection: 'draft-posts',
        })
        expect(_sdk.restoreVersion).type.toBeCallableWith({
          id: 'id',
          action: 'publish',
          collection: 'draft-posts',
        })
        expect(_sdk.restoreVersion).type.toBeCallableWith({
          id: 'id',
          action: 'saveDraft',
          collection: 'draft-posts',
        })
        expect(_sdk.restoreVersion).type.not.toBeCallableWith({
          id: 'id',
          action: 'unpublish',
          collection: 'draft-posts',
        })
        expect(_sdk.restoreVersion).type.not.toBeCallableWith({
          id: 'id',
          action: 'saveDraft',
          collection: 'pages',
        })
      })

      test('should reject version in global findOne on non-draft globals', () => {
        const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })

        expect(_sdk.findGlobal).type.not.toBeCallableWith({ slug: 'menu', version: 'latest' })
        expect(_sdk.findGlobal).type.toBeCallableWith({ slug: 'menu' })
        expect(_sdk.findGlobal).type.toBeCallableWith({ slug: 'settings', version: 'latest' })
      })

      test('should reject draft-only global update actions on non-draft globals', () => {
        const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })

        expect(_sdk.updateGlobal).type.not.toBeCallableWith({
          slug: 'menu',
          action: 'saveDraft',
          data: {},
        })
        expect(_sdk.updateGlobal).type.toBeCallableWith({
          slug: 'settings',
          action: 'saveDraft',
          data: {},
        })
      })

      test('should allow saveDraft and publish but reject unpublish for restoreGlobalVersion', () => {
        const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })

        expect(_sdk.restoreGlobalVersion).type.toBeCallableWith({
          id: 'id',
          slug: 'settings',
        })
        expect(_sdk.restoreGlobalVersion).type.toBeCallableWith({
          id: 'id',
          slug: 'settings',
          action: 'saveDraft',
        })
        expect(_sdk.restoreGlobalVersion).type.not.toBeCallableWith({
          id: 'id',
          slug: 'settings',
          action: 'unpublish',
        })
        expect(_sdk.restoreGlobalVersion).type.not.toBeCallableWith({
          id: 'id',
          slug: 'menu',
          action: 'saveDraft',
        })
      })
    })
  })

  describe('richText enforcement in local API and SDK', () => {
    test('payload.create accepts buildEditorState output as richText', () => {
      expect(payload.create).type.toBeCallableWith({
        collection: 'posts',
        data: {
          radioField: 'option-1',
          richText: buildEditorState<Post['richText']>({ text: 'hello' }),
          selectField: 'option-1',
        },
      })
    })

    test('payload.create accepts inline richText with correct node structure', () => {
      expect(payload.create).type.toBeCallableWith({
        collection: 'posts',
        data: {
          radioField: 'option-1',
          richText: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: 'hello',
                      version: 1,
                    },
                  ],
                  direction: null,
                  format: '',
                  indent: 0,
                  textFormat: 0,
                  textStyle: '',
                  version: 1,
                },
              ],
              direction: null,
              format: '',
              indent: 0,
              version: 1,
            },
          },
          selectField: 'option-1',
        },
      })
    })

    test('payload.update accepts richText via buildEditorState', () => {
      expect(payload.update).type.toBeCallableWith({
        id: 1,
        collection: 'posts',
        data: {
          richText: buildEditorState<Post['richText']>({ text: 'updated' }),
        },
      })
    })

    test('payload.updateGlobal accepts richText via buildEditorState', () => {
      expect(payload.updateGlobal).type.toBeCallableWith({
        slug: 'menu',
        data: {
          richText: buildEditorState<Menu['richText']>({ text: 'nav content' }),
        },
      })
    })

    test('SDK create accepts buildEditorState output as richText', () => {
      const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })

      expect(_sdk.create).type.toBeCallableWith({
        collection: 'posts',
        data: {
          radioField: 'option-1',
          richText: buildEditorState<Post['richText']>({ text: 'hello' }),
          selectField: 'option-1',
        },
      })
    })

    test('convertLexicalToPlaintext accepts generated richText directly', () => {
      const _post = null as unknown as Post

      expect(convertLexicalToPlaintext).type.toBeCallableWith({ data: _post.richText })
    })
  })

  describe('input types narrow the write shape', () => {
    test('relationship and upload values are ID-only in write data', () => {
      // The read type also accepts a populated document — a value you never actually write.
      expect<PagesCategory>().type.toBeAssignableTo<InputType['category']>()
      expect<PagesCategory[]>().type.toBeAssignableTo<NonNullable<InputType['categories']>>()
      expect<Page>().type.toBeAssignableTo<NonNullable<InputType['related']>['value']>()
      expect<Media>().type.toBeAssignableTo<InputType['image']>()

      expect<PagesCategory>().type.not.toBeAssignableTo<InputTypeInput['category']>()
      expect<PagesCategory[]>().type.not.toBeAssignableTo<
        NonNullable<InputTypeInput['categories']>
      >()
      expect<Page>().type.not.toBeAssignableTo<NonNullable<InputTypeInput['related']>['value']>()
      expect<Media>().type.not.toBeAssignableTo<InputTypeInput['image']>()
    })

    test('rich text relationship and upload nodes are ID-only in write data', () => {
      expect<PostInput['richText']>().type.toBeAssignableTo<Post['richText']>()
      expect<Post['richText']>().type.not.toBeAssignableTo<PostInput['richText']>()
    })

    test('id is optional in write data', () => {
      expect<InputType['id']>().type.toBe<string>()
      expect<InputTypeInput['id']>().type.toBe<string | undefined>()
    })

    test('createdAt and updatedAt are not part of write data', () => {
      expect<InputType>().type.toHaveProperty('createdAt')
      expect<InputType>().type.toHaveProperty('updatedAt')
      expect<InputTypeInput>().type.not.toHaveProperty('createdAt')
      expect<InputTypeInput>().type.not.toHaveProperty('updatedAt')
    })

    test('_status is part of write data for draft-enabled entities', () => {
      expect<DraftPost>().type.toHaveProperty('_status')
      expect<DraftPostInput>().type.toHaveProperty('_status')
      expect<DraftPostInput['_status']>().type.toBe<DraftPost['_status']>()
    })

    test('fields with a defaultValue are optional in write data', () => {
      expect<InputType['status']>().type.toBe<'draft' | 'published'>()
      expect<InputTypeInput['status']>().type.toBe<'draft' | 'published' | undefined>()
    })

    test('virtual fields are not part of write data', () => {
      expect<InputType>().type.toHaveProperty('computedTitle')
      expect<InputTypeInput>().type.not.toHaveProperty('computedTitle')
    })

    test('join fields are not part of write data', () => {
      expect<PagesCategory>().type.toHaveProperty('relatedPages')
      expect<PagesCategoryInput>().type.not.toHaveProperty('relatedPages')
    })

    test('the auth collection discriminator is not part of write data', () => {
      expect<User>().type.toHaveProperty('collection')
      expect<UserInput>().type.not.toHaveProperty('collection')
    })
  })

  // The Local API's `create`/`update` type `data` against the read shape, not the input shape.
  // The input types are a valid subset, so a value typed as `*Input` is always accepted there.
  describe('input types are assignable to create / update data (which expect the read shape)', () => {
    test('a full PostInput is valid payload.create and payload.update data', () => {
      const data = {} as PostInput
      expect(payload.create).type.toBeCallableWith({ collection: 'posts', data })
      expect(payload.update).type.toBeCallableWith({ id: 1, collection: 'posts', data })
    })

    test('a full InputTypeInput is valid payload.update data', () => {
      const data = {} as InputTypeInput
      expect(payload.update).type.toBeCallableWith({ id: 1, collection: 'input-types', data })
    })

    test('input field values (relationship, hasMany, polymorphic, upload, defaulted) are valid update data', () => {
      const input = {} as InputTypeInput
      expect(payload.update).type.toBeCallableWith({
        id: 1,
        collection: 'input-types',
        data: {
          categories: input.categories,
          category: input.category,
          image: input.image,
          related: input.related,
          status: input.status,
        },
      })
    })

    test('input rich text (ID-only relationship + block nodes) is valid update data', () => {
      const richText = {} as InputTypeInput['richText']
      expect(payload.update).type.toBeCallableWith({
        id: 1,
        collection: 'input-types',
        data: { richText },
      })
    })
  })

  describe('version and action types', () => {
    describe('query operations', () => {
      test('should type required fields as optional for latest and draft reads', async () => {
        const latest = await payload.find({
          collection: 'draft-posts',
          version: 'latest',
        })
        const draftOnly = await payload.find({
          collection: 'draft-posts',
          version: 'draft',
        })

        expect(latest.docs[0]!.description).type.toBe<string | undefined>()
        expect(latest.docs[0]!.title).type.toBe<string | undefined>()
        expect(latest.docs[0]!.id).type.not.toBe<undefined>()
        expect(latest.docs[0]!.createdAt).type.toBe<string | undefined>()
        expect(latest.docs[0]!.updatedAt).type.toBe<string | undefined>()

        expect(draftOnly.docs[0]!.title).type.toBe<string | undefined>()
      })

      test('should keep required fields required for published and omitted reads', async () => {
        const omitted = await payload.find({
          collection: 'draft-posts',
        })
        const published = await payload.find({
          collection: 'draft-posts',
          version: 'published',
        })

        expect(omitted.docs[0]!.description).type.toBe<string>()
        expect(omitted.docs[0]!.title).type.toBe<string>()
        expect(omitted.docs[0]!.id).type.not.toBe<undefined>()
        expect(omitted.docs[0]!.createdAt).type.toBe<string>()
        expect(omitted.docs[0]!.updatedAt).type.toBe<string>()

        expect(published.docs[0]!.title).type.toBe<string>()
      })

      test('should reject the old draft read option', () => {
        expect(payload.find).type.not.toBeCallableWith({ collection: 'draft-posts', draft: true })
        expect(payload.findByID).type.not.toBeCallableWith({
          collection: 'draft-posts',
          id: 1,
          draft: true,
        })
      })
    })

    describe('create operations', () => {
      test('should allow partial create data with saveDraft regardless of status', () => {
        expect(payload.create).type.toBeCallableWith({
          collection: 'draft-posts',
          action: 'saveDraft',
          data: {
            title: 'Test',
          },
        })

        expect(payload.create).type.toBeCallableWith({
          collection: 'draft-posts',
          action: 'saveDraft',
          data: {
            _status: 'published',
            title: 'Test',
          },
        })
      })

      test('should require all required create fields with publish regardless of status', () => {
        expect(payload.create).type.not.toBeCallableWith({
          collection: 'draft-posts',
          action: 'publish',
          data: {
            title: 'Test',
          },
        })

        expect(payload.create).type.toBeCallableWith({
          collection: 'draft-posts',
          action: 'publish',
          data: {
            title: 'Test',
            description: 'Description',
          },
        })
      })

      test('should require all required create fields when action is omitted and status is published', () => {
        expect(payload.create).type.not.toBeCallableWith({
          collection: 'draft-posts',
          data: {
            _status: 'published',
            title: 'Test',
          },
        })

        expect(payload.create).type.toBeCallableWith({
          collection: 'draft-posts',
          data: {
            _status: 'published',
            title: 'Test',
            description: 'Description',
          },
        })
      })

      test('should allow partial create data when action is omitted and status is draft or omitted', () => {
        expect(payload.create).type.toBeCallableWith({
          collection: 'draft-posts',
          data: {
            title: 'Test',
          },
        })

        expect(payload.create).type.toBeCallableWith({
          collection: 'draft-posts',
          data: {
            _status: 'draft',
            title: 'Test',
          },
        })
      })

      test('should still accept _status in create data', () => {
        expect(payload.create).type.toBeCallableWith({
          collection: 'draft-posts',
          action: 'publish',
          data: {
            _status: 'published',
            title: 'Test',
            description: 'Description',
          },
        })
      })

      test('should forbid version and draft-only create actions on non-draft collections', () => {
        expect(payload.create).type.not.toBeCallableWith({
          collection: 'pages',
          action: 'saveDraft',
          data: {
            title: 'Test',
          },
        })

        expect(payload.create).type.not.toBeCallableWith({
          collection: 'pages',
          data: {
            title: 'Test',
          },
          version: 'latest',
        })

        expect(payload.create).type.toBeCallableWith({
          collection: 'pages',
          data: {
            title: 'Test',
          },
        })

        expect(payload.create).type.toBeCallableWith({
          collection: 'pages',
          action: 'publish',
          data: {
            title: 'Test',
          },
        })
      })

      test('should reject the old draft write option', () => {
        expect(payload.create).type.not.toBeCallableWith({
          collection: 'draft-posts',
          data: {
            title: 'Test',
            description: 'Description',
          },
          draft: true,
        })
      })

      test('should reject invalid create properties regardless of action', () => {
        expect(payload.create).type.not.toBeCallableWith({
          collection: 'draft-posts',
          action: 'publish',
          data: {
            title: 'Test',
            description: 'Description',
            invalidProperty: 'should error',
          },
        })

        expect(payload.create).type.not.toBeCallableWith({
          collection: 'draft-posts',
          action: 'saveDraft',
          data: {
            title: 'Test',
            invalidProperty: 'should error',
          },
        })
      })

      test('should create pages with all fields', () => {
        expect(payload.create).type.toBeCallableWith({
          collection: 'pages',
          data: {
            title: 'Page Title',
          },
        })
      })

      test('should create pages without optional fields', () => {
        expect(payload.create).type.toBeCallableWith({
          collection: 'pages',
          data: {
            title: 'Page Title',
          },
        })
      })
    })

    describe('entity-aware version and action options', () => {
      test('should reject version in find on non-draft collections', () => {
        expect(payload.find).type.not.toBeCallableWith({ collection: 'pages', version: 'latest' })
        expect(payload.find).type.not.toBeCallableWith({
          collection: 'pages',
          version: 'published',
        })
        expect(payload.find).type.toBeCallableWith({ collection: 'pages' })
        expect(payload.find).type.toBeCallableWith({ collection: 'draft-posts', version: 'latest' })
        expect(payload.find).type.toBeCallableWith({
          collection: 'draft-posts',
          version: 'published',
        })
        expect(payload.find).type.toBeCallableWith({ collection: 'draft-posts', version: 'draft' })
      })

      test('should reject version in findByID on non-draft collections', () => {
        expect(payload.findByID).type.not.toBeCallableWith({
          collection: 'pages',
          id: 1,
          version: 'latest',
        })
        expect(payload.findByID).type.toBeCallableWith({
          collection: 'draft-posts',
          id: 1,
          version: 'draft',
        })
      })

      test('should reject draft-only update actions on non-draft collections', () => {
        expect(payload.update).type.not.toBeCallableWith({
          collection: 'pages',
          id: 1,
          data: { title: 'Test' },
          action: 'saveDraft',
        })
        expect(payload.update).type.not.toBeCallableWith({
          collection: 'pages',
          id: 1,
          data: { title: 'Test' },
          action: 'unpublish',
        })
        expect(payload.update).type.toBeCallableWith({
          collection: 'draft-posts',
          id: 1,
          data: { title: 'Test' },
          action: 'saveDraft',
        })
        expect(payload.update).type.toBeCallableWith({
          collection: 'draft-posts',
          id: 1,
          data: { title: 'Test' },
          action: 'unpublish',
        })
      })

      test('should reject draft-only duplicate actions on non-draft collections', () => {
        expect(payload.duplicate).type.not.toBeCallableWith({
          collection: 'pages',
          id: 1,
          action: 'saveDraft',
        })
        expect(payload.duplicate).type.toBeCallableWith({
          collection: 'pages',
          id: 1,
        })
        expect(payload.duplicate).type.toBeCallableWith({
          collection: 'draft-posts',
          id: 1,
          action: 'saveDraft',
        })
      })

      test('should reject version in global findOne on non-draft globals', () => {
        expect(payload.findGlobal).type.not.toBeCallableWith({ slug: 'menu', version: 'latest' })
        expect(payload.findGlobal).type.toBeCallableWith({ slug: 'menu' })
        expect(payload.findGlobal).type.toBeCallableWith({ slug: 'settings', version: 'latest' })
      })

      test('should reject draft-only global update actions on non-draft globals', () => {
        expect(payload.updateGlobal).type.not.toBeCallableWith({
          slug: 'menu',
          data: {},
          action: 'saveDraft',
        })
        expect(payload.updateGlobal).type.not.toBeCallableWith({
          slug: 'menu',
          data: {},
          action: 'unpublish',
        })
        expect(payload.updateGlobal).type.toBeCallableWith({
          slug: 'settings',
          data: {},
          action: 'saveDraft',
        })
      })

      test('should allow saveDraft and publish but reject unpublish for restoreVersion', () => {
        expect(payload.restoreVersion).type.toBeCallableWith({
          collection: 'draft-posts',
          id: 'id',
        })
        expect(payload.restoreVersion).type.toBeCallableWith({
          collection: 'draft-posts',
          id: 'id',
          action: 'publish',
        })
        expect(payload.restoreVersion).type.toBeCallableWith({
          collection: 'draft-posts',
          id: 'id',
          action: 'saveDraft',
        })
        expect(payload.restoreVersion).type.not.toBeCallableWith({
          collection: 'draft-posts',
          id: 'id',
          action: 'unpublish',
        })
        expect(payload.restoreVersion).type.not.toBeCallableWith({
          collection: 'draft-posts',
          id: 'id',
          draft: true,
        })
        expect(payload.restoreVersion).type.not.toBeCallableWith({
          collection: 'pages',
          id: 'id',
          action: 'saveDraft',
        })
        expect(payload.restoreVersion).type.toBeCallableWith({
          collection: 'pages',
          id: 'id',
          action: 'publish',
        })
      })

      test('should allow saveDraft and publish but reject unpublish for restoreGlobalVersion', () => {
        expect(payload.restoreGlobalVersion).type.toBeCallableWith({
          slug: 'settings',
          id: 'id',
        })
        expect(payload.restoreGlobalVersion).type.toBeCallableWith({
          slug: 'settings',
          id: 'id',
          action: 'publish',
        })
        expect(payload.restoreGlobalVersion).type.toBeCallableWith({
          slug: 'settings',
          id: 'id',
          action: 'saveDraft',
        })
        expect(payload.restoreGlobalVersion).type.not.toBeCallableWith({
          slug: 'settings',
          id: 'id',
          action: 'unpublish',
        })
        expect(payload.restoreGlobalVersion).type.not.toBeCallableWith({
          slug: 'settings',
          id: 'id',
          draft: true,
        })
        expect(payload.restoreGlobalVersion).type.not.toBeCallableWith({
          slug: 'menu',
          id: 'id',
          action: 'saveDraft',
        })
        expect(payload.restoreGlobalVersion).type.toBeCallableWith({
          slug: 'menu',
          id: 'id',
          action: 'publish',
        })
      })

      test('should reject draft, action, and version for delete', () => {
        expect(payload.delete).type.not.toBeCallableWith({
          collection: 'draft-posts',
          id: 1,
          draft: true,
        })
        expect(payload.delete).type.not.toBeCallableWith({
          collection: 'draft-posts',
          id: 1,
          action: 'saveDraft',
        })
        expect(payload.delete).type.not.toBeCallableWith({
          collection: 'draft-posts',
          id: 1,
          version: 'latest',
        })
        expect(payload.delete).type.not.toBeCallableWith({
          collection: 'draft-posts',
          where: {},
          draft: true,
        })
        expect(payload.delete).type.not.toBeCallableWith({
          collection: 'draft-posts',
          where: {},
          action: 'publish',
        })
        expect(payload.delete).type.not.toBeCallableWith({
          collection: 'draft-posts',
          where: {},
          version: 'draft',
        })
      })

      test('should reject draft, action, and version for findVersions', () => {
        expect(payload.findVersions).type.not.toBeCallableWith({
          collection: 'draft-posts',
          draft: true,
        })
        expect(payload.findVersions).type.not.toBeCallableWith({
          collection: 'draft-posts',
          action: 'saveDraft',
        })
        expect(payload.findVersions).type.not.toBeCallableWith({
          collection: 'draft-posts',
          version: 'latest',
        })
      })

      test('should reject draft, action, and version for findVersionByID', () => {
        expect(payload.findVersionByID).type.not.toBeCallableWith({
          collection: 'draft-posts',
          id: 'id',
          draft: true,
        })
        expect(payload.findVersionByID).type.not.toBeCallableWith({
          collection: 'draft-posts',
          id: 'id',
          action: 'publish',
        })
        expect(payload.findVersionByID).type.not.toBeCallableWith({
          collection: 'draft-posts',
          id: 'id',
          version: 'published',
        })
      })

      test('should reject draft, action, and version for findGlobalVersions', () => {
        expect(payload.findGlobalVersions).type.not.toBeCallableWith({
          slug: 'settings',
          draft: true,
        })
        expect(payload.findGlobalVersions).type.not.toBeCallableWith({
          slug: 'settings',
          action: 'saveDraft',
        })
        expect(payload.findGlobalVersions).type.not.toBeCallableWith({
          slug: 'settings',
          version: 'latest',
        })
      })

      test('should reject draft, action, and version for findGlobalVersionByID', () => {
        expect(payload.findGlobalVersionByID).type.not.toBeCallableWith({
          slug: 'settings',
          id: 'id',
          draft: true,
        })
        expect(payload.findGlobalVersionByID).type.not.toBeCallableWith({
          slug: 'settings',
          id: 'id',
          action: 'unpublish',
        })
        expect(payload.findGlobalVersionByID).type.not.toBeCallableWith({
          slug: 'settings',
          id: 'id',
          version: 'draft',
        })
      })

      test('should expose operation-appropriate actions to afterChange hooks', () => {
        type AfterChangeArgs = Parameters<CollectionAfterChangeHook>[0]
        type CreateAfterChangeAction = Extract<AfterChangeArgs, { operation: 'create' }>['action']
        type UpdateAfterChangeAction = Extract<AfterChangeArgs, { operation: 'update' }>['action']

        expect<CreateAfterChangeAction>().type.toBe<CreateAction | undefined>()
        expect<CreateAfterChangeAction>().type.not.toBeAssignableTo<'unpublish'>()
        expect<'unpublish'>().type.not.toBeAssignableTo<CreateAfterChangeAction>()
        expect<UpdateAfterChangeAction>().type.toBe<RestoreAction | undefined | UpdateAction>()
        expect<RestoreAction>().type.toBe<'publish' | 'saveDraft'>()
        expect<'unpublish'>().type.not.toBeAssignableTo<RestoreAction>()
        expect<Parameters<GlobalAfterChangeHook>[0]['action']>().type.toBe<
          RestoreAction | undefined | UpdateAction
        >()
        expect<Parameters<FieldHook>[0]['action']>().type.toBe<undefined | WriteAction>()
      })

      test('should not add action to non-afterChange hooks', () => {
        expect<Parameters<CollectionBeforeChangeHook>[0]>().type.not.toHaveProperty('action')
        expect<Parameters<CollectionAfterReadHook>[0]>().type.not.toHaveProperty('action')
        expect<Parameters<CollectionAfterOperationHook>[0]>().type.not.toHaveProperty('action')
        expect<Parameters<GlobalBeforeChangeHook>[0]>().type.not.toHaveProperty('action')
      })
    })
  })
})
