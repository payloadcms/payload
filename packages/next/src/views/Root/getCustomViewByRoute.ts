import type {
  AdminViewConfig,
  AdminViewServerProps,
  PayloadComponent,
  SanitizedConfig,
} from 'payload'

import type { ViewFromConfig } from './getRouteData.js'

import { isPathMatchingRoute } from './isPathMatchingRoute.js'

export const getCustomViewByRoute = ({
  config,
  currentRoute: currentRouteWithAdmin,
}: {
  config: SanitizedConfig
  currentRoute: string
}): {
  view: ViewFromConfig
  viewConfig: AdminViewConfig
  viewKey: string
} => {
  const {
    admin: {
      components: { views },
    },
    routes: { admin: adminRoute },
  } = config

  const currentRoute =
    adminRoute === '/' ? currentRouteWithAdmin : currentRouteWithAdmin.replace(adminRoute, '')

  let bestKey: null | string = null
  let bestConfig: AdminViewConfig | null = null
  let bestScore: {
    dynamicSegmentCount: number
    exact: boolean
    matchedLength: number
  } | null = null

  if (views && typeof views === 'object') {
    for (const [key, view] of Object.entries(views)) {
      const match = isPathMatchingRoute({
        currentRoute,
        exact: view.exact,
        path: view.path,
        sensitive: view.sensitive,
        strict: view.strict,
      })

      if (!match) {
        continue
      }

      const candidateScore = {
        dynamicSegmentCount: match.dynamicSegmentCount,
        exact: Boolean(view.exact),
        matchedLength: match.matchedLength,
      }

      if (isMoreSpecific(candidateScore, bestScore)) {
        bestKey = key
        bestConfig = view
        bestScore = candidateScore
      }
    }
  }

  if (!bestConfig) {
    return {
      view: {
        Component: null,
      },
      viewConfig: null,
      viewKey: null,
    }
  }

  return {
    view: {
      payloadComponent: bestConfig.Component as PayloadComponent<AdminViewServerProps>,
    },
    viewConfig: bestConfig,
    viewKey: bestKey,
  }
}

const isMoreSpecific = (
  candidate: { dynamicSegmentCount: number; exact: boolean; matchedLength: number },
  best: { dynamicSegmentCount: number; exact: boolean; matchedLength: number } | null,
): boolean => {
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
