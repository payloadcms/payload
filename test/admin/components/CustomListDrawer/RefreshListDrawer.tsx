'use client'
import { useListDrawerContext } from '@payloadcms/ui'
import React from 'react'

export const RefreshListDrawer = () => {
  const { refresh } = useListDrawerContext()

  return (
    <div>
      <button
        onClick={async () => {
          // At the root document view, there is no outer drawer context, so this will be `undefined`
          if (typeof refresh === 'function') {
            await refresh('custom-list-drawer')
          }
        }}
        type="button"
      >
        Refresh List Drawer
      </button>
    </div>
  )
}
