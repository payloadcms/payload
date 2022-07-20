import { nestedRelationship, relationOneSlug } from './config';
import { initPayloadTest } from '../helpers/configHelpers';
import { RESTClient } from '../helpers/rest';
import config from '../uploads/config';
import payload from '../../src';
import type { RelationWithTitle } from './payload-types';

let client;

describe('fields-relationship', () => {
  beforeAll(async (done) => {
    const { serverURL } = await initPayloadTest({
      __dirname,
      init: { local: false },
    });
    client = new RESTClient(config, {
      serverURL,
      defaultSlug: nestedRelationship,
    });
    await client.login();

    done();
  });

  describe('relationships within groups', () => {
    it('relationships should populate inside of groups several levels deep', async () => {
      const name = 'the name';
      const relation = await payload.create<RelationWithTitle>({
        collection: relationOneSlug,
        data: {
          name,
        },
      });
      const document = await payload.create({
        depth: 3,
        collection: nestedRelationship,
        data: {
          group: {
            subGroup: {
              relation: relation.id,
            },
          },
        },
      });

      expect(document.group.subGroup.relation.name)
        .toStrictEqual(name);
    });
  });
});
