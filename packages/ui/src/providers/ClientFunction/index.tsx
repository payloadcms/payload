'use client'
import React from 'react'

type ModifyClientFunctionContextType = {
  addClientFunction: (args: ModifyFunctionArgs) => void
  removeClientFunction: (args: ModifyFunctionArgs) => void
}
type ClientFunctionsContextType = Record<string, any>

const ModifyClientFunctionContext = React.createContext<ModifyClientFunctionContextType>({
  addClientFunction: () => null,
  removeClientFunction: () => null,
})
const ClientFunctionsContext = React.createContext<ClientFunctionsContextType>({})

type ModifyFunctionArgs = { func: any; key: string }

export const ClientFunctionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clientFunctions, setClientFunctions] = React.useState({})

  const addClientFunction = React.useCallback((args: ModifyFunctionArgs) => {
    setClientFunctions((state) => {
      const newState = { ...state }
      newState[args.key] = args.func
      return newState
    })
  }, [])

  const removeClientFunction = React.useCallback((args: ModifyFunctionArgs) => {
    setClientFunctions((state) => {
      const newState = { ...state }
      delete newState[args.key]
      return newState
    })
  }, [])

  return (
    <ModifyClientFunctionContext.Provider
      value={{
        addClientFunction,
        removeClientFunction,
      }}
    >
      <ClientFunctionsContext.Provider value={clientFunctions}>
        {children}
      </ClientFunctionsContext.Provider>
    </ModifyClientFunctionContext.Provider>
  )
}

export const useAddClientFunction = (key: string, func: any) => {
  const { addClientFunction, removeClientFunction } = React.useContext(ModifyClientFunctionContext)

  React.useEffect(() => {
    addClientFunction({
      func,
      key,
    })

    return () => {
      removeClientFunction({
        func,
        key,
      })
    }
  }, [func, key, addClientFunction, removeClientFunction])
}

export const useClientFunctions = () => {
  return React.useContext(ClientFunctionsContext)
}
