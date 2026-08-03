import { createRouter } from '@tanstack/react-router'
import { payloadParseSearch, payloadStringifySearch } from '@payloadcms/tanstack-start/shared'

import { routeTree } from './routeTree.gen'

export function getRouter() {
  return createRouter({
    parseSearch: payloadParseSearch,
    routeTree,
    scrollRestoration: true,
    stringifySearch: payloadStringifySearch,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
