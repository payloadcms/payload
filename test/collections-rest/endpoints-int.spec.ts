import { initPayloadTest } from '../helpers/configHelpers';
import { endpointsSlug } from './Endpoints';

require('isomorphic-fetch');

describe('Collections - Endpoints', () => {
  let endpoint;
  let serverURL;
  beforeAll(async () => {
    const config = await initPayloadTest({ __dirname, init: { local: false } });
    serverURL = config.serverURL;
    endpoint = async (path: string, method = 'get', params = undefined): Promise<unknown> => {
      const response = await fetch(`${serverURL}/api${path}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        method,
      });
      const { status } = response;
      const data = await response.json();
      return { status, data };
    };
  });
  describe('Endpoints', () => {
    it('should GET a static endpoint', async () => {
      const { status, data } = await endpoint(`/${endpointsSlug}/say-hello/joe-bloggs`);
      expect(status).toBe(200);
      expect(data.message).toStrictEqual('Hey Joey!');
    });

    it('should GET an endpoint with a parameter', async () => {
      const name = 'George';
      const { status, data } = await endpoint(`/${endpointsSlug}/say-hello/${name}`);
      expect(status).toBe(200);
      expect(data.message).toStrictEqual(`Hello ${name}!`);
    });

    it('should POST an endpoint with data', async () => {
      const params = { name: 'George', age: 29 };
      const { status, data } = await endpoint(`/${endpointsSlug}/whoami`, 'post', params);
      expect(status).toBe(200);
      expect(data.name).toStrictEqual(params.name);
      expect(data.age).toStrictEqual(params.age);
    });
  });
});
