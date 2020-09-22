/**
 * @jest-environment node
 */
// eslint-disable-next-line no-unused-vars
const fetch = require('isomorphic-fetch');
const { request, GraphQLClient } = require('graphql-request');
const getConfig = require('../../../utilities/getConfig');
const { email, password } = require('../../../tests/credentials');

const config = getConfig();

const url = `${config.serverURL}${config.routes.api}${config.routes.graphQL}`;

let client = null;
let token = null;

describe('GrahpQL Resolvers', () => {
  beforeAll(async (done) => {
    const query = `
      mutation {
        loginAdmin(
          email: "${email}",
          password: "${password}"
        )
      }`;

    const response = await request(url, query);

    token = response.loginAdmin;

    client = new GraphQLClient(url, { headers: { Authorization: `JWT ${token}` } });

    done();
  });

  describe('Create', () => {
    it('should allow a localized post to be created', async () => {
      const title = 'gql create';
      const description = 'description';

      // language=graphQL
      const query = `mutation {
          createLocalizedPost(data: {title: "${title}", description: "${description}", priority: 10}) {
          id
          title
          description
          priority
          createdAt
          updatedAt
        }
      }`;

      const response = await client.request(query);

      const data = response.createLocalizedPost;

      expect(data.title).toBe(title);
      expect(data.id).toStrictEqual(expect.any(String));
      // const timestampRegex = /^(\d{4})(?:-?W(\d+)(?:-?(\d+)D?)?|(?:-(\d+))?-(\d+))(?:[T ](\d+):(\d+)(?::(\d+)(?:\.(\d+))?)?)?(?:Z(-?\d*))?$/;
      // expect(data.createdAt).toStrictEqual(expect.stringMatching(timestampRegex));
      // expect(data.updatedAt).toStrictEqual(expect.stringMatching(timestampRegex));
      expect(data.createdAt).toStrictEqual(expect.any(String));
      expect(data.updatedAt).toStrictEqual(expect.any(String));
    });
  });

  describe('Read', () => {
    it('should be able to read localized post', async () => {
      const title = 'gql read';
      const description = 'description';

      // language=graphQL
      const query = `mutation {
            createLocalizedPost(data: {title: "${title}", description: "${description}", priority: 10}) {
            id
            title
            description
            priority
            createdAt
            updatedAt
          }
        }`;

      const response = await client.request(query);

      const { id } = response.createLocalizedPost;
      // language=graphQL
      const readQuery = `query {
        LocalizedPost(id: "${id}") {
          id
        }
      }`;
      const readResponse = await client.request(readQuery);
      const retrievedId = readResponse.LocalizedPost.id;

      expect(retrievedId).toStrictEqual(id);
    });
  });

  describe('Update', () => {
    it('should allow updating an existing post', async () => {
      const title = 'gql update';
      const description = 'description';

      // language=graphQL
      const query = `mutation {
          createLocalizedPost(data: { title: "${title}", description: "${description}", priority: 10}) {
          id
          title
          description
          priority
        }
      }`;

      const createResponse = await client.request(query);

      const createData = createResponse.createLocalizedPost;
      const { id } = createData;
      const updatedDesc = 'updated description';

      // language=graphQL
      const update = `
      mutation {
        updateLocalizedPost(id: "${id}" data: {description: "${updatedDesc}"}) {
        description
      }
      }`;

      const response = await client.request(update);
      const data = response.updateLocalizedPost;

      expect(data.description).toBe(updatedDesc);
    });
  });

  describe('Delete', () => {
    it('should be able to delete a localized post', async () => {
      const title = 'gql delete';
      const description = 'description';

      // language=graphQL
      const query = `mutation {
            createLocalizedPost(data: {title: "${title}", description: "${description}", priority: 10}) {
            id
            title
            description
            priority
            createdAt
            updatedAt
          }
        }`;

      const response = await client.request(query);

      const { id } = response.createLocalizedPost;
      // language=graphQL
      const deleteMutation = `mutation {
        deleteLocalizedPost(id: "${id}") {
          id
        }
      }`;
      const deleteResponse = await client.request(deleteMutation);
      const deletedId = deleteResponse.deleteLocalizedPost.id;

      expect(deletedId).toStrictEqual(id);
    });
  });
});
