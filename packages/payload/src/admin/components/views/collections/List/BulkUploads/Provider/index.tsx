import React from 'react'

import type { Action, State } from './reducer'

import { reducer } from './reducer'

const Context = React.createContext({
  dispatchAction: undefined as React.Dispatch<Action>,
  state: {} as State,
})

type Props = {
  children?: React.ReactNode
  initialFiles: FileList
}
export const BulkUploadFormDataProvider: React.FC<Props> = ({ children, initialFiles }) => {
  const [state, dispatchAction] = React.useReducer(reducer, {
    activeIndex: 0,
    allFormData: Array.from(initialFiles).map((file) => ({
      file,
    })),
    isProcessing: false,
  })

  return (
    <Context.Provider
      value={{
        dispatchAction,
        state,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useBulkUploadFormData = () => React.useContext(Context)
