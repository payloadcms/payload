import React from 'react'

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
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}
