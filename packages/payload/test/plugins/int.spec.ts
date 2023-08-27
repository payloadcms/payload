import { initPayloadTest } from '../helpers/configHelpers.js';
import { RESTClient } from '../helpers/rest.js';
import configPromise, { pagesSlug } from './config.js';
import payload from '../../src.js';
import path from 'path';
const __dirname = path.dirname(new URL(import.meta.url).pathname);

import 'isomorphic-fetch';

let client;

describe('Collections - Plugins', () => {
  beforeAll(async () => {
    const { serverURL } = await initPayloadTest({ __dirname, init: { local: false } });
    const config = await configPromise;
    client = new RESTClient(config, { serverURL, defaultSlug: pagesSlug });
    await client.login();
  });

  it('created pages collection', async () => {
    const { id } = await payload.create({
      collection: pagesSlug,
      data: {
        title: 'Test Page',
      },
    });

    expect(id).toEqual(expect.any(String));
  });
});
