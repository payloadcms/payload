import getConfig from '../../config/load';
import { email, password } from '../../mongoose/testCredentials';

require('isomorphic-fetch');

const { serverURL: url } = getConfig();

let token = null;
let headers = null;

describe('Collections - REST', () => {
  beforeAll(async (done) => {
    const response = await fetch(`${url}/api/admins/login`, {
      body: JSON.stringify({
        email,
        password,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'post',
    });

    const data = await response.json();

    ({ token } = data);
    headers = {
      Authorization: `JWT ${token}`,
      'Content-Type': 'application/json',
    };

    done();
  });

  describe('Endpoints', () => {
    it('should GET a static endpoint', async () => {
      const response = await fetch(`${url}/api/endpoints/say-hello/joe-bloggs`, {
        headers: {
          ...headers,
        },
        method: 'get',
      });
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.message).toStrictEqual(`Hey Joey! Welcome to ${url}/api`);
    });
    it('should GET an endpoint with a parameter', async () => {
      const response = await fetch(`${url}/api/endpoints/say-hello/George`, {
        headers: {
          ...headers,
        },
        method: 'get',
      });
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.message).toStrictEqual('Hello George!');
    });
    it('should POST an endpoint with data', async () => {
      const param = 'George';
      const response = await fetch(`${url}/api/endpoints/whoami`, {
        body: JSON.stringify({
          name: 'George',
          age: 29,
        }),
        headers: {
          ...headers,
        },
        method: 'post',
      });
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.message).toStrictEqual("You're George and you're 29 years old.");
    });
  });
});
