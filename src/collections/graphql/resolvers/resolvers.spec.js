/**
 * @jest-environment node
 */
import { request, GraphQLClient } from 'graphql-request';
import getConfig from '../../../config/load';
import { email, password } from '../../../mongoose/testCredentials';

require('isomorphic-fetch');

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
        ) {
          token
        }
      }`;

    const response = await request(url, query);

    token = response.loginAdmin.token;

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

    it('should query exists - true', async () => {
      const title = 'gql read';
      const description = 'description';
      const summary = 'summary';

      // language=graphQL
      const query = `mutation {
            createLocalizedPost(data: {title: "${title}", description: "${description}", summary: "${summary}", priority: 10}) {
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
  LocalizedPosts(where: { summary: { exists: true }}) {
    docs {
      id
      description
      summary
    }
  }
}`;
      const readResponse = await client.request(readQuery);
      const retrievedId = readResponse.LocalizedPosts.docs[0].id;

      expect(readResponse.LocalizedPosts.docs).toHaveLength(1);
      expect(retrievedId).toStrictEqual(id);
    });

    it('should query exists - false', async () => {
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
  LocalizedPosts(where: { summary: { exists: false }}) {
    docs {
      id
      summary
    }
  }
}`;
      const readResponse = await client.request(readQuery);
      const retrievedDoc = readResponse.LocalizedPosts.docs[0];

      expect(readResponse.LocalizedPosts.docs.length).toBeGreaterThan(0);
      expect(retrievedDoc.id).toStrictEqual(id);
      expect(retrievedDoc.summary).toBeNull();
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

  describe('Error Handler', () => {
    it('should return have an array of errors when making a bad request', async () => {
      let error;

      // language=graphQL
      const query = `query {
        LocalizedPosts(where: { summary: { exists: true }}) {
          docs {
            badFieldName
          }
        }
      }`;
      await client.request(query).catch((err) => {
        error = err;
      });
      expect(Array.isArray(error.response.errors)).toBe(true);
      expect(typeof error.response.errors[0].message).toBe('string');
    });

    it('should return have an array of errors when failing to pass validation', async () => {
      let error;
      // language=graphQL
      const query = `mutation {
          createLocalizedPost(data: {priority: 10}) {
          id
          priority
          createdAt
          updatedAt
        }
      }`;

      await client.request(query).catch((err) => {
        error = err;
      });
      expect(Array.isArray(error.response.errors)).toBe(true);
      expect(typeof error.response.errors[0].message).toBe('string');
    });
  });

  describe('Custom ID', () => {
    it('should create', async () => {
      const id = 10;
      const query = `mutation {
        createCustomID(data: {
          id: ${id},
          name: "custom"
        }) {
          id,
          name
        }
      }`;
      const response = await client.request(query);
      const data = response.createCustomID;
      expect(data.id).toStrictEqual(id);
    });

    it('should update', async () => {
      const id = 11;
      const name = 'custom name';

      const query = `
      mutation {
        createCustomID(data: {
          id: ${id},
          name: "${name}"
          }) {
          id
          name
        }
      }`;

      await client.request(query);
      const updatedName = 'updated name';

      const update = `
        mutation {
          updateCustomID(id: ${id} data: {name: "${updatedName}"}) {
          name
        }
      }`;

      const response = await client.request(update);
      const data = response.updateCustomID;

      expect(data.name).toStrictEqual(updatedName);
      expect(data.name).not.toStrictEqual(name);
    });

    it('should query on id', async () => {
      const id = 15;
      const name = 'custom name';

      const create = `mutation {
          createCustomID(data: {
          id: ${id},
          name: "${name}"
          }) {
          id
          name
        }
      }`;

      await client.request(create);

      const query = `
      query {
        CustomIDs(where: { id: { equals: ${id} } }) {
          docs {
            id
            name
          }
        }
      }`;
      const response = await client.request(query);
      const [doc] = response.CustomIDs.docs;
      expect(doc.id).toStrictEqual(id);
      expect(doc.name).toStrictEqual(name);
    });

    it('should delete', async () => {
      const id = 12;
      const query = `mutation {
          createCustomID(data: {
          id: ${id},
          name: "delete me"
          }) {
          id
          name
        }
      }`;

      await client.request(query);

      const deleteMutation = `mutation {
        deleteCustomID(id: ${id}) {
          id
        }
      }`;
      const deleteResponse = await client.request(deleteMutation);
      const deletedId = deleteResponse.deleteCustomID.id;

      expect(deletedId).toStrictEqual(id);
    });

    it('should allow relationships', async () => {
      const id = 13;
      const query = `mutation {
          createCustomID(data: {
            id: ${id},
            name: "relate me"
          }) {
            id
            name
        }
      }`;

      await client.request(query);
      const relation = `mutation {
        createRelationshipA(data: {
          customID: [ ${id} ]
        }) {
          customID {
            id
          }
        }
      }`;
      const relationResponse = await client.request(relation);
      const { customID } = relationResponse.createRelationshipA;

      expect(customID).toHaveLength(1);
      expect(customID).toHaveLength(1);
    });
  });
});
