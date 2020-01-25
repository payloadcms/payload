import Cookies from 'universal-cookie';
import qs from 'qs';

const cookies = new Cookies();

const setJWT = () => {
  const jwt = cookies.get('token');
  return jwt ? { 'Authorization': `JWT ${jwt}` } : {}
};

export const requests = {
  get: (url, params) => {
    const query = qs.stringify(params, { addQueryPrefix: true });
    return fetch(`${url}${query}`, {
      headers: {
        ...setJWT()
      }
    });
  },

  post: (url, options = {}) => {
    const headers = options && options.headers ? { ...options.headers } : {};

    const formattedOptions = {
      ...options,
      method: 'post',
      headers: {
        ...headers,
        ...setJWT(),
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
        ...setJWT(),
      },
    };

    return fetch(`${url}`, formattedOptions);
  },
};
