import Cookies from 'universal-cookie';
import qs from 'qs';

const { cookiePrefix } = PAYLOAD_CONFIG;
const cookieTokenName = `${cookiePrefix}-token`;

export const getJWTHeader = () => {
  const cookies = new Cookies();
  const jwt = cookies.get(cookieTokenName);
  return jwt ? { Authorization: `JWT ${jwt}` } : {};
};

export const requests = {
  get: (url, params) => {
    const query = qs.stringify(params, { addQueryPrefix: true, depth: 10 });
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
