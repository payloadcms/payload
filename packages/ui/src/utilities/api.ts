import * as qs from 'qs-esm'

type GetOptions = {
  params?: Record<string, unknown>
} & RequestInit

export const requests = {
  delete: (url: string, options: RequestInit = { headers: {} }): Promise<Response> => {
    const headers = options && options.headers ? { ...options.headers } : {}

    const formattedOptions: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        ...headers,
      },
      method: 'delete',
    }

    return fetch(url, formattedOptions)
  },

  get: (url: string, options: GetOptions = { headers: {} }): Promise<Response> => {
    let query = ''
    if (options.params) {
      query = qs.stringify(options.params, { addQueryPrefix: true })
    }
    return fetch(`${url}${query}`, {
      credentials: 'include',
      ...options,
    })
  },

  patch: (url: string, options: RequestInit = { headers: {} }): Promise<Response> => {
    const headers = options && options.headers ? { ...options.headers } : {}

    const formattedOptions: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        ...headers,
      },
      method: 'PATCH',
    }

    return fetch(url, formattedOptions)
  },

  post: (url: string, options: RequestInit = { headers: {} }): Promise<Response> => {
    const headers = options && options.headers ? { ...options.headers } : {}

    const formattedOptions: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        ...headers,
      },
      method: 'post',
    }

    return fetch(`${url}`, formattedOptions)
  },

  put: (url: string, options: RequestInit = { headers: {} }): Promise<Response> => {
    const headers = options && options.headers ? { ...options.headers } : {}

    const formattedOptions: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        ...headers,
      },
      method: 'put',
    }

    return fetch(url, formattedOptions)
  },
}
