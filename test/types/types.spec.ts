import type {
  DefaultNodeTypes,
  DefaultTypedEditorState,
  TypedEditorState,
} from '@payloadcms/richtext-lexical'
import type {
  BulkOperationResult,
  CustomDocumentViewConfig,
  DefaultDocumentViewConfig,
  JoinQuery,
  PaginatedDocs,
  SelectType,
  TypeWithVersion,
  Where,
} from 'payload'

import payload from 'payload'
import { describe, expect, test } from 'tstyche'

import type {
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
    expect(payload.update({ where: {}, collection: 'users', data: {} })).type.toBe<
      Promise<BulkOperationResult<'users', SelectType>>
    >()
  })

  test('payload.delete by ID', () => {
    expect(payload.delete({ id: 1, collection: 'users' })).type.toBe<Promise<User>>()
  })

  test('payload.delete many', () => {
    expect(payload.delete({ where: {}, collection: 'users' })).type.toBe<
      Promise<BulkOperationResult<'users', SelectType>>
    >()
  })

  test('payload.findGlobal', () => {
    expect(payload.findGlobal({ slug: 'menu' })).type.toBe<Promise<Menu>>()
  })

  test('payload.updateGlobal', () => {
    expect(payload.updateGlobal({ data: {}, slug: 'menu' })).type.toBe<Promise<Menu>>()
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
      expect(payload.findByID({ collection: 'posts', id: 'id', select: {} })).type.toBe<
        Promise<{ id: Post['id'] }>
      >()
    })

    test('should include only title and ID', () => {
      expect(
        payload.findByID({ collection: 'posts', id: 'id', select: { title: true } }),
      ).type.toBe<Promise<{ id: Post['id']; title?: Post['title'] }>>()
    })

    test('should exclude title', () => {
      expect(
        payload.findByID({ collection: 'posts', id: 'id', select: { title: false } }),
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

    test('has global generated options interface based on select field', () => {
      expect(asType<Post['selectField']>()).type.toBe<MySelectOptions>()
    })

    test('has global generated options interface based on radio field', () => {
      expect(asType<Post['radioField']>()).type.toBe<MyRadioOptions>()
    })
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
  })
})
