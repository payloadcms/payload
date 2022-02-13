/**
 * @jest-environment node
 */
import { request, GraphQLClient } from 'graphql-request';
import getConfig from '../../config/load';
import { email, password } from '../../mongoose/testCredentials';

require('isomorphic-fetch');

const config = getConfig();

const url = `${config.serverURL}${config.routes.api}${config.routes.graphQL}`;

let client;
let token;
let versionID;

describe('Global Versions - GraphQL', () => {
  const title = 'Global Blocks Title';
  beforeAll(async (done) => {
    // language=graphql
    const login = `
      mutation {
        loginAdmin(
          email: "${email}",
          password: "${password}"
        ) {
          token
        }
      }`;

    const response = await request(url, login);

    token = response.loginAdmin.token;

    client = new GraphQLClient(url, { headers: { Authorization: `JWT ${token}` } });

    // language=graphql
    const query = `mutation {
      updateBlocksGlobal(draft: true, data: {
        title: "${title}"
        blocks: [{ quote: "Test quote", color: "red", blockName: "Some block title", blockType: "quote"}]
      }) {
        _status
        title
        blocks {
          __typename
          ... on Quote {
            quote
            color
          }
        }
      }
    }`;
    await client.request(query);

    done();
  });

  describe('Create', () => {
    it('should allow a new BlocksGlobal to be created with draft status', async () => {
      const updatedTitle = 'updated global title';

      // language=graphql
      const query = `mutation {
        updateBlocksGlobal(draft: true, data: {
          title: "${updatedTitle}"
        }) {
          _status
          title
        }
      }`;
      await client.request(query);

      const response = await client.request(query);

      const data = response.updateBlocksGlobal;

      expect(data._status).toStrictEqual('draft');
      expect(data.title).toStrictEqual(updatedTitle);
    });
  });

  describe('should allow a version to be retrieved', () => {
    beforeAll(async (done) => {
      const updatedTitle = 'updated global title';

      // language=graphql
      const update = `mutation {
        updateBlocksGlobal(draft: true, data: {
          title: "${updatedTitle}"
        }) {
          _status
          title
        }
      }`;
      await client.request(update);

      // language=graphQL
      const query = `query {
        versionsBlocksGlobal(where: { version__title: "${title}" }) {
          docs {
            id
            version {
              title
            }
          }
        }
      }`;

      const response = await client.request(query);

      versionID = response.versionsBlocksGlobal.docs[0].id;
      done();
    });

    it('should allow read of versions by version id', async () => {
      // language=graphql
      const query = `query {
        versionsBlocksGlobal(id: "${versionID}") {
          id
          version {
            title
          }
        }
      }`;

      const response = await client.request(query);

      const data = response.versionsBlocksGlobal;
      versionID = data.id;

      expect(data.id).toBeDefined();
      expect(data.version.title).toStrictEqual(title);
    });

    it('should allow read of versions by querying version content', async () => {
      // language=graphQL
      const query = `query {
        versionsAutosavePosts(where: { version__title: {equals: "${title}" } }) {
          docs {
            id
            version {
              title
            }
          }
        }
      }`;

      const response = await client.request(query);

      const data = response.versionsAutosavePosts;
      const doc = data.docs[0];
      versionID = doc.id;

      expect(doc.id).toBeDefined();
      expect(doc.version.title).toStrictEqual(title);
    });
  });

  describe('Restore', () => {
    it('should allow a version to be restored', async () => {
      // language=graphql
      const restore = `mutation {
        restoreVersionBlocksGlobal(id: "${versionID}")
      }`;

      await client.request(restore);

      const query = `query {
        BlocksGlobal {
          title
        }
      }`;

      const response = await client.request(query);
      const data = response.AutosavePost;
      expect(data.title).toStrictEqual(title);
    });
  });
});
