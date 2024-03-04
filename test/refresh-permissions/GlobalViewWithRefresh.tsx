import React, { useCallback } from 'react'

import type { EditViewProps as Props } from '../../packages/payload/src/admin/views/types'

import { EditView as DefaultEditView } from '../../packages/next/src/views/Edit'
import { useAuth } from '../../packages/ui/src/providers/Auth'

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
