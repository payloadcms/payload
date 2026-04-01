import type { ServerFunctionHandler } from 'payload'

import { dispatchServerFunction } from '@payloadcms/ui/utilities/handleServerFunctions'
import { notFound, redirect } from 'next/navigation.js'

import { initReq } from './initReq.js'

export const handleServerFunctions: ServerFunctionHandler = async (args) => {
  const {
    name: fnKey,
    args: fnArgs,
    config: configPromise,
    importMap,
    serverFunctions: extraServerFunctions,
  } = args

  const { cookies, locale, permissions, req } = await initReq({
    configPromise,
    importMap,
    key: 'RootLayout',
  })

  const augmentedArgs = {
    ...fnArgs,
    cookies,
    importMap,
    locale,
    notFound: () => notFound(),
    permissions,
    redirect: (url: string) => redirect(url),
    req,
  }

  return dispatchServerFunction({
    name: fnKey,
    augmentedArgs,
    extraServerFunctions,
  })
}
