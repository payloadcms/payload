import type { FormState } from 'payload'
import type { StoreApi } from 'zustand'

import { createContext, useContext, useRef } from 'react'
import { createStore, useStore } from 'zustand'

import { fieldReducer } from './fieldReducer.js'

// export const useFormFields = create((set, initialState) => ({
//   fields: {} as FormState,
// } satisfies FormState))

export type FormStateStore = {
  dispatchFields: (action: any) => void
  state: FormState
}

export const FormStateStoreContext = createContext<null | StoreApi<FormStateStore>>(null)

export const createFormStateStore = (initialState: FormState) =>
  createStore<FormStateStore>()((set) => ({
    dispatchFields: (action) =>
      set((store) => ({ ...store, state: fieldReducer(store.state, action) })),
    state: initialState,
  }))

export const useCreateFormStateStore = (initialState: FormState) => {
  const storeRef = useRef<null | StoreApi<FormStateStore>>(null)

  if (storeRef.current === null) {
    storeRef.current = createFormStateStore(initialState)
  }

  return storeRef.current
}

export const useFormStateStore = <T>(selector: (store: FormStateStore) => T): T => {
  const formStateStoreContext = useContext(FormStateStoreContext)

  if (!formStateStoreContext) {
    throw new Error(`useCounterStore must be used within CounterStoreProvider`)
  }

  return useStore(formStateStoreContext, selector)
}

// import { randomUUID } from 'crypto'
// import type { FormState } from 'payload'

// type Listener = () => void

// type FieldSubscriber = {
//   callback: Listener
//   path: string
// }

// type FormStateStore = {
//   getSnapshot: (path: string) => any
//   setField: (path: string, value: any) => void
//   setFields: (values: FormState) => void
//   subscribe: (path: string, callback: Listener) => () => void
// }

// function create(initialState: FormState = {}): FormStateStore {
//   let state = { ...initialState }
//   const subscribers = new Set<FieldSubscriber>()

//   const subscribe = (path: string, callback: Listener) => {
//     const subscriber = { callback, path }
//     subscribers.add(subscriber)

//     return () => {
//       subscribers.delete(subscriber)
//     }
//   }

//   const getSnapshot = (path: string) => {
//     return state[path]
//   }

//   const setField = (path: string, value: any) => {
//     if (state[path] !== value) {
//       state = { ...state, [path]: value }

//       // Notify only subscribers of this specific field
//       subscribers.forEach((subscriber) => {
//         if (subscriber.path === path) {
//           subscriber.callback()
//         }
//       })
//     }
//   }

//   const setFields = (values: FormState) => {
//     const changedFields = new Set<string>()

//     // Track which fields actually changed
//     Object.entries(values).forEach(([path, value]) => {
//       if (state[path] !== value) {
//         changedFields.add(path)
//       }
//     })

//     if (changedFields.size > 0) {
//       state = { ...state, ...values }

//       // Notify only subscribers of changed fields
//       subscribers.forEach((subscriber) => {
//         if (changedFields.has(subscriber.path)) {
//           subscriber.callback()
//         }
//       })
//     }
//   }

//   return {
//     getSnapshot,
//     setField,
//     setFields,
//     subscribe,
//   }
// }

// const globalStore = new Map<string, FormStateStore>()

// export const createFormStateStore = (initialState) => {
//   const id = randomUUID()
//   const formStateStore = create(initialState)
//   globalStore.set(id, formStateStore)
// }

// export { formStateStore }
