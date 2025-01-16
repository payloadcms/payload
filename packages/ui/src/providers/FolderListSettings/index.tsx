'use client'
import React from 'react'

type FolderListSettingsContext = {
  setViewType: (viewType: 'grid' | 'list') => void
  viewType: 'grid' | 'list'
}

const Context = React.createContext<FolderListSettingsContext>({
  setViewType: () => undefined,
  viewType: 'grid',
})

type Props = {
  readonly children: React.ReactNode
}
export function FolderListSettingsProvider({ children }: Props) {
  // TODO: use preferences to store folder view settings
  const [viewType, setViewType] = React.useState<FolderListSettingsContext['viewType']>('grid')

  return (
    <Context.Provider
      value={{
        setViewType,
        viewType,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export function useFolderListSettings(): FolderListSettingsContext {
  const context = React.useContext(Context)

  if (context === undefined) {
    throw new Error('useFolderListSettings must be used within a FolderListSettingsProvider')
  }

  return context
}
