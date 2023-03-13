import { GraphQLClient } from 'graphql-request';
import { initPayloadTest } from '../helpers/configHelpers';
import configPromise, { arraySlug, englishLocale, slug, spanishLocale } from './config';
import payload from '../../src';
import { RESTClient } from '../helpers/rest';

describe('globals', () => {
  let serverURL;
  beforeAll(async () => {
    const init = await initPayloadTest({ __dirname, init: { local: false } });
    serverURL = init.serverURL;
  });
  describe('REST', () => {
    let client: RESTClient;
    beforeAll(async () => {
      const config = await configPromise;
      client = new RESTClient(config, { serverURL, defaultSlug: slug });
    });
    it('should create', async () => {
      const title = 'update';
      const data = {
        title,
      };
      const { status, doc } = await client.updateGlobal({ data });

      expect(status).toEqual(200);
      expect(doc).toMatchObject(data);
    });

    it('should read', async () => {
      const title = 'read';
      const data = {
        title,
      };
      await client.updateGlobal({ data });
      const { status, doc } = await client.findGlobal();

      expect(status).toEqual(200);
      expect(doc.globalType).toEqual(slug);
      expect(doc).toMatchObject(data);
    });

    it('should update with localization', async () => {
      const array = [{
        text: 'one',
      }];

      const { status, doc } = await client.updateGlobal({
        slug: arraySlug,
        data: {
          array,
        },
      });

      expect(status).toBe(200);
      expect(doc.array).toHaveLength(1);
      expect(doc.array).toMatchObject(array);
      expect(doc.id).toBeDefined();
    });
  });

  describe('local', () => {
    it('should save empty json objects', async () => {
      const createdJSON = await payload.updateGlobal({
        slug,
        data: {
          json: {
            state: {},
          },
        },
      });

      expect(createdJSON.json.state).toEqual({});
    });

    it('should create', async () => {
      const data = {
        title: 'title',
      };
      const doc = await payload.updateGlobal({
        slug,
        data,
      });
      expect(doc).toMatchObject(data);
    });

    it('should read', async () => {
      const title = 'read';
      const data = {
        title,
      };
      await payload.updateGlobal({
        slug,
        data,
      });
      const doc = await payload.findGlobal({
        slug,
      });

      expect(doc.globalType).toEqual(slug);
      expect(doc).toMatchObject(data);
    });

    it('should update with localization', async () => {
      const localized = {
        en: {
          array: [{
            text: 'one',
          }],
        },
        es: {
          array: [{
            text: 'uno',
          }],
        },
      };

      await payload.updateGlobal({
        slug: arraySlug,
        locale: englishLocale,
        data: {
          array: localized.en.array,
        },
      });

      await payload.updateGlobal({
        slug: arraySlug,
        locale: spanishLocale,
        data: {
          array: localized.es.array,
        },
      });

      const en = await payload.findGlobal({
        locale: englishLocale,
        slug: arraySlug,
      });

      const es = await payload.findGlobal({
        locale: spanishLocale,
        slug: arraySlug,
      });

      expect(en).toMatchObject(localized.en);
      expect(es).toMatchObject(localized.es);
    });
  });

  describe('graphql', () => {
    let client: GraphQLClient;
    beforeAll(async () => {
      const config = await configPromise;
      const url = `${serverURL}${config.routes.api}${config.routes.graphQL}`;
      client = new GraphQLClient(url);
    });

    it('should create', async () => {
      const title = 'graphql-title';
      const query = `mutation {
          updateGlobal(data: {title: "${title}"}) {
          title
        }
      }`;

      const response = await client.request(query);
      const doc = response.updateGlobal;

      expect(doc).toMatchObject({ title });
    });

    it('should read', async () => {
      const data = {
        title: 'updated graphql',
      };
      await payload.updateGlobal({
        slug,
        data,
      });

      const query = `query {
        Global {
          title
        }
      }`;

      const response = await client.request(query);
      const doc = response.Global;

      expect(doc).toMatchObject(data);
    });
  });
});
