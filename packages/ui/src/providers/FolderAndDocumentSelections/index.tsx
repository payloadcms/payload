'use client'
import React from 'react'

type ContextValue = {
  clearSelections: () => void
  isSelecting: boolean
  selectedDocs: Set<number | string>
  selectedFolders: Set<number | string>
  setSelecting: (selections: boolean) => void
  toggleSelection: ({ id, type }: { id: number | string; type: 'document' | 'folder' }) => void
}

const Context = React.createContext<ContextValue>({
  clearSelections: () => undefined,
  isSelecting: false,
  selectedDocs: new Set(),
  selectedFolders: new Set(),
  setSelecting: () => undefined,
  toggleSelection: () => undefined,
})

export function FolderAndDocumentSelectionsProvider({
  children,
}: {
  readonly children: React.ReactNode
}) {
  const [isSelecting, setIsSelecting] = React.useState<ContextValue['isSelecting']>(false)
  const [selectedFolders, setSelectedFolders] = React.useState<ContextValue['selectedFolders']>(
    new Set(),
  )
  const [selectedDocs, setSelectedDocs] = React.useState<ContextValue['selectedDocs']>(new Set())

  const toggleSelection: ContextValue['toggleSelection'] = React.useCallback(
    ({ id, type }) => {
      if (type === 'folder') {
        if (selectedFolders.has(id)) {
          selectedFolders.delete(id)
        } else {
          selectedFolders.add(id)
        }
        setSelectedFolders(new Set(selectedFolders))
      } else {
        if (selectedDocs.has(id)) {
          selectedDocs.delete(id)
        } else {
          selectedDocs.add(id)
        }
        setSelectedDocs(new Set(selectedDocs))
      }

      if (selectedDocs.size + selectedFolders.size === 0) {
        setIsSelecting(false)
      } else {
        setIsSelecting(true)
      }
    },
    [selectedDocs, selectedFolders],
  )

  const clearSelections = React.useCallback(() => {
    setSelectedDocs(new Set())
    setSelectedFolders(new Set())
    setIsSelecting(false)
  }, [])

  return (
    <Context.Provider
      value={{
        clearSelections,
        isSelecting,
        selectedDocs,
        selectedFolders,
        setSelecting: setIsSelecting,
        toggleSelection,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export function useFolderAndDocumentSelections(): ContextValue {
  const context = React.useContext(Context)

  if (context === undefined) {
    throw new Error('useSelections must be used within a SelectionsProvider')
  }

  return context
}
