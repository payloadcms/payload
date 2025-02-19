// src/components/SelectPostsButton.tsx
'use client'
import { Button, type UseListDrawer, useListDrawer } from '@payloadcms/ui'
import { useMemo } from 'react'

type UseListDrawerArgs = Parameters<UseListDrawer>[0]

export const SelectPostsButton = () => {
  const listDrawerArgs = useMemo<UseListDrawerArgs>(
    () => ({
      collectionSlugs: ['with-list-drawer'],
    }),
    [],
  )
  const [ListDrawer, _, { toggleDrawer }] = useListDrawer(listDrawerArgs)

  return (
    <>
      <Button onClick={() => toggleDrawer()}>Select posts</Button>
      <ListDrawer allowCreate={false} enableRowSelections={false} />
    </>
  )
}
