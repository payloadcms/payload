import type { EditViewProps } from 'payload/types'

import { useAuth } from '@payloadcms/ui/providers/Auth'
import React, { useCallback } from 'react'

import { EditView as DefaultEditView } from '../../packages/next/src/views/Edit/index.js'

const GlobalView: React.FC<EditViewProps> = (props) => {
  const { onSave } = props
  const { refreshPermissions } = useAuth()
  const modifiedOnSave = useCallback(
    (...args) => {
      onSave.call(null, ...args)
      void refreshPermissions()
    },
    [onSave, refreshPermissions],
  )

  return <DefaultEditView {...props} onSave={modifiedOnSave} />
}

export default GlobalView
