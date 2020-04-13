import Cookies from 'universal-cookie';
import qs from 'qs';

export const getJWTHeader = () => {
  const cookies = new Cookies();
  const jwt = cookies.get('token');
  return jwt ? { Authorization: `JWT ${jwt}` } : {};
};

export const requests = {
  get: (url, params) => {
    const query = qs.stringify(params, { addQueryPrefix: true });
    return fetch(`${url}${query}`, {
      headers: {
        ...getJWTHeader(),
      },
    });
  },

  post: (url, options = {}) => {
    const headers = options && options.headers ? { ...options.headers } : {};

    const formattedOptions = {
      ...options,
      method: 'post',
      headers: {
        ...headers,
        ...getJWTHeader(),
      },
    };

    return fetch(`${url}`, formattedOptions);
  },

  put: (url, options = {}) => {
    const headers = options && options.headers ? { ...options.headers } : {};

    const formattedOptions = {
      ...options,
      method: 'put',
      headers: {
        ...headers,
        ...getJWTHeader(),
      },
    };

    return fetch(`${url}`, formattedOptions);
  },
};
