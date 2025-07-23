'use client'
import { useListDrawer, useListDrawerContext } from '@payloadcms/ui'
import React, { useCallback } from 'react'

export const CustomListDrawer = () => {
  const [isCreating, setIsCreating] = React.useState(false)
  const [success, setSuccess] = React.useState(false)

  // this is the _outer_ drawer context (if any), not the one for the list drawer below
  const { refresh } = useListDrawerContext()

  const [ListDrawer, ListDrawerToggler] = useListDrawer({
    collectionSlugs: ['custom-list-drawer'],
  })

  const createDoc = useCallback(async () => {
    if (isCreating) {
      return
    }

    setSuccess(false)
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
      setSuccess(true)

      // In the root document view, there is no outer drawer context, so this will be `undefined`
      if (typeof refresh === 'function') {
        await refresh('custom-list-drawer')
      }
    } catch (_err) {
      console.error('Error creating document:', _err) // eslint-disable-line no-console
      setIsCreating(false)
      setSuccess(false)
    }
  }, [isCreating, refresh])

  return (
    <div>
      <button onClick={createDoc} type="button">
        {isCreating ? 'Creating...' : success ? 'Created!' : 'Create Document'}
      </button>
      <ListDrawer />
      <ListDrawerToggler>Open list drawer</ListDrawerToggler>
    </div>
  )
}
