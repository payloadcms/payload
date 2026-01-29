import type {
  BulkOperationResult,
  CollectionSlug,
  CustomDocumentViewConfig,
  DefaultDocumentViewConfig,
  GeneratedTypes,
  JoinQuery,
  JsonObject,
  PaginatedDocs,
  PayloadTypesShape,
  SelectType,
  TypedCollectionSelect,
  TypeWithID,
  TypeWithVersion,
  Where,
} from 'payload'

import {
  buildEditorState,
  type DefaultNodeTypes,
  type DefaultTypedEditorState,
  type RecursiveNodes,
  type SerializedBlockNode,
  type SerializedHeadingNode,
  type SerializedTextNode,
  type TypedEditorState,
} from '@payloadcms/richtext-lexical'
import { PayloadSDK } from '@payloadcms/sdk'
import payload from 'payload'
import { describe, expect, test } from 'tstyche'

import type {
  Config as LocalConfig,
  Menu,
  MyRadioOptions,
  MySelectOptions,
  Post,
  SupportedTimezones,
  User,
} from './payload-types.js'

const asType = <T>() => {
  return '' as T
}

describe('Types testing', () => {
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
      expect(asType<JoinQuery<'pages'>>()).type.toBe<never>()
    })

    test('join query for pages-categories should be defined with the relatedPages key', () => {
      expect(asType<JoinQuery<'pages-categories'>>()).type.toBeAssignableWith<{
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

    test('payload operations return users with collection property', async () => {
      const user = await payload.findByID({ id: 'id', collection: 'users' })
      expect<typeof user>().type.toHaveProperty('collection')
      expect<(typeof user)['collection']>().type.toBe<'users'>()
    })

    test('collection property is not required in update data for auth collections', () => {
      // The collection property should not be required when updating users
      // It is auto-populated by the system
      expect(
        payload.update({
          id: 'id',
          collection: 'users',
          data: {
            email: 'test@example.com',
          },
        }),
      ).type.not.toRaiseError()
    })

    test('has global generated options interface based on select field', () => {
      expect(asType<Post['selectField']>()).type.toBe<MySelectOptions>()
    })

    test('has global generated options interface based on radio field', () => {
      expect(asType<Post['radioField']>()).type.toBe<MyRadioOptions>()
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
    expect<Select<GeneratedTypes, 'users'>>().type.not.toBeNever()
  })

  test('TypedCollectionSelect resolves correctly with concrete types', () => {
    type SelectUsers = TypedCollectionSelect<GeneratedTypes>['users']
    expect<SelectUsers>().type.not.toBeNever()

    // Test with Config - should also work
    type SelectPosts = TypedCollectionSelect<LocalConfig>['posts']
    expect<SelectPosts>().type.not.toBeNever()
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
      expect<DefaultDocumentViewConfig>().type.not.toBeAssignableWith<{
        path: `/${string}`
      }>()

      expect<CustomDocumentViewConfig>().type.toBeAssignableWith<{
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

    test('ensure generated richText types can be assigned to DefaultTypedEditorState type', () => {
      // If there is a function that expects DefaultTypedEditorState, you should be able to assign the generated type to it
      // This ensures that data can be passed directly form the payload local API to a function that expects DefaultTypedEditorState
      type GeneratedRichTextType = Post['richText']

      expect<DefaultTypedEditorState>().type.toBeAssignableWith<GeneratedRichTextType>()
    })

    test('ensure DefaultTypedEditorState type can be assigned to GeneratedRichTextType type', () => {
      /**
       * Example:
       *
       * const mySeedData: RequiredDataFromCollectionSlug<'posts'> = {
       *   title: 'hello',
       *   richText: buildEditorState<DefaultNodeTypes>({text: 'hello'}) // <= DefaultTypedEditorState
       * }
       */
      type GeneratedRichTextType = Post['richText']

      expect<GeneratedRichTextType>().type.toBeAssignableWith<DefaultTypedEditorState>()
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
        type ChildrenType = NonNullable<(typeof headingNode)['children']>[number]['type']
        expect<ChildrenType>().type.toBe<_Hardcoded_DefaultNodeTypes>()
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
      // This test verifies that RecursiveNodes doesn't add children to leaf nodes
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
      const headingNode: SerializedHeadingNode<RecursiveNodes<DefaultNodeTypes>> = {
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
          } as SerializedTextNode,
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
      const headingNode: SerializedHeadingNode<RecursiveNodes<DefaultNodeTypes>> = {
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
          } as SerializedTextNode,
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
          } as SerializedTextNode,
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
        const _result = buildEditorState<DefaultNodeTypes>({ text: 'hello' })
        type NodeType = (typeof _result)['root']['children'][number]['type']
        expect<NodeType>().type.toBe<_Hardcoded_DefaultNodeTypes>()
      })

      test('buildEditorState with explicit generic includes custom node types in children', () => {
        const _result = buildEditorState<DefaultNodeTypes | SerializedBlockNode>({ text: 'hello' })
        type NodeType = (typeof _result)['root']['children'][number]['type']
        expect<NodeType>().type.toBe<'block' | _Hardcoded_DefaultNodeTypes>()
      })

      test('buildEditorState result can be assigned to Post richText field', () => {
        const _result = buildEditorState<DefaultNodeTypes>({ text: 'hello' })
        type GeneratedRichTextType = Post['richText']
        expect<GeneratedRichTextType>().type.toBeAssignableWith<typeof _result>()
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
        expect(
          buildEditorState<DefaultNodeTypes>({
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
          }),
        ).type.toRaiseError()
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
        expect(
          buildEditorState<DefaultNodeTypes>({
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
          }),
        ).type.toRaiseError()
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
        const _result = buildEditorState<DefaultNodeTypes>({
          nodes: [
            {
              type: 'text',
              version: 1,
              // Missing many properties
            } as any, // Using 'as any' to bypass the error for testing purposes
          ],
        })
        type ResultType = typeof _result
        expect<ResultType>().type.toBe<DefaultTypedEditorState>()
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
        expect(
          buildEditorState<DefaultNodeTypes>({
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
          }),
        ).type.toRaiseError()
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
            } as SerializedTextNode,
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
  })

  describe('sdk', () => {
    test('ensure generated types can be manually assigned to PayloadSDK generic', () => {
      expect(new PayloadSDK<LocalConfig>({ baseURL: '' })).type.not.toRaiseError()
    })

    test('ensure SDK without generic automatically uses GeneratedTypes', () => {
      const _sdk = new PayloadSDK({ baseURL: '' })
      expect<Parameters<typeof _sdk.create>[0]['collection']>().type.toBe<
        | 'draft-posts'
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

    test('ensure SDK with explicit generic uses has correct collection types', () => {
      const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })
      // ensure collection property of sdk.create has posts in the union type
      expect<Parameters<typeof _sdk.create>[0]['collection']>().type.toBe<
        | 'draft-posts'
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
            root: { type: '', children: [], direction: null, format: '', indent: 0, version: 0 },
          },
          selectField: 'option-1',
          title: 'Test Post',
        },
      })
      expect(result).type.toBe<LocalConfig['collections']['posts']>()
    })

    test('SDK create data should be typed and reject invalid properties', () => {
      const _sdk = new PayloadSDK<LocalConfig>({ baseURL: '' })
      expect(
        _sdk.create({
          collection: 'posts',
          data: {
            invalidProperty: 'should error',
            radioField: 'option-1',
            richText: {
              root: { type: '', children: [], direction: null, format: '', indent: 0, version: 0 },
            },
            selectField: 'option-1',
            title: 'Test Post',
          },
        }),
      ).type.toRaiseError()
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
  })

  describe('strictDraftTypes flag', () => {
    test('draft find query returns optional required fields when flag is enabled', async () => {
      const result = await payload.find({
        collection: 'draft-posts',
        draft: true,
      })

      const doc = result.docs[0]!

      // With strictDraftTypes enabled, user-defined required fields should be optional in draft queries
      expect(doc.description).type.toBe<string | undefined>()
      expect(doc.title).type.toBe<string | undefined>()

      // Only id is required in draft queries - other system fields are also optional
      expect(doc.id).type.not.toBe<undefined>()
      expect(doc.createdAt).type.toBe<string | undefined>()
      expect(doc.updatedAt).type.toBe<string | undefined>()
    })

    test('non-draft find query returns required fields as required', async () => {
      const result = await payload.find({
        collection: 'draft-posts',
      })

      const doc = result.docs[0]!

      // Without draft mode, required fields should remain required
      expect(doc.description).type.toBe<string>()
      expect(doc.title).type.toBe<string>()

      // System fields should also be present and required (not undefined)
      expect(doc.id).type.not.toBe<undefined>()
      expect(doc.createdAt).type.toBe<string>()
      expect(doc.updatedAt).type.toBe<string>()
    })
  })
})
