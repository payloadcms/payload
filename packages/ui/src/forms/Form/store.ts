import type { FormState } from 'payload'

type Listener = () => void

type FieldSubscriber = {
  callback: Listener
  path: string
}

function createFormStateStore(initialState: FormState = {}) {
  let state = { ...initialState }
  const subscribers = new Set<FieldSubscriber>()

  const subscribe = (path: string, callback: Listener) => {
    const subscriber = { callback, path }
    subscribers.add(subscriber)

    return () => {
      subscribers.delete(subscriber)
    }
  }

  const getSnapshot = (path: string) => {
    return state[path]
  }

  const setField = (path: string, value: any) => {
    if (state[path] !== value) {
      state = { ...state, [path]: value }

      // Notify only subscribers of this specific field
      subscribers.forEach((subscriber) => {
        if (subscriber.path === path) {
          subscriber.callback()
        }
      })
    }
  }

  const setFields = (values: FormState) => {
    const changedFields = new Set<string>()

    // Track which fields actually changed
    Object.entries(values).forEach(([path, value]) => {
      if (state[path] !== value) {
        changedFields.add(path)
      }
    })

    if (changedFields.size > 0) {
      state = { ...state, ...values }

      // Notify only subscribers of changed fields
      subscribers.forEach((subscriber) => {
        if (changedFields.has(subscriber.path)) {
          subscriber.callback()
        }
      })
    }
  }

  return {
    getSnapshot,
    setField,
    setFields,
    subscribe,
  }
}

const formStateStore = createFormStateStore({})

export { formStateStore }
