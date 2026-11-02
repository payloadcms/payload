import type { CollectionPreferences, ListQuery } from 'payload'

import { describe, expect, it } from 'vitest'

import {
  getListLayoutQuery,
  getSavedListLayoutQuery,
  resolveListLayoutQuery,
} from './listLayoutPreferences.js'

describe('independent list layout queries', () => {
  it('should isolate Tree from legacy Table preferences and omit shared columns', () => {
    const preferences: CollectionPreferences = {
      columns: [{ accessor: 'title', active: true }],
      groupBy: 'category',
      limit: 25,
      preset: 4,
      sort: '-title',
    }

    expect(getSavedListLayoutQuery({ preferences, layout: 'tree' })).toEqual({})
    expect(getSavedListLayoutQuery({ preferences, layout: 'table' })).toEqual({
      groupBy: 'category',
      limit: 25,
      preset: 4,
      sort: '-title',
    })
  })

  it('should honor an intentionally empty saved scope without falling back to legacy state', () => {
    expect(
      getSavedListLayoutQuery({
        preferences: { limit: 25, sort: '-title', layoutQueries: { table: {} } },
        layout: 'table',
      }),
    ).toEqual({})
  })

  it('should create a normalized snapshot without columns, layout markers, unknown keys or undefined values', () => {
    const query = {
      columns: ['title'],
      groupBy: '',
      limit: '20',
      listLayout: 'tree',
      page: '2.9',
      preset: '',
      queryByGroup: {},
      search: ' ',
      sort: '-title',
      treeExpanded: ['a', 'b', 'a', ''],
      unknown: 'retained only in the URL',
      where: {},
    } as unknown as ListQuery

    expect(getListLayoutQuery({ query })).toEqual({
      limit: 20,
      page: 2,
      sort: '-title',
      treeExpanded: ['a', 'b'],
    })
    expect(getListLayoutQuery({ query: { treeExpanded: 'a' } as unknown as ListQuery })).toEqual({
      treeExpanded: ['a'],
    })
    expect(getListLayoutQuery({ query: { preset: 0, treeExpanded: [] } })).toEqual({
      preset: 0,
      treeExpanded: [],
    })
  })

  it.each([0, -2, Infinity, NaN, '', 'bad', 'Infinity', '0.4'])(
    'should discard invalid pagination value %s',
    (value) => {
      expect(
        getListLayoutQuery({ query: { limit: value, page: value } as unknown as ListQuery }),
      ).toEqual({})
    },
  )

  it('should restore missing URL fields from the destination scope when its marker is absent', () => {
    const result = resolveListLayoutQuery({
      query: { columns: ['title'], custom: 'keep' },
      preferences: {
        layoutQueries: {
          tree: { limit: 15, page: 3, search: 'docs', sort: '-title', treeExpanded: ['parent'] },
        },
      },
      layout: 'tree',
      defaultLimit: 10,
      defaultSort: 'title',
    })

    expect(result).toEqual({
      columns: ['title'],
      custom: 'keep',
      limit: 15,
      listLayout: 'tree',
      page: 3,
      search: 'docs',
      sort: '-title',
      treeExpanded: ['parent'],
    })
  })

  it('should overlay explicit URL fields and explicit clears on restored preferences', () => {
    const result = resolveListLayoutQuery({
      query: {
        limit: '30',
        page: '2',
        search: '',
        groupBy: '',
        preset: '',
        where: {},
        treeExpanded: [],
      } as unknown as ListQuery,
      preferences: {
        layoutQueries: {
          tree: {
            limit: 15,
            search: 'saved',
            groupBy: 'category',
            preset: 4,
            where: { title: { equals: 'saved' } },
            treeExpanded: ['saved'],
          },
        },
      },
      layout: 'tree',
      defaultLimit: 10,
      defaultSort: 'title',
    })

    expect(result).toEqual({
      limit: 30,
      listLayout: 'tree',
      page: 2,
      sort: 'title',
      treeExpanded: [],
    })
  })

  it('should treat absent fields as cleared once the URL belongs to this layout', () => {
    const result = resolveListLayoutQuery({
      query: { listLayout: 'tree', columns: ['title'], custom: 'keep' },
      preferences: {
        layoutQueries: {
          tree: {
            limit: 15,
            page: 3,
            search: 'saved',
            groupBy: 'category',
            preset: 4,
            sort: '-title',
            treeExpanded: ['saved'],
            where: { title: { equals: 'saved' } },
          },
        },
      },
      layout: 'tree',
      defaultLimit: 10,
      defaultSort: 'title',
    })

    expect(result).toEqual({
      columns: ['title'],
      custom: 'keep',
      limit: 10,
      listLayout: 'tree',
      page: 1,
      sort: 'title',
    })
  })

  it('should strip expansion from Table while preserving shared columns and multi-field sorting', () => {
    const result = resolveListLayoutQuery({
      query: { treeExpanded: ['a'], columns: ['title'] },
      preferences: {
        layoutQueries: { table: { treeExpanded: ['b'], sort: ['title', '-updatedAt'] } },
      },
      layout: 'table',
      defaultLimit: 10,
    })

    expect(result).toEqual({
      columns: ['title'],
      limit: 10,
      listLayout: 'table',
      page: 1,
      sort: ['title', '-updatedAt'],
    })
  })

  it('should normalize grouped queries without retaining their columns or unknown keys', () => {
    expect(
      getListLayoutQuery({
        query: {
          queryByGroup: {
            category: { page: '2', columns: ['title'], custom: 'omit' } as unknown as ListQuery,
          },
        },
      }),
    ).toEqual({ queryByGroup: { category: { page: 2 } } })
  })

  it('should use pagination defaults for explicit invalid URL values without reviving saved values', () => {
    expect(
      resolveListLayoutQuery({
        query: { limit: -1, page: Infinity },
        preferences: { layoutQueries: { tree: { limit: 25, page: 3 } } },
        layout: 'tree',
        defaultLimit: 10,
      }),
    ).toEqual({ limit: 10, listLayout: 'tree', page: 1 })
  })
})
