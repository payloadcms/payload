import type { PayloadRequest } from '../types/index.js'

import { resolveBranch } from '../branching/resolveBranch.js'
import { MAIN_BRANCH } from '../branching/types.js'

export const appendBranchToFileURL = ({
  req,
  url,
}: {
  req: PayloadRequest
  url: null | string
}): null | string => {
  const branch = resolveBranch(req)

  if (!url || branch === MAIN_BRANCH) {
    return url
  }

  const serverURL = req.payload.config.serverURL
  const isRelativeURL = url.startsWith('/') && !url.startsWith('//')

  try {
    const parsedURL = new URL(url, serverURL || 'http://payload.local')

    if (!isRelativeURL) {
      if (!serverURL || parsedURL.origin !== new URL(serverURL).origin) {
        return url
      }
    }

    parsedURL.searchParams.set('branch', branch)

    return isRelativeURL
      ? `${parsedURL.pathname}${parsedURL.search}${parsedURL.hash}`
      : parsedURL.toString()
  } catch {
    return url
  }
}
