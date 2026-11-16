import { describe, expect, it } from 'vitest'

import { getSearchWithListQuery } from './getSearchWithListQuery.js'

describe('getSearchWithListQuery', () => {
  it('should preserve route parameters while replacing list-owned parameters', () => {
    const search = getSearchWithListQuery({
      currentSearch: '?view=hierarchy&locale=fr&page=4&sort=title',
      query: {
        limit: 20,
        page: 2,
        sort: '-updatedAt',
      },
    })

    expect(search).toBe('?view=hierarchy&locale=fr&limit=20&page=2&sort=-updatedAt')
  })

  it('should remove stale list-owned parameters omitted from the resolved query', () => {
    const search = getSearchWithListQuery({
      currentSearch: '?view=all&groupBy=organization&page=3',
      query: {
        limit: 10,
      },
    })

    expect(search).toBe('?view=all&limit=10')
  })

  it('should update explicit custom refinements without replacing unrelated custom parameters', () => {
    const search = getSearchWithListQuery({
      currentSearch: '?view=all&tab=featured&scope=published',
      query: {
        scope: 'draft',
      },
      updatedQuery: {
        scope: 'draft',
      },
    })

    expect(search).toBe('?view=all&tab=featured&scope=draft')
  })

  it('should serialize structured list parameters for the URL', () => {
    const search = getSearchWithListQuery({
      currentSearch: '?view=all',
      query: {
        columns: ['title', 'updatedAt'],
        queryByGroup: {
          organization: {
            page: 2,
          },
        },
      },
    })

    expect(search).toBe(
      '?view=all&columns=%5B%22title%22%2C%22updatedAt%22%5D&queryByGroup=%7B%22organization%22%3A%7B%22page%22%3A2%7D%7D',
    )
  })

  it('should restore the layout marker and saved tree expansion on a clean URL', () => {
    const search = getSearchWithListQuery({
      currentSearch: '?locale=fr',
      query: { listLayout: 'tree', treeExpanded: ['parent'] },
    })

    expect(search).toBe('?locale=fr&listLayout=tree&treeExpanded%5B0%5D=parent')
  })

  it('should preserve the layout marker when refining a scoped list query', () => {
    const search = getSearchWithListQuery({
      currentSearch: '?listLayout=table&page=3',
      query: { listLayout: 'table', page: 1, search: 'article' },
      updatedQuery: { page: 1, search: 'article' },
    })

    expect(search).toBe('?listLayout=table&page=1&search=article')
  })

  it('should retain live tree expansion instead of a stale server query', () => {
    const search = getSearchWithListQuery({
      currentSearch: '?listLayout=tree&treeExpanded%5B0%5D=live',
      query: { listLayout: 'tree', search: 'article', treeExpanded: ['stale'] },
      updatedQuery: { search: 'article' },
    })

    expect(search).toBe('?listLayout=tree&search=article&treeExpanded%5B0%5D=live')
  })

  it('should retain live tree expansion when syncing a server query without a refinement', () => {
    const search = getSearchWithListQuery({
      currentSearch: '?treeExpanded%5B0%5D=live',
      query: { listLayout: 'tree', treeExpanded: ['stale'] },
    })

    expect(search).toBe('?listLayout=tree&treeExpanded%5B0%5D=live')
  })

  it('should clear tree expansion when explicitly updated', () => {
    const search = getSearchWithListQuery({
      currentSearch: '?listLayout=tree&treeExpanded%5B0%5D=live',
      query: { listLayout: 'tree', treeExpanded: undefined },
      updatedQuery: { treeExpanded: undefined },
    })

    expect(search).toBe('?listLayout=tree')
  })

  it('should replace live tree expansion when explicitly updated', () => {
    const search = getSearchWithListQuery({
      currentSearch: '?treeExpanded%5B0%5D=live',
      query: { listLayout: 'tree', treeExpanded: ['updated'] },
      updatedQuery: { treeExpanded: ['updated'] },
    })

    expect(search).toBe('?listLayout=tree&treeExpanded%5B0%5D=updated')
  })

  it('should strip tree expansion from a scoped table query', () => {
    const search = getSearchWithListQuery({
      currentSearch: '?listLayout=tree&treeExpanded%5B0%5D=live&tab=featured',
      query: { listLayout: 'table', treeExpanded: ['stale'] },
    })

    expect(search).toBe('?tab=featured&listLayout=table')
  })

  it('should preserve custom expansion parameters without a scoped layout', () => {
    const search = getSearchWithListQuery({
      currentSearch: '?treeExpanded%5B0%5D=live&tab=featured',
      query: { search: 'article', treeExpanded: ['stale'], tab: 'stale' },
    })

    expect(search).toBe('?treeExpanded%5B0%5D=live&tab=featured&search=article')
  })

  it('should update explicit expansion refinements without a scoped layout', () => {
    const search = getSearchWithListQuery({
      currentSearch: '?treeExpanded%5B0%5D=live&tab=featured',
      query: { treeExpanded: ['updated'] },
      updatedQuery: { treeExpanded: ['updated'] },
    })

    expect(search).toBe('?tab=featured&treeExpanded%5B0%5D=updated')
  })
})
