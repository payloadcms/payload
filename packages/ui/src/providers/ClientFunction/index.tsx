'use client'
import React from 'react'

type AddClientFunctionContextType = (func: any) => void
type ClientFunctionsContextType = Record<string, any>

const AddClientFunctionContext = React.createContext<AddClientFunctionContextType>(() => null)
const ClientFunctionsContext = React.createContext<ClientFunctionsContextType>({})

type AddFunctionArgs = { key: string; func: any }

export const ClientFunctionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clientFunctions, setClientFunctions] = React.useState({})

  const addClientFunction = React.useCallback((args: AddFunctionArgs) => {
    setClientFunctions((state) => {
      const newState = { ...state }
      newState[args.key] = args.func
      return newState
    })
  }, [])

  return (
    <AddClientFunctionContext.Provider value={addClientFunction}>
      <ClientFunctionsContext.Provider value={clientFunctions}>
        {children}
      </ClientFunctionsContext.Provider>
    </AddClientFunctionContext.Provider>
  )
}

export const useAddClientFunction = (key: string, func: any) => {
  const addClientFunction = React.useContext(AddClientFunctionContext)

  React.useEffect(() => {
    addClientFunction({
      key,
      func,
    })
  }, [func, key])
}

export const useClientFunctions = () => {
  return React.useContext(ClientFunctionsContext)
}
