'use client'
import type { JobLog } from 'payload'

import React, { createContext, useContext } from 'react'

type SelectedTaskContextType = {
  setTaskLog: React.Dispatch<React.SetStateAction<JobLog | null>>
  taskLog: JobLog | null
}

const SelectedTaskContext = createContext<SelectedTaskContextType>({
  setTaskLog: () => null, // Default no-op function
  taskLog: null,
})

export const useSelectedTaskContext = () => useContext(SelectedTaskContext)

export const SelectedTaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [taskLog, setTaskLog] = React.useState<JobLog | null>(null)

  return (
    <SelectedTaskContext.Provider value={{ setTaskLog, taskLog }}>
      {children}
    </SelectedTaskContext.Provider>
  )
}
