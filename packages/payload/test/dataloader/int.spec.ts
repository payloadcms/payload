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

    it('should avoid infinite loops', async () => {
      const relationA = await payload.create({
        collection: 'relation-a',
        data: {
          richText: [
            {
              children: [
                {
                  text: 'relation a',
                },
              ],
            },
          ],
        },
      });

      const relationB = await payload.create({
        collection: 'relation-b',
        data: {
          relationship: relationA.id,
          richText: [
            {
              children: [
                {
                  text: 'relation b',
                },
              ],
            },
          ],
        },
      });

      expect(relationA.id).toBeDefined();
      expect(relationB.id).toBeDefined();

      await payload.update({
        collection: 'relation-a',
        id: relationA.id,
        data: {
          relationship: relationB.id,
          richText: [
            {
              children: [
                {
                  text: 'relation a',
                },
              ],
            },
            {
              children: [
                {
                  text: '',
                },
              ],
              type: 'relationship',
              value: {
                id: relationB.id,
              },
              relationTo: 'relation-b',
            },
          ],
        },
      });

      const relationANoDepth = await payload.findByID({
        collection: 'relation-a',
        id: relationA.id,
        depth: 0,
      });

      expect(relationANoDepth.relationship).toStrictEqual(relationB.id);

      const relationAWithDepth = await payload.findByID({
        collection: 'relation-a',
        id: relationA.id,
        depth: 4,
      });

      const innerMostRelationship = relationAWithDepth.relationship.relationship.richText[1].value.relationship.relationship;

      expect(innerMostRelationship).toStrictEqual(relationB.id);
    });
  });
});
