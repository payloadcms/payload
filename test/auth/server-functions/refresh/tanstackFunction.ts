import { createServerFn } from '@tanstack/react-start'

import { refreshTestCookieName } from '../../shared.js'

const refreshServerFunction = createServerFn({ method: 'POST' }).handler(async () => {
  const [{ refresh, tanstackServerAdapter }, { default: config }] = await Promise.all([
    import('@payloadcms/tanstack-start/server'),
    import('../../config.js'),
  ])

  const result = await refresh({ config })

  await tanstackServerAdapter.setCookie(refreshTestCookieName, 'refreshed', { path: '/' })

  return result
})

export async function refreshFunction() {
  return refreshServerFunction()
}
