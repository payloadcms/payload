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
let postID;
let versionID;

describe('Collections GrahpQL Version Resolvers', () => {
  const title = 'autosave title';

  beforeAll(async (done) => {
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

    done();
  });

  describe('Create', () => {
    it('should allow a new autosavePost to be created with draft status', async () => {
      const description = 'autosave description';

      const query = `mutation {
          createAutosavePost(data: {title: "${title}", description: "${description}"}) {
          id
          title
          description
          createdAt
          updatedAt
          _status
        }
      }`;

      const response = await client.request(query);

      const data = response.createAutosavePost;
      postID = data.id;

      expect(data._status).toStrictEqual('draft');
    });
  });

  describe('Read', () => {
    const updatedTitle = 'updated title';

    beforeAll(async (done) => {
      // modify the post to create a new version
      // language=graphQL
      const update = `mutation {
        updateAutosavePost(id: "${postID}", data: {title: "${updatedTitle}"}) {
          title
        }
      }`;
      await client.request(update);

      // language=graphQL
      const query = `query {
          versionsAutosavePosts(where: { parent: { equals: "${postID}" } }) {
          docs {
            id
          }
        }
      }`;

      const response = await client.request(query);

      versionID = response.versionsAutosavePosts.docs[0].id;
      done();
    });

    it('should allow read of versions by version id', async () => {
      const query = `query {
        versionAutosavePost(id: "${versionID}") {
          id
          parent {
            id
          }
          version {
            title
          }
        }
      }`;

      const response = await client.request(query);

      const data = response.versionAutosavePost;
      versionID = data.id;

      expect(data.id).toBeDefined();
      expect(data.parent.id).toStrictEqual(postID);
      expect(data.version.title).toStrictEqual(title);
    });

    it('should allow read of versions by querying version content', async () => {
      // language=graphQL
      const query = `query {
          versionsAutosavePosts(where: { version__title: {equals: "${title}" } }) {
          docs {
            id
            parent {
            id
          }
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
      expect(doc.parent.id).toStrictEqual(postID);
      expect(doc.version.title).toStrictEqual(title);
    });
  });

  describe('Restore', () => {
    it('should allow a version to be restored', async () => {
      // update a versionsPost
      const restore = `mutation {
        restoreVersionAutosavePost(id: "${versionID}") {
          title
        }
      }`;

      await client.request(restore);

      const query = `query {
        AutosavePost(id: "${postID}") {
          title
        }
      }`;

      const response = await client.request(query);
      const data = response.AutosavePost;
      expect(data.title).toStrictEqual(title);
    });
  });
});
