import type {
  AllowedDepth,
  ApplyDepth,
  BulkOperationResult,
  DecrementDepth,
  DefaultDepth,
  PaginatedDistinctDocs,
  PaginatedDocs,
  SelectType,
  TypeWithVersion,
} from 'payload'

import payload from 'payload'
import { describe, expect, test } from 'tstyche'

import type {
  Category,
  Join,
  Media,
  Menu,
  Passthrough,
  Post,
  Relationship,
  RelationshipsDeep,
  RelationshipsToJoin,
  User,
} from './payload-types.js'

/**
 * The real value doesn't matter, this only exists to hand a type to `expect`.
 */
const getType = <T>(): T => {
  return '' as T
}

describe('typescript.typeSafeDepth', () => {
  test('DefaultDepth is based on config.defaultDepth', () => {
    expect(getType<DefaultDepth>()).type.toBe<0>()
  })

  test('AllowedDepth is based on config.maxDepth', () => {
    expect(getType<AllowedDepth>()).type.toBe<0 | 1 | 2 | 3 | 4 | 5>()
  })

  test('Decrements depth with DecrementDepth', () => {
    expect(getType<DecrementDepth<2>>()).type.toBe<1>()
  })

  test('rejects a depth above config.maxDepth', () => {
    expect(payload.find).type.not.toBeCallableWith({ collection: 'relationships', depth: 6 })
  })

  test('rejects a widened `number` depth, which has to be cast to AllowedDepth', () => {
    expect(payload.find).type.not.toBeCallableWith({
      collection: 'relationships',
      depth: getType<number>(),
    })

    expect(payload.find).type.toBeCallableWith({
      collection: 'relationships',
      depth: getType<number>() as AllowedDepth,
    })
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
      | {
          relationTo: 'users'
          value: string
        }
  }

  test('ApplyDepth with depth 0', () => {
    expect(getType<ApplyDepth<Relationship, 0>>()).type.toBe<RelationshipDepth0>()
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
      | {
          relationTo: 'users'
          value: User
        }
  }

  test('ApplyDepth with depth 1', () => {
    expect(getType<ApplyDepth<Relationship, 1>>()).type.toBe<RelationshipDepth1>()
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

  test('ApplyDepth deep fields with depth 1, decrements depth of the related collection', () => {
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

  interface JoinDepth0 extends Join {
    relatedRelations?: {
      docs?: string[]
      hasNextPage?: boolean
      totalDocs?: number
    }
  }

  test('ApplyDepth joins with depth 0', () => {
    expect(getType<ApplyDepth<Join, 0>>()).type.toBe<JoinDepth0>()
  })

  interface JoinDepth1 extends Join {
    relatedRelations?: {
      docs?: ApplyDepth<RelationshipsToJoin, 0>[]
      hasNextPage?: boolean
      totalDocs?: number
    }
  }

  test('ApplyDepth joins with depth 1', () => {
    expect(getType<ApplyDepth<Join, 1>>()).type.toBe<JoinDepth1>()
  })

  interface JoinDepth2 extends Join {
    relatedRelations?: {
      docs?: ApplyDepth<RelationshipsToJoin, 1>[]
      hasNextPage?: boolean
      totalDocs?: number
    }
  }

  test('ApplyDepth joins with depth 2', () => {
    expect(getType<ApplyDepth<Join, 2>>()).type.toBe<JoinDepth2>()
  })

  interface PassthroughDepth0 extends Passthrough {
    unnamedGroup: {
      insideUnnamedGroup: string
    }
    upload?: null | string
  }

  test('ApplyDepth leaves a json field alone and still resolves upload fields', () => {
    expect(getType<ApplyDepth<Passthrough, 0>>()).type.toBe<PassthroughDepth0>()
  })

  interface PassthroughDepth1 extends Passthrough {
    unnamedGroup: {
      insideUnnamedGroup: Post
    }
    upload?: Media | null
  }

  test('ApplyDepth resolves upload fields with depth 1', () => {
    expect(getType<ApplyDepth<Passthrough, 1>>()).type.toBe<PassthroughDepth1>()
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
    expect(
      payload.create({ collection: 'relationships', data: {} as Relationship, depth: 2 }),
    ).type.toBe<Promise<ApplyDepth<Relationship, 2>>>()
  })

  test('payload.update by ID respects depth', () => {
    expect(payload.update({ id: '', collection: 'relationships', data: {}, depth: 2 })).type.toBe<
      Promise<ApplyDepth<Relationship, 2>>
    >()
  })

  test('payload.delete by ID respects depth', () => {
    expect(payload.delete({ id: '', collection: 'relationships', depth: 2 })).type.toBe<
      Promise<ApplyDepth<Relationship, 2>>
    >()
  })

  test('payload.findGlobal respects depth', () => {
    expect(payload.findGlobal({ slug: 'menu', depth: 1 })).type.toBe<Promise<ApplyDepth<Menu, 1>>>()
  })

  test('payload.update by where respects depth', () => {
    expect(
      payload.update({ collection: 'relationships', data: {}, depth: 2, where: {} }),
    ).type.toBe<Promise<BulkOperationResult<'relationships', SelectType, 2>>>()
  })

  test('bulk operation docs are an array of depth-aware documents', () => {
    expect(getType<BulkOperationResult<'relationships', SelectType, 2>['docs']>()).type.toBe<
      ApplyDepth<Relationship, 2>[]
    >()
  })

  test('a self-referencing relationship terminates at the requested depth', () => {
    expect(getType<ApplyDepth<Category, 0>['parent']>()).type.toBe<null | string | undefined>()

    expect(getType<ApplyDepth<Category, 2>['parent']>()).type.toBe<
      ApplyDepth<Category, 1> | null | undefined
    >()

    expect(
      getType<NonNullable<NonNullable<ApplyDepth<Category, 2>['parent']>['parent']>['parent']>(),
    ).type.toBe<null | string | undefined>()
  })

  test('payload.findDistinct respects depth on a relationship field', () => {
    expect(payload.findDistinct({ collection: 'categories', depth: 0, field: 'parent' })).type.toBe<
      Promise<PaginatedDistinctDocs<Record<'parent', null | string | undefined>>>
    >()

    expect(payload.findDistinct({ collection: 'categories', depth: 1, field: 'parent' })).type.toBe<
      Promise<PaginatedDistinctDocs<Record<'parent', ApplyDepth<Category, 0> | null | undefined>>>
    >()
  })

  test('payload.findVersionByID respects depth', () => {
    expect(payload.findVersionByID({ id: '', collection: 'relationships', depth: 2 })).type.toBe<
      Promise<TypeWithVersion<ApplyDepth<Relationship, 2>>>
    >()
  })
})
