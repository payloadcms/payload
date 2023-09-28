import { useWindowInfo } from '@faceless-ui/window-info'
import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'

type SidebarContextType = {
  sidebarOpen: boolean
  setSidebarOpen: (value: boolean) => void
}

export const SidebarContext = React.createContext<SidebarContextType>({
  sidebarOpen: false,
  setSidebarOpen: () => {},
})

export const useSidebar = () => React.useContext(SidebarContext)

export const SidebarProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const {
    breakpoints: { l: largeBreak },
  } = useWindowInfo()

  const history = useHistory()

  const [sidebarOpen, setSidebarOpen] = React.useState(!largeBreak)

  useEffect(() => {
    setSidebarOpen(!largeBreak)
  }, [largeBreak])

  useEffect(() => {
    let unlisten: () => void

    if (largeBreak) {
      unlisten = history.listen(() => {
        setSidebarOpen(false)
      })
    } else if (unlisten) {
      unlisten()
    }

    return () => unlisten && unlisten()
  }, [history, setSidebarOpen, largeBreak])

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}
