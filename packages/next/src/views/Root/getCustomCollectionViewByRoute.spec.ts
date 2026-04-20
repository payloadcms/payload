import type { AdminViewConfig, SanitizedCollectionConfig } from 'payload'

import { describe, expect, it } from 'vitest'

import { getCustomCollectionViewByRoute } from './getCustomCollectionViewByRoute.js'

type Views = SanitizedCollectionConfig['admin']['components']['views']

const gridView: Views = {
  grid: {
    Component: '/components/views/GridView/index.js#GridView',
    exact: true,
    path: '/grid',
  },
}

const gridViewPrefixMatch: Views = {
  grid: {
    Component: '/components/views/GridView/index.js#GridView',
    exact: false,
    path: '/grid',
  },
}

describe('getCustomCollectionViewByRoute', () => {
  describe('route matching with default /admin prefix', () => {
    it('should match a custom view at the correct path', () => {
      const result = getCustomCollectionViewByRoute({
        adminRoute: '/admin',
        baseRoute: '/collections/my-collection',
        currentRoute: '/admin/collections/my-collection/grid',
        views: gridView,
      })

      expect(result.viewKey).toBe('grid')
      expect(result.view.payloadComponent).toBeDefined()
    })

    it('should not match when the path segment does not correspond to any custom view', () => {
      const result = getCustomCollectionViewByRoute({
        adminRoute: '/admin',
        baseRoute: '/collections/my-collection',
        currentRoute: '/admin/collections/my-collection/abc123',
        views: gridView,
      })

      expect(result.viewKey).toBeNull()
      expect(result.view.payloadComponent).toBeUndefined()
    })
  })

  describe('route matching with custom adminRoute prefix', () => {
    it('should match when adminRoute is a non-default prefix', () => {
      const result = getCustomCollectionViewByRoute({
        adminRoute: '/cms',
        baseRoute: '/collections/my-collection',
        currentRoute: '/cms/collections/my-collection/grid',
        views: gridView,
      })

      expect(result.viewKey).toBe('grid')
      expect(result.view.payloadComponent).toBeDefined()
    })

    it('should match when adminRoute is /', () => {
      const result = getCustomCollectionViewByRoute({
        adminRoute: '/',
        baseRoute: '/collections/my-collection',
        currentRoute: '/collections/my-collection/grid',
        views: gridView,
      })

      expect(result.viewKey).toBe('grid')
      expect(result.view.payloadComponent).toBeDefined()
    })
  })

  describe('route matching with exact: false (prefix matching)', () => {
    it('should match a sub-path when exact is false', () => {
      const result = getCustomCollectionViewByRoute({
        adminRoute: '/admin',
        baseRoute: '/collections/my-collection',
        currentRoute: '/admin/collections/my-collection/grid/detail',
        views: gridViewPrefixMatch,
      })

      expect(result.viewKey).toBe('grid')
      expect(result.view.payloadComponent).toBeDefined()
    })

    it('should match the exact path when exact is false', () => {
      const result = getCustomCollectionViewByRoute({
        adminRoute: '/admin',
        baseRoute: '/collections/my-collection',
        currentRoute: '/admin/collections/my-collection/grid',
        views: gridViewPrefixMatch,
      })

      expect(result.viewKey).toBe('grid')
      expect(result.view.payloadComponent).toBeDefined()
    })

    it('should not match an unrelated path when exact is false', () => {
      const result = getCustomCollectionViewByRoute({
        adminRoute: '/admin',
        baseRoute: '/collections/my-collection',
        currentRoute: '/admin/collections/my-collection/map',
        views: gridViewPrefixMatch,
      })

      expect(result.viewKey).toBeNull()
      expect(result.view.payloadComponent).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should return no match when views is undefined', () => {
      const result = getCustomCollectionViewByRoute({
        adminRoute: '/admin',
        baseRoute: '/collections/my-collection',
        currentRoute: '/admin/collections/my-collection/grid',
        views: undefined,
      })

      expect(result.viewKey).toBeNull()
      expect(result.view.payloadComponent).toBeUndefined()
    })

    it('should not match built-in "edit" or "list" keys', () => {
      const viewsWithBuiltins: Views = {
        edit: {
          default: { Component: '/components/views/Edit/index.js#EditView' },
        },
        list: {
          Component: '/components/views/List/index.js#ListView',
        },
      }

      const result = getCustomCollectionViewByRoute({
        adminRoute: '/admin',
        baseRoute: '/collections/my-collection',
        currentRoute: '/admin/collections/my-collection/edit',
        views: viewsWithBuiltins,
      })

      expect(result.viewKey).toBeNull()
    })

    it('should not match a custom view that has no path defined', () => {
      const viewsWithNoPath: Views = {
        grid: {
          Component: '/components/views/GridView/index.js#GridView',
        } as unknown as AdminViewConfig,
      }

      const result = getCustomCollectionViewByRoute({
        adminRoute: '/admin',
        baseRoute: '/collections/my-collection',
        currentRoute: '/admin/collections/my-collection/grid',
        views: viewsWithNoPath,
      })

      expect(result.viewKey).toBeNull()
    })

    it('should match the correct view when multiple custom views are defined', () => {
      const multipleViews: Views = {
        grid: {
          Component: '/components/views/GridView/index.js#GridView',
          exact: true,
          path: '/grid',
        },
        map: {
          Component: '/components/views/MapView/index.js#MapView',
          exact: true,
          path: '/map',
        },
      }

      const gridResult = getCustomCollectionViewByRoute({
        adminRoute: '/admin',
        baseRoute: '/collections/my-collection',
        currentRoute: '/admin/collections/my-collection/grid',
        views: multipleViews,
      })

      expect(gridResult.viewKey).toBe('grid')

      const mapResult = getCustomCollectionViewByRoute({
        adminRoute: '/admin',
        baseRoute: '/collections/my-collection',
        currentRoute: '/admin/collections/my-collection/map',
        views: multipleViews,
      })

      expect(mapResult.viewKey).toBe('map')
    })
  })

  describe('shadowing regression — sibling paths without exact', () => {
    const siblingViews: Views = {
      ordersIndex: {
        Component: '/components/views/ListView/index.js#ListView',
        path: '/orders',
      },
      orderDetail: {
        Component: '/components/views/DetailView/index.js#DetailView',
        path: '/orders/:orderNumber',
      },
    }

    it('should resolve /orders to the index view', () => {
      const result = getCustomCollectionViewByRoute({
        adminRoute: '/admin',
        baseRoute: '/collections/my-collection',
        currentRoute: '/admin/collections/my-collection/orders',
        views: siblingViews,
      })

      expect(result.viewKey).toBe('ordersIndex')
    })

    it('should resolve /orders/123 to the detail view, not the index view', () => {
      const result = getCustomCollectionViewByRoute({
        adminRoute: '/admin',
        baseRoute: '/collections/my-collection',
        currentRoute: '/admin/collections/my-collection/orders/123',
        views: siblingViews,
      })

      expect(result.viewKey).toBe('orderDetail')
    })

    it('should resolve to the same views regardless of registration order', () => {
      const reversedViews: Views = {
        orderDetail: siblingViews.orderDetail,
        ordersIndex: siblingViews.ordersIndex,
      }

      const indexResult = getCustomCollectionViewByRoute({
        adminRoute: '/admin',
        baseRoute: '/collections/my-collection',
        currentRoute: '/admin/collections/my-collection/orders',
        views: reversedViews,
      })

      const detailResult = getCustomCollectionViewByRoute({
        adminRoute: '/admin',
        baseRoute: '/collections/my-collection',
        currentRoute: '/admin/collections/my-collection/orders/123',
        views: reversedViews,
      })

      expect(indexResult.viewKey).toBe('ordersIndex')
      expect(detailResult.viewKey).toBe('orderDetail')
    })

    it('should prefer an exact sibling over prefix matches at the same URL', () => {
      const viewsWithExactSibling: Views = {
        ordersIndex: {
          Component: '/components/views/ListView/index.js#ListView',
          path: '/orders',
        },
        orderDetail: {
          Component: '/components/views/DetailView/index.js#DetailView',
          path: '/orders/:orderNumber',
        },
        ordersBulk: {
          Component: '/components/views/BulkView/index.js#BulkView',
          exact: true,
          path: '/orders/bulk',
        },
      }

      const result = getCustomCollectionViewByRoute({
        adminRoute: '/admin',
        baseRoute: '/collections/my-collection',
        currentRoute: '/admin/collections/my-collection/orders/bulk',
        views: viewsWithExactSibling,
      })

      expect(result.viewKey).toBe('ordersBulk')
    })
  })
})
