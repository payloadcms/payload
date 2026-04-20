import type {
  AdminViewConfig,
  AdminViewServerProps,
  PayloadComponent,
  SanitizedCollectionConfig,
} from 'payload'

import type { ViewFromConfig } from './getRouteData.js'

import { isPathMatchingRoute } from './isPathMatchingRoute.js'

type ViewScore = {
  dynamicSegmentCount: number
  exact: boolean
  matchedLength: number
}

export const getCustomCollectionViewByRoute = ({
  adminRoute,
  baseRoute,
  currentRoute: currentRouteWithAdmin,
  views,
}: {
  adminRoute: string
  baseRoute: string
  currentRoute: string
  views: SanitizedCollectionConfig['admin']['components']['views']
}): {
  view: ViewFromConfig
  viewKey: null | string
} => {
  const currentRoute =
    adminRoute === '/'
      ? currentRouteWithAdmin
      : currentRouteWithAdmin.startsWith(adminRoute)
        ? currentRouteWithAdmin.slice(adminRoute.length)
        : currentRouteWithAdmin

  let bestKey: null | string = null
  let bestView: AdminViewConfig | null = null
  let bestScore: null | ViewScore = null

  if (views && typeof views === 'object') {
    for (const [key, view] of Object.entries(views)) {
      // Skip the known collection view types: edit and list
      if (key === 'edit' || key === 'list') {
        continue
      }

      // Type guard: custom views should be AdminViewConfig with path and Component
      const isAdminViewConfig =
        typeof view === 'object' &&
        view !== null &&
        'path' in view &&
        'Component' in view &&
        typeof view.path === 'string'

      if (!isAdminViewConfig) {
        continue
      }

      const adminView = view as AdminViewConfig
      const viewPath = `${baseRoute}${adminView.path}`

      const match = isPathMatchingRoute({
        currentRoute,
        exact: adminView.exact,
        path: viewPath,
        sensitive: adminView.sensitive,
        strict: adminView.strict,
      })

      if (!match) {
        continue
      }

      const candidateScore: ViewScore = {
        dynamicSegmentCount: match.dynamicSegmentCount,
        exact: Boolean(adminView.exact),
        matchedLength: match.matchedLength,
      }

      if (isMoreSpecific(candidateScore, bestScore)) {
        bestKey = key
        bestView = adminView
        bestScore = candidateScore
      }
    }
  }

  if (bestView) {
    return {
      view: {
        payloadComponent: bestView.Component as PayloadComponent<AdminViewServerProps>,
      },
      viewKey: bestKey,
    }
  }

  return {
    view: {
      Component: null,
    },
    viewKey: null,
  }
}

const isMoreSpecific = (candidate: ViewScore, best: null | ViewScore): boolean => {
  if (!best) {
    return true
  }

  if (candidate.matchedLength !== best.matchedLength) {
    return candidate.matchedLength > best.matchedLength
  }

  if (candidate.exact !== best.exact) {
    return candidate.exact
  }

  if (candidate.dynamicSegmentCount !== best.dynamicSegmentCount) {
    return candidate.dynamicSegmentCount < best.dynamicSegmentCount
  }

  return false
}
