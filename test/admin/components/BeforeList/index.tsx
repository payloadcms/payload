// src/components/SelectPostsButton.tsx
'use client'
import { Button, type UseListDrawer, useListDrawer } from '@payloadcms/ui'
import { useMemo, useState } from 'react'

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

export const SelectFormatDocURLButton = () => {
  const [selectedDocumentID, setSelectedDocumentID] = useState<string>()

  const listDrawerArgs = useMemo<UseListDrawerArgs>(
    () => ({
      collectionSlugs: ['format-doc-url'],
    }),
    [],
  )
  const [ListDrawer, _, { closeDrawer, toggleDrawer }] = useListDrawer(listDrawerArgs)

  return (
    <>
      <Button onClick={() => toggleDrawer()}>Select format doc</Button>
      <ListDrawer
        allowCreate={false}
        enableRowSelections={false}
        onSelect={({ doc }) => {
          setSelectedDocumentID(String(doc.id))
          closeDrawer()
        }}
      />
      {selectedDocumentID && <p role="status">Selected document: {selectedDocumentID}</p>}
    </>
  )
}
