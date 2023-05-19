import mongoose from 'mongoose';
import { log } from 'console';
import payload from '../../src';
import { initPayloadTest } from '../helpers/configHelpers';
import { devUser } from '../credentials';
import { postsSlug } from './collections/Posts';

require('isomorphic-fetch');

let apiUrl;
let jwt;

const headers = {
  'Content-Type': 'application/json',
};
const { email, password } = devUser;
describe('_Community Tests', () => {
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  beforeAll(async () => {
    const { serverURL } = await initPayloadTest({ __dirname, init: { local: false } });
    apiUrl = `${serverURL}/api`;

    const response = await fetch(`${apiUrl}/users/login`, {
      body: JSON.stringify({
        email,
        password,
      }),
      headers,
      method: 'post',
    });

    const data = await response.json();
    jwt = data.token;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await payload.mongoMemoryServer.stop();
  });

  describe('GRAPHQL', () => {
    it('should query testGroup__textInRowInGroup', async () => {
      const gqlQuery = await fetch(`${apiUrl}/graphql`, {
        method: 'POST',
        headers: {
          ...headers,
          Authorization: `JWT ${jwt}`,
        },
        body: JSON.stringify({
          operationName: null,
          variables: {},
          query: '{\n  Posts(where: {testGroup__textInRowInGroup: {equals: "textInRowInGroup"}}) {\n    totalDocs\n    docs {\n      id\n      testGroup {\n        textInRowInGroup\n        textInGroup\n      }\n      text\n      textInRow\n    }\n  }\n}\n',
        }),
      }).then((res) => res.json());

      expect(gqlQuery.data.Posts.totalDocs).toBeGreaterThan(0);
    });
  });
  describe('REST', () => {
    it('should query testGroup.textInRowInGroup', async () => {
      const restQuery = await fetch(`${apiUrl}/posts?where[testGroup.textInRowInGroup][equals]=textInRowInGroup`, {
        method: 'GET',
        headers: {
          ...headers,
          Authorization: `JWT ${jwt}`,
        },
      }).then((res) => res.json());

      expect(restQuery.totalDocs).toBeGreaterThan(0);
    });
  });
});
