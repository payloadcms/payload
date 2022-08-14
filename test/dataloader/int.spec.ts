import { GraphQLClient } from 'graphql-request';
import payload from '../../src';
import { devUser } from '../credentials';
import { initPayloadTest } from '../helpers/configHelpers';
import { postDoc } from './config';

describe('dataloader', () => {
  let serverURL;
  beforeAll(async () => {
    const init = await initPayloadTest({ __dirname, init: { local: false } });
    serverURL = init.serverURL;
  });

  describe('graphql', () => {
    let client: GraphQLClient;
    let token: string;

    beforeAll(async () => {
      const url = `${serverURL}/api/graphql`;
      client = new GraphQLClient(url);

      const loginResult = await payload.login({
        collection: 'users',
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      });

      if (loginResult.token) token = loginResult.token;
    });

    it('should allow querying via graphql', async () => {
      const query = `query {
        Posts {
          docs {
            title
            owner {
              email
            }
          }
        }
      }`;

      const response = await client.request(query, null, {
        Authorization: `JWT ${token}`,
      });

      const { docs } = response.Posts;
      expect(docs[0].title).toStrictEqual(postDoc.title);
    });
  });
});
