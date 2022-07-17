import { initPayloadTest } from '../helpers/configHelpers';
import { endpointsSlug } from './Endpoints';
import { RESTClient } from '../helpers/rest';
import { slug } from '../globals/config';

require('isomorphic-fetch');

let client: RESTClient;

describe('Collections - Endpoints', () => {
  beforeAll(async () => {
    const config = await initPayloadTest({ __dirname, init: { local: false } });
    const { serverURL } = config;
    client = new RESTClient(config, { serverURL, defaultSlug: slug });
  });
  describe('Endpoints', () => {
    it('should GET a static endpoint', async () => {
      const { status, data } = await client.endpoint(`/${endpointsSlug}/say-hello/joe-bloggs`);
      expect(status).toBe(200);
      expect(data.message).toStrictEqual('Hey Joey!');
    });

    it('should GET an endpoint with a parameter', async () => {
      const name = 'George';
      const { status, data } = await client.endpoint(`/${endpointsSlug}/say-hello/${name}`);
      expect(status).toBe(200);
      expect(data.message).toStrictEqual(`Hello ${name}!`);
    });

    it('should POST an endpoint with data', async () => {
      const params = { name: 'George', age: 29 };
      const { status, data } = await client.endpoint(`/${endpointsSlug}/whoami`, 'post', params);
      expect(status).toBe(200);
      expect(data.name).toStrictEqual(params.name);
      expect(data.age).toStrictEqual(params.age);
    });
  });
});
