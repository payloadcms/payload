import type {
  AllowedDepth,
  ApplyDepth,
  BulkOperationResult,
  DecrementDepth,
  DefaultDepth,
  PaginatedDocs,
  SelectType,
  TypeWithVersion,
} from 'payload'

import payload from 'payload'
import { describe, expect, test } from 'tstyche'

import type {
  Join,
  Menu,
  Post,
  Relationship,
  RelationshipsDeep,
  RelationshipsToJoin,
  User,
} from './payload-types.js'

/**
 * The real value doesn't matter
 */
const getType = <T>(): T => {
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

  test('DefaultDepth is based on config.defaultDepth', () => {
    expect(getType<DefaultDepth>()).type.toBe<0>()
  })

  test('AllowedDepth is based on config.maxDepth', () => {
    expect(getType<AllowedDepth>()).type.toBe<0 | 1 | 2 | 3 | 4 | 5>()
  })

  test('Decrements depth with DecrementDepth', () => {
    expect(getType<DecrementDepth<2>>()).type.toBe<1>()
  })

  interface RelationshipDepth0 extends Relationship {
    many: string[]
    manyOptional?: null | string[]
    manyPoly: (
      | {
          relationTo: 'posts'
          value: string
        }
      | {
          relationTo: 'users'
          value: string
        }
    )[]
    manyPolyOptional?:
      | (
          | {
              relationTo: 'posts'
              value: string
            }
          | {
              relationTo: 'users'
              value: string
            }
        )[]
      | null
    one: string
    oneOptional?: null | string
    onePoly:
      | {
          relationTo: 'posts'
          value: string
        }
      | {
          relationTo: 'users'
          value: string
        }
    onePolyOptional?:
      | ({
          relationTo: 'posts'
          value: string
        } | null)
      | ({
          relationTo: 'users'
          value: string
        } | null)
  }

  test('ApplyDepth with depth 0', () => {
    expect(getType<ApplyDepth<Relationship, 0>>()).type.toBe<RelationshipDepth0>()
  })

  interface RelationshipDeepDepth0 extends RelationshipsDeep {
    depthTwoOne: string
    group?: {
      array?:
        | {
            id?: null | string
            many: string[]
            one: string
          }[]
        | null
      blocks?:
        | (
            | {
                blockName?: null | string
                blockType: 'first'
                id?: null | string
                oneFirst: string
              }
            | {
                blockName?: null | string
                blockType: 'second'
                id?: null | string
                oneSecond: string
              }
          )[]
        | null
    }
  }

  test('ApplyDepth deep fields with depth 0', () => {
    expect(getType<ApplyDepth<RelationshipsDeep, 0>>()).type.toBe<RelationshipDeepDepth0>()
  })

  interface RelationshipDepth1 extends Relationship {
    many: Post[]
    manyOptional?: null | Post[]
    manyPoly: (
      | {
          relationTo: 'posts'
          value: Post
        }
      | {
          relationTo: 'users'
          value: User
        }
    )[]
    manyPolyOptional?:
      | (
          | {
              relationTo: 'posts'
              value: Post
            }
          | {
              relationTo: 'users'
              value: User
            }
        )[]
      | null
    one: Post
    oneOptional?: null | Post
    onePoly:
      | {
          relationTo: 'posts'
          value: Post
        }
      | {
          relationTo: 'users'
          value: User
        }
    onePolyOptional?:
      | ({
          relationTo: 'posts'
          value: Post
        } | null)
      | ({
          relationTo: 'users'
          value: User
        } | null)
  }

  test('ApplyDepth with depth 1', () => {
    expect(getType<ApplyDepth<Relationship, 1>>()).type.toBe<RelationshipDepth1>()
  })

  interface RelationshipDeepDepth1 extends RelationshipsDeep {
    depthTwoOne: ApplyDepth<Relationship, 0>
    group?: {
      array?:
        | {
            id?: null | string
            many: Post[]
            one: Post
          }[]
        | null
      blocks?:
        | (
            | {
                blockName?: null | string
                blockType: 'first'
                id?: null | string
                oneFirst: Post
              }
            | {
                blockName?: null | string
                blockType: 'second'
                id?: null | string
                oneSecond: Post
              }
          )[]
        | null
    }
  }

  test('ApplyDepth deep fields with depth 1, decrements depth of other collection that has relationship', () => {
    expect(getType<ApplyDepth<RelationshipsDeep, 1>>()).type.toBe<RelationshipDeepDepth1>()
  })

  interface RelationshipDeepDepth2 extends RelationshipsDeep {
    depthTwoOne: ApplyDepth<Relationship, 1>
    group?: {
      array?:
        | {
            id?: null | string
            many: Post[]
            one: Post
          }[]
        | null
      blocks?:
        | (
            | {
                blockName?: null | string
                blockType: 'first'
                id?: null | string
                oneFirst: Post
              }
            | {
                blockName?: null | string
                blockType: 'second'
                id?: null | string
                oneSecond: Post
              }
          )[]
        | null
    }
  }

  test('ApplyDepth deep fields with depth 2', () => {
    expect(getType<ApplyDepth<RelationshipsDeep, 2>>()).type.toBe<RelationshipDeepDepth2>()
  })

  test('payload.find respects default depth', () => {
    expect(payload.find({ collection: 'relationships' })).type.toBe<
      Promise<PaginatedDocs<ApplyDepth<Relationship, 0>>>
    >()
  })

  interface JoinDepth0 extends Join {
    relatedRelations?: {
      docs?: null | string[]
      hasNextPage?: boolean | null
    } | null
  }

  test('ApplyDepth joins with depth 0', () => {
    expect(getType<ApplyDepth<Join, 0>>()).type.toBe<JoinDepth0>()
  })

  interface JoinDepth1 extends Join {
    relatedRelations?: {
      docs?: ApplyDepth<RelationshipsToJoin, 0>[] | null
      hasNextPage?: boolean | null
    } | null
  }

  test('ApplyDepth joins with depth 1', () => {
    expect(getType<ApplyDepth<Join, 1>>()).type.toBe<JoinDepth1>()
  })

  interface JoinDepth2 extends Join {
    relatedRelations?: {
      docs?: ApplyDepth<RelationshipsToJoin, 1>[] | null
      hasNextPage?: boolean | null
    } | null
  }

  test('ApplyDepth joins with depth 2', () => {
    expect(getType<ApplyDepth<Join, 2>>()).type.toBe<JoinDepth2>()
  })

  test('payload.find respects default depth', () => {
    expect(payload.find({ collection: 'relationships' })).type.toBe<
      Promise<PaginatedDocs<ApplyDepth<Relationship, 0>>>
    >()
  })

  test('payload.find respects depth', () => {
    expect(payload.find({ collection: 'relationships', depth: 2 })).type.toBe<
      Promise<PaginatedDocs<ApplyDepth<Relationship, 2>>>
    >()
  })

  test('payload.findByID respects depth', () => {
    expect(payload.findByID({ id: '', collection: 'relationships', depth: 2 })).type.toBe<
      Promise<ApplyDepth<Relationship, 2>>
    >()
  })

  test('payload.create respects depth', () => {
    expect(payload.create({ collection: 'relationships', data: {} as any, depth: 2 })).type.toBe<
      Promise<ApplyDepth<Relationship, 2>>
    >()
  })
})
