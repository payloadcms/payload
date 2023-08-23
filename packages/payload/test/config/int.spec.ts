import { initPayloadTest } from '../helpers/configHelpers';
import payload from '../../src';

require('isomorphic-fetch');

describe('Config', () => {
  beforeAll(async () => {
    await initPayloadTest({ __dirname, init: { local: true } });
  });

  describe('payload config', () => {
    it('allows a custom field at the config root', () => {
      const { config } = payload;
      expect(config.custom).toEqual({ name: 'Customer portal' });
    });

    it('allows a custom field in the root endpoints', () => {
      const [endpoint] = payload.config.endpoints;

      expect(endpoint.custom).toEqual({ description: 'Get the sanitized payload config' });
    });
  });

  describe('collection config', () => {
    it('allows a custom field in collections', () => {
      const [collection] = payload.config.collections;
      expect(collection.custom).toEqual({ externalLink: 'https://foo.bar' });
    });

    it('allows a custom field in collection endpoints', () => {
      const [collection] = payload.config.collections;
      const [endpoint] = collection.endpoints;

      expect(endpoint.custom).toEqual({ examples: [{ type: 'response', value: { message: 'hi' } }] });
    });

    it('allows a custom field in collection fields', () => {
      const [collection] = payload.config.collections;
      const [field] = collection.fields;

      expect(field.custom).toEqual({ description: 'The title of this page' });
    });
  });


  describe('global config', () => {
    it('allows a custom field in globals', () => {
      const [global] = payload.config.globals;
      expect(global.custom).toEqual({ foo: 'bar' });
    });

    it('allows a custom field in global endpoints', () => {
      const [global] = payload.config.globals;
      const [endpoint] = global.endpoints;

      expect(endpoint.custom).toEqual({ params: [{ in: 'query', name: 'name', type: 'string' }] });
    });

    it('allows a custom field in global fields', () => {
      const [global] = payload.config.globals;
      const [field] = global.fields;

      expect(field.custom).toEqual({ description: 'The title of my global' });
    });
  });
});
