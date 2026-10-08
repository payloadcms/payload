import type { ServerFunction } from 'payload'

export const multipleCookiesServerFunctionName = 'set-multiple-cookies'

const setMultipleCookies: ServerFunction = async ({ req }) => {
  if (!req.server) {
    throw new Error('Server adapter is not available')
  }

  await req.server.setCookie('first-cookie', 'first-value', { path: '/' })
  await req.server.setCookie('second-cookie', 'second-value', { path: '/' })
}

export const multipleCookiesServerFunctions = {
  [multipleCookiesServerFunctionName]: setMultipleCookies,
}
