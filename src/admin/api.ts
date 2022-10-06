import qs from 'qs';

export const requests = {
  get: (url: string, params: unknown = {}): Promise<Response> => {
    const query = qs.stringify(params, { addQueryPrefix: true });
    return fetch(`${url}${query}`, { credentials: 'include' });
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
