import { GraphQLClient } from 'graphql-request';
import { initPayloadTest } from '../helpers/configHelpers';

describe('dataloader', () => {
  let serverURL;
  beforeAll(async () => {
    const init = await initPayloadTest({ __dirname, init: { local: false } });
    serverURL = init.serverURL;
  });

  describe('graphql', () => {
    let client: GraphQLClient;
    beforeAll(async () => {
      const url = `${serverURL}/api/graphql`;
      client = new GraphQLClient(url);
    });

    it('should allow querying via graphql', async () => {
      const title = 'graphql-title';
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

      const response = await client.request(query);
      const posts = response.Posts;

      expect(posts).toMatchObject({ title });
    });
  });
});
