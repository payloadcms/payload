import type { ServerFunctionHandler } from 'payload'

import { dispatchServerFunction } from '@payloadcms/ui/utilities/handleServerFunctions'
import { notFound, redirect } from '@tanstack/react-router'

import { TANSTACK_INVALIDATE, tanstackDocumentStateHandler } from '../views/Root/serverFunctions.js'
import { initReq } from './initReq.js'

export const handleServerFunctions: ServerFunctionHandler = async (args) => {
  const { name: fnKey, args: fnArgs, config, importMap, serverFunctions } = args
  const invalidateArgs = fnArgs as { __tanstackInvalidate?: boolean } | undefined

  const { cookies, locale, permissions, req } = await initReq({
    config,
    importMap,
    key: 'RootLayout',
  })

  const augmentedArgs = {
    ...fnArgs,
    cookies,
    importMap,
    locale,
    notFound: () => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw notFound()
    },
    permissions,
    redirect: (url: string) => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: url })
    },
    req,
  }

  if (
    (fnKey === 'render-document' || fnKey === 'render-list') &&
    invalidateArgs?.__tanstackInvalidate === true
  ) {
    return TANSTACK_INVALIDATE
  }

  if (fnKey === 'tanstack-document-state') {
    return tanstackDocumentStateHandler(augmentedArgs as never)
  }

  return dispatchServerFunction({
    name: fnKey,
    augmentedArgs,
    extraServerFunctions: serverFunctions,
  })
}
