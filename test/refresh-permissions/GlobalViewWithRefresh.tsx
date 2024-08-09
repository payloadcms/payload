import React, { useCallback } from 'react'

import type { Props } from '../../packages/payload/src/admin/components/views/Global/types'

import { useAuth } from '../../packages/payload/src/admin/components/utilities/Auth'
import DefaultGlobalView from '../../packages/payload/src/admin/components/views/Global/Default'

const GlobalView = (props: Props) => {
  const { onSave } = props
  const { refreshPermissions } = useAuth()
  const modifiedOnSave = useCallback(
    (...args) => {
      onSave.call(null, ...args)
      refreshPermissions()
    },
    [onSave, refreshPermissions],
  )

  return <DefaultGlobalView {...props} onSave={modifiedOnSave} />
}

export default GlobalView
