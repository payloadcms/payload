import Cookies from 'universal-cookie';
import superagentPromise from 'superagent-promise';
import _superagent from 'superagent';

const cookies = new Cookies();
const superagent = superagentPromise(_superagent, global.Promise);
const responseBody = res => res.body;

const setJwt = () => {
  const jwt = cookies.get('token');
  return jwt ? { 'Authorization': `JWT ${jwt}` } : {}
}

const requests = {
  get: url =>
    superagent.get(`${url}`).set(setJwt()).then(responseBody),

  post: (url, body) =>
    superagent.post(`${url}`, body).set(setJwt()).then(responseBody),

  put: (url, body) =>
    superagent.put(`${url}`, body).set(setJwt()).then(responseBody)
};

export default {
  requests
};
