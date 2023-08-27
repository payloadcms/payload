import payload from '../../../src.js';
import { initPayloadTest } from '../../helpers/configHelpers.js';
import { slug } from './config.js';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

import 'isomorphic-fetch';

let apiUrl;

const [code, secret, name] = ['test', 'strategy', 'Tester'];

const headers = {
  'Content-Type': 'application/json',
};

describe('AuthStrategies', () => {
  beforeAll(async () => {
    const { serverURL } = await initPayloadTest({ __dirname, init: { local: false } });
    apiUrl = `${serverURL}/api`;
  });

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy(payload);
    }
  });

  describe('create user', () => {
    beforeAll(async () => {
      await fetch(`${apiUrl}/${slug}`, {
        body: JSON.stringify({
          code,
          secret,
          name,
        }),
        headers,
        method: 'post',
      });
    });

    it('should return a logged in user from /me', async () => {
      const response = await fetch(`${apiUrl}/${slug}/me`, {
        headers: {
          ...headers,
          code,
          secret,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.name).toBe(name);
    });
  });
});
