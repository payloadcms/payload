'use client'

import { RootProvider } from '@payloadcms/ui'
import { useRouter } from '@tanstack/react-router'
import React from 'react'

type TanStackInvalidateResult = {
  __tanstack_invalidate?: boolean
}

type TanStackRootProviderProps = React.ComponentProps<typeof RootProvider>

export const TanStackRootProvider: React.FC<TanStackRootProviderProps> = ({
  serverFunction,
  ...props
}) => {
  const router = useRouter()

  const wrappedServerFunction = React.useCallback<
    React.ComponentProps<typeof RootProvider>['serverFunction']
  >(
    async (args) => {
      const result = (await serverFunction(args)) as TanStackInvalidateResult

      if (result?.__tanstack_invalidate === true) {
        await router.invalidate()
        return null
      }

      return result
    },
    [router, serverFunction],
  )

  return <RootProvider {...props} serverFunction={wrappedServerFunction} />
}
