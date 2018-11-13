import superagentPromise from 'superagent-promise';
import _superagent from 'superagent';

const superagent = superagentPromise(_superagent, global.Promise);

const responseBody = res => res.body;

const requests = {
  get: url =>
    superagent.get(`${url}`).then(responseBody),

  post: (url, body) =>
    superagent.post(`${url}`, body).then(responseBody)
};

export default {
  requests
};
