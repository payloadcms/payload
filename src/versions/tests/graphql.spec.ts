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

describe('GrahpQL Resolvers', () => {
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
      const title = 'autosave title';
      const description = 'autosave description';

      const query = `mutation {
          createAutosavePost(data: {title: "${title}", description: "${description}"}) {
          id
          title
          description
          createdAt
          updatedAt
        }
      }`;

      const response = await client.request(query);

      const data = response.createAutosavePost;
      postID = data.id;

      expect(typeof data._status).toBe('undefined');
    });
  });

  describe('Read', () => {
    it('should allow read of autosavePost versions', async () => {
      // language=graphQL
      const query = `query {
          versionsAutosavePost(where: { parent: { equals: ${postID} } }) {
          id
          version {
            title
          }
        }
      }`;

      const response = await client.request(query);

      const data = response.versionsAutosavePost;

      versionID = data.docs[0].id;

      expect(versionID).toBeDefined();
      expect(data.docs[0].version.title).toBeDefined();
    });
  });

  // describe('Restore', () => {
  //   it('should allow a version to be restored', async () => {
  //     // update a versionsPost
  //     const query = `mutation {
  //     restoreAutosavePost {
  //       id
  //       title
  //     }`;
  //     const response = await client.request(query);
  //
  //     const data = response.versionsAutosavePost;
  //   });
  // });
});
