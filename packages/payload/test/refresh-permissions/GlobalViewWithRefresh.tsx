import React, { useCallback } from 'react'

import type { Props } from '../../src/admin/components/views/Global/types.js'

import { useAuth } from '../../src/admin/components/utilities/Auth/index.js'
import DefaultGlobalView from '../../src/admin/components/views/Global/Default.js'

const GlobalView: React.FC<Props> = (props) => {
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
