'use client'
import { toast, useListDrawer, useListDrawerContext, useTranslation } from '@payloadcms/ui'
import React, { useCallback } from 'react'

export const CustomListDrawer = () => {
  const [isCreating, setIsCreating] = React.useState(false)

  // this is the _outer_ drawer context (if any), not the one for the list drawer below
  const { refresh } = useListDrawerContext()
  const { t } = useTranslation()

  const [ListDrawer, ListDrawerToggler] = useListDrawer({
    collectionSlugs: ['custom-list-drawer'],
  })

  const createDoc = useCallback(async () => {
    if (isCreating) {
      return
    }

    setIsCreating(true)

    try {
      await fetch('/api/custom-list-drawer', {
        body: JSON.stringify({}),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      setIsCreating(false)

      toast.success(
        t('general:successfullyCreated', {
          label: 'Custom List Drawer',
        }),
      )

      // In the root document view, there is no outer drawer context, so this will be `undefined`
      if (typeof refresh === 'function') {
        await refresh()
      }
    } catch (_err) {
      console.error('Error creating document:', _err) // eslint-disable-line no-console
      setIsCreating(false)
    }
  }, [isCreating, refresh, t])

  return (
    <div>
      <button id="create-custom-list-drawer-doc" onClick={createDoc} type="button">
        {isCreating ? 'Creating...' : 'Create Document'}
      </button>
      <ListDrawer />
      <ListDrawerToggler id="open-custom-list-drawer">Open list drawer</ListDrawerToggler>
    </div>
  )
}
