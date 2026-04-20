import type { SanitizedConfig } from 'payload'

import { describe, expect, it } from 'vitest'

import { getCustomViewByRoute } from './getCustomViewByRoute.js'

type Views = SanitizedConfig['admin']['components']['views']

const buildConfig = (views: Views, adminRoute = '/admin'): SanitizedConfig =>
  ({
    admin: {
      components: {
        views,
      },
    },
    routes: {
      admin: adminRoute,
    },
  }) as unknown as SanitizedConfig

describe('getCustomViewByRoute', () => {
  describe('route matching', () => {
    it('should match an exact custom view', () => {
      const config = buildConfig({
        dashboard: {
          Component: '/components/views/Dashboard/index.js#Dashboard',
          exact: true,
          path: '/dashboard',
        },
      })

      const result = getCustomViewByRoute({
        config,
        currentRoute: '/admin/dashboard',
      })

      expect(result.viewKey).toBe('dashboard')
    })

    it('should match when adminRoute is /', () => {
      const config = buildConfig(
        {
          dashboard: {
            Component: '/components/views/Dashboard/index.js#Dashboard',
            exact: true,
            path: '/dashboard',
          },
        },
        '/',
      )

      const result = getCustomViewByRoute({
        config,
        currentRoute: '/dashboard',
      })

      expect(result.viewKey).toBe('dashboard')
    })

    it('should not match when the route does not correspond to any custom view', () => {
      const config = buildConfig({
        dashboard: {
          Component: '/components/views/Dashboard/index.js#Dashboard',
          exact: true,
          path: '/dashboard',
        },
      })

      const result = getCustomViewByRoute({
        config,
        currentRoute: '/admin/other',
      })

      expect(result.viewKey).toBeNull()
    })
  })

  describe('shadowing regression — sibling paths without exact', () => {
    const siblingViews: Views = {
      regressionList: {
        Component: '/components/views/RegressionList/index.js#RegressionList',
        path: '/regression-repro',
      },
      regressionDetail: {
        Component: '/components/views/RegressionDetail/index.js#RegressionDetail',
        path: '/regression-repro/:id',
      },
    }

    it('should resolve /regression-repro to the list view', () => {
      const result = getCustomViewByRoute({
        config: buildConfig(siblingViews),
        currentRoute: '/admin/regression-repro',
      })

      expect(result.viewKey).toBe('regressionList')
    })

    it('should resolve /regression-repro/123 to the detail view, not the list view', () => {
      const result = getCustomViewByRoute({
        config: buildConfig(siblingViews),
        currentRoute: '/admin/regression-repro/123',
      })

      expect(result.viewKey).toBe('regressionDetail')
    })

    it('should resolve to the same views regardless of registration order', () => {
      const reversedViews: Views = {
        regressionDetail: siblingViews.regressionDetail,
        regressionList: siblingViews.regressionList,
      }

      const listResult = getCustomViewByRoute({
        config: buildConfig(reversedViews),
        currentRoute: '/admin/regression-repro',
      })

      const detailResult = getCustomViewByRoute({
        config: buildConfig(reversedViews),
        currentRoute: '/admin/regression-repro/123',
      })

      expect(listResult.viewKey).toBe('regressionList')
      expect(detailResult.viewKey).toBe('regressionDetail')
    })

    it('should prefer an exact sibling over prefix matches at the same URL', () => {
      const viewsWithExactSibling: Views = {
        regressionList: {
          Component: '/components/views/RegressionList/index.js#RegressionList',
          path: '/regression-repro',
        },
        regressionDetail: {
          Component: '/components/views/RegressionDetail/index.js#RegressionDetail',
          path: '/regression-repro/:id',
        },
        regressionBulk: {
          Component: '/components/views/RegressionBulk/index.js#RegressionBulk',
          exact: true,
          path: '/regression-repro/bulk',
        },
      }

      const result = getCustomViewByRoute({
        config: buildConfig(viewsWithExactSibling),
        currentRoute: '/admin/regression-repro/bulk',
      })

      expect(result.viewKey).toBe('regressionBulk')
    })
  })
})
