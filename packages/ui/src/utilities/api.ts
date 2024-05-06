import qs from 'qs'

type GetOptions = RequestInit & {
  params?: Record<string, unknown>
}

export const requests = {
  delete: (url: string, options: RequestInit = { headers: {} }): Promise<Response> => {
    const headers = options && options.headers ? { ...options.headers } : {}

    const formattedOptions: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        ...headers,
        'X-Payload-Admin': 'true',
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
      headers: {
        'X-Payload-Admin': 'true',
      },
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
        'X-Payload-Admin': 'true',
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
        'X-Payload-Admin': 'true',
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
        'X-Payload-Admin': 'true',
      },
      method: 'put',
    }

    return fetch(url, formattedOptions)
  },
}
