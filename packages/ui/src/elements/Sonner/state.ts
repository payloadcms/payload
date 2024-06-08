import type React from 'react'

import type {
  ExternalToast,
  PromiseData,
  PromiseT,
  ToastT,
  ToastToDismiss,
  ToastTypes,
} from './types.js'

let toastsCounter = 1

class Observer {
  addToast = (data: ToastT) => {
    this.publish(data)
    this.toasts = [...this.toasts, data]
  }
  create = (
    data: ExternalToast & {
      jsx?: React.ReactElement
      message?: React.ReactNode | string
      promise?: PromiseT
      type?: ToastTypes
    },
  ) => {
    const { message, ...rest } = data
    const id = typeof data?.id === 'number' || data.id?.length > 0 ? data.id : toastsCounter++
    const alreadyExists = this.toasts.find((toast) => {
      return toast.id === id
    })
    const dismissible = data.dismissible === undefined ? true : data.dismissible

    if (alreadyExists) {
      this.toasts = this.toasts.map((toast) => {
        if (toast.id === id) {
          this.publish({ ...toast, ...data, id, title: message })
          return {
            ...toast,
            ...data,
            id,
            dismissible,
            title: message,
          }
        }

        return toast
      })
    } else {
      this.addToast({ title: message, ...rest, id, dismissible })
    }

    return id
  }

  custom = (jsx: (id: number | string) => React.ReactElement, data?: ExternalToast) => {
    const id = data?.id || toastsCounter++
    this.create({ id, jsx: jsx(id), ...data })
    return id
  }

  dismiss = (id?: number | string) => {
    if (!id) {
      this.toasts.forEach((toast) => {
        this.subscribers.forEach((subscriber) => subscriber({ id: toast.id, dismiss: true }))
      })
    }

    this.subscribers.forEach((subscriber) => subscriber({ id, dismiss: true }))
    return id
  }

  error = (message: React.ReactNode | string, data?: ExternalToast) => {
    return this.create({ ...data, type: 'error', message })
  }

  info = (message: React.ReactNode | string, data?: ExternalToast) => {
    return this.create({ ...data, type: 'info', message })
  }

  loading = (message: React.ReactNode | string, data?: ExternalToast) => {
    return this.create({ ...data, type: 'loading', message })
  }

  message = (message: React.ReactNode | string, data?: ExternalToast) => {
    return this.create({ ...data, message })
  }

  promise = <ToastData>(promise: PromiseT<ToastData>, data?: PromiseData<ToastData>) => {
    if (!data) {
      // Nothing to show
      return
    }

    let id: number | string | undefined = undefined
    if (data.loading !== undefined) {
      id = this.create({
        ...data,
        type: 'loading',
        description: typeof data.description !== 'function' ? data.description : undefined,
        message: data.loading,
        promise,
      })
    }

    const p = promise instanceof Promise ? promise : promise()

    let shouldDismiss = id !== undefined

    p.then((response) => {
      // TODO: Clean up TS here, response has incorrect type
      // @ts-expect-error
      if (response && typeof response.ok === 'boolean' && !response.ok) {
        shouldDismiss = false
        const message =
          typeof data.error === 'function'
            ? // @ts-expect-error
              data.error(`HTTP error! status: ${response.status}`)
            : data.error
        const description =
          typeof data.description === 'function'
            ? // @ts-expect-error
              data.description(`HTTP error! status: ${response.status}`)
            : data.description
        this.create({ id, type: 'error', description, message })
      } else if (data.success !== undefined) {
        shouldDismiss = false
        const message = typeof data.success === 'function' ? data.success(response) : data.success
        const description =
          typeof data.description === 'function' ? data.description(response) : data.description
        this.create({ id, type: 'success', description, message })
      }
    })
      .catch((error) => {
        if (data.error !== undefined) {
          shouldDismiss = false
          const message = typeof data.error === 'function' ? data.error(error) : data.error
          const description =
            typeof data.description === 'function' ? data.description(error) : data.description
          this.create({ id, type: 'error', description, message })
        }
      })
      .finally(() => {
        if (shouldDismiss) {
          // Toast is still in load state (and will be indefinitely — dismiss it)
          this.dismiss(id)
          id = undefined
        }

        data.finally?.()
      })

    return id
  }

  publish = (data: ToastT) => {
    this.subscribers.forEach((subscriber) => subscriber(data))
  }

  // We use arrow functions to maintain the correct `this` reference
  subscribe = (subscriber: (toast: ToastT | ToastToDismiss) => void) => {
    this.subscribers.push(subscriber)

    return () => {
      const index = this.subscribers.indexOf(subscriber)
      this.subscribers.splice(index, 1)
    }
  }

  subscribers: Array<(toast: ExternalToast | ToastToDismiss) => void>

  success = (message: React.ReactNode | string, data?: ExternalToast) => {
    return this.create({ ...data, type: 'success', message })
  }

  toasts: Array<ToastT | ToastToDismiss>

  warning = (message: React.ReactNode | string, data?: ExternalToast) => {
    return this.create({ ...data, type: 'warning', message })
  }

  constructor() {
    this.subscribers = []
    this.toasts = []
  }
}

export const ToastState = new Observer()

// bind this to the toast function
const toastFunction = (message: React.ReactNode | string, data?: ExternalToast) => {
  const id = data?.id || toastsCounter++

  ToastState.addToast({
    title: message,
    ...data,
    id,
  })
  return id
}

const basicToast = toastFunction

const getHistory = () => ToastState.toasts

// We use `Object.assign` to maintain the correct types as we would lose them otherwise
export const toast = Object.assign(
  basicToast,
  {
    custom: ToastState.custom,
    dismiss: ToastState.dismiss,
    error: ToastState.error,
    info: ToastState.info,
    loading: ToastState.loading,
    message: ToastState.message,
    promise: ToastState.promise,
    success: ToastState.success,
    warning: ToastState.warning,
  },
  { getHistory },
)
