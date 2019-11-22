import Cookies from 'universal-cookie';
import superagentPromise from 'superagent-promise';
import _superagent from 'superagent';
import qs from 'qs';

const cookies = new Cookies();
const superagent = superagentPromise(_superagent, global.Promise);
const responseBody = res => res.body;

const setJwt = () => {
  const jwt = cookies.get('token');
  return jwt ? { 'Authorization': `JWT ${jwt}` } : {}
};

const requests = {
  get: (url, params) => {
    const query = qs.stringify(params, { addQueryPrefix: true });
    return superagent.get(`${url}${query}`).set(setJwt()).then(responseBody);
  },

  post: (url, body) =>
    superagent.post(`${url}`, body).set(setJwt()).then(responseBody),

  put: (url, body) =>
    superagent.put(`${url}`, body).set(setJwt()).then(responseBody)
};

export default {
  requests
};
