import qs from 'qs';

type GetOptions = RequestInit & {
  params?: Record<string, unknown>
}

export const requests = {
  get: (url: string, options: GetOptions = { headers: {} }): Promise<Response> => {
    let query = '';
    if (options.params) {
      query = qs.stringify(options.params, { addQueryPrefix: true });
    }
    return fetch(`${url}${query}`, {
      credentials: 'include',
      ...options,
    });
  },

  post: (url: string, options: RequestInit = { headers: {} }): Promise<Response> => {
    const headers = options && options.headers ? { ...options.headers } : {};

    const formattedOptions: RequestInit = {
      ...options,
      method: 'post',
      credentials: 'include',
      headers: {
        ...headers,
      },
    };

    return fetch(`${url}`, formattedOptions);
  },

  put: (url: string, options: RequestInit = { headers: {} }): Promise<Response> => {
    const headers = options && options.headers ? { ...options.headers } : {};

    const formattedOptions: RequestInit = {
      ...options,
      method: 'put',
      credentials: 'include',
      headers: {
        ...headers,
      },
    };

    return fetch(url, formattedOptions);
  },

  patch: (url: string, options: RequestInit = { headers: {} }): Promise<Response> => {
    const headers = options && options.headers ? { ...options.headers } : {};

    const formattedOptions: RequestInit = {
      ...options,
      method: 'PATCH',
      credentials: 'include',
      headers: {
        ...headers,
      },
    };

    return fetch(url, formattedOptions);
  },

  delete: (url: string, options: RequestInit = { headers: {} }): Promise<Response> => {
    const headers = options && options.headers ? { ...options.headers } : {};

    const formattedOptions: RequestInit = {
      ...options,
      method: 'delete',
      credentials: 'include',
      headers: {
        ...headers,
      },
    };

    return fetch(url, formattedOptions);
  },
};
