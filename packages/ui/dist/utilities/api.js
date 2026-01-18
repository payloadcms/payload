import * as qs from 'qs-esm';
export const requests = {
  delete: (url, options = {
    headers: {}
  }) => {
    const headers = options && options.headers ? {
      ...options.headers
    } : {};
    const formattedOptions = {
      ...options,
      credentials: 'include',
      headers: {
        ...headers
      },
      method: 'delete'
    };
    return fetch(url, formattedOptions);
  },
  get: (url, options = {
    headers: {}
  }) => {
    let query = '';
    if (options.params) {
      query = qs.stringify(options.params, {
        addQueryPrefix: true
      });
    }
    return fetch(`${url}${query}`, {
      credentials: 'include',
      ...options
    });
  },
  patch: (url, options = {
    headers: {}
  }) => {
    const headers = options && options.headers ? {
      ...options.headers
    } : {};
    const formattedOptions = {
      ...options,
      credentials: 'include',
      headers: {
        ...headers
      },
      method: 'PATCH'
    };
    return fetch(url, formattedOptions);
  },
  post: (url, options = {
    headers: {}
  }) => {
    const headers = options && options.headers ? {
      ...options.headers
    } : {};
    const formattedOptions = {
      ...options,
      credentials: 'include',
      headers: {
        ...headers
      },
      method: 'post'
    };
    return fetch(`${url}`, formattedOptions);
  },
  put: (url, options = {
    headers: {}
  }) => {
    const headers = options && options.headers ? {
      ...options.headers
    } : {};
    const formattedOptions = {
      ...options,
      credentials: 'include',
      headers: {
        ...headers
      },
      method: 'put'
    };
    return fetch(url, formattedOptions);
  }
};
//# sourceMappingURL=api.js.map