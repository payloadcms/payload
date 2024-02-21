import React, { useCallback } from 'react'

import type { EditViewProps as Props } from '../../packages/ui/src'

import { useAuth } from '../../packages/ui/src/providers/Auth'
import { DefaultEditView } from '../../packages/ui/src/views/Edit'

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

  return <DefaultEditView {...props} onSave={modifiedOnSave} />
}

export default GlobalView
