import superagentPromise from 'superagent-promise';
import _superagent from 'superagent';

const superagent = superagentPromise(_superagent, global.Promise);

const responseBody = res => res.body;

const requests = {
  GET: url =>
    superagent.get(`${url}`).then(responseBody),

  POST: (url, body) =>
    superagent.post(`${url}`, body).then(responseBody)
};

export default {
  requests
};
