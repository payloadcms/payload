import { createServerFn } from '@tanstack/react-start'

import {
  multipleCookiesServerFunctionName,
  multipleCookiesServerFunctions,
} from './serverFunction.js'

const runSetMultipleCookies = createServerFn({ method: 'POST' }).handler(async () => {
  const [{ handleServerFunctions }, { default: config }] = await Promise.all([
    import('@payloadcms/tanstack-start/server'),
    import('../../config.js'),
  ])

  await handleServerFunctions({
    args: {},
    config,
    name: multipleCookiesServerFunctionName,
    importMap: {},
    serverFunctions: multipleCookiesServerFunctions,
  })

  return { success: true }
})

export async function setMultipleCookiesFunction() {
  return runSetMultipleCookies()
}
