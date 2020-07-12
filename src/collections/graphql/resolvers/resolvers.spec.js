/**
 * @jest-environment node
 */

const fetch = require('isomorphic-fetch');
const { request, GraphQLClient } = require('graphql-request');
const faker = require('faker');
const config = require('../../../../demo/payload.config');
const { email, password } = require('../../../tests/credentials');

const url = `${config.serverURL}${config.routes.api}${config.routes.graphQL}`;

let client = null;
let token = null;

let localizedPostID;
// const englishPostDesc = faker.lorem.lines(2);
// const spanishPostDesc = faker.lorem.lines(2);

describe('GrahpQL Resolvers', () => {
  beforeAll(async (done) => {
    // language=GraphQL
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
      const title = faker.lorem.words(1);
      const description = faker.lorem.words(1);

      const query = `mutation {
          createLocalizedPost(data: {title: "${title}", description: "${description}", priority: 10}) {
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
      expect(data.id).not.toBeNull();
      const timestampRegex = /^(\d{4})(?:-?W(\d+)(?:-?(\d+)D?)?|(?:-(\d+))?-(\d+))(?:[T ](\d+):(\d+)(?::(\d+)(?:\.(\d+))?)?)?(?:Z(-?\d*))?$/;
      expect(data.doc.createdAt).toStrictEqual(expect.stringMatching(timestampRegex));
      expect(data.doc.updatedAt).toStrictEqual(expect.stringMatching(timestampRegex));

      localizedPostID = data.id;
    });
  });
});
