import { groupWithNestedRelationship, nestedRelationship, relationWithTitleSlug } from './config';
import { initPayloadTest } from '../helpers/configHelpers';
import { RESTClient } from '../helpers/rest';
import config from '../uploads/config';
import payload from '../../src';
import type { GroupNestedRelationWithTitle, NestedRelationWithTitle, RelationWithTitle } from './payload-types';

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
    let document: GroupNestedRelationWithTitle;
    let child: NestedRelationWithTitle;
    let grandChild: RelationWithTitle;

    beforeAll(async () => {
      grandChild = await payload.create<RelationWithTitle>({
        collection: relationWithTitleSlug,
        data: {
          text: 'grand child',
        },
      });
      child = await payload.create<NestedRelationWithTitle>({
        collection: groupWithNestedRelationship,
        data: {
          group: {
            relation: grandChild.id,
          },
        },
      });
      const { id } = await payload.create<GroupNestedRelationWithTitle>({
        depth: 3,
        collection: groupWithNestedRelationship,
        data: {
          group: {
            relation: child.id,
          },
        },
      });
      document = await payload.findByID<GroupNestedRelationWithTitle>({
        id,
        collection: groupWithNestedRelationship,
        depth: 9,
      });
    });

    it('relationships should populate inside of groups several levels deep', async () => {
      expect(document.group.relation.group.relation.id)
        .toStrictEqual(grandChild.id);
    });
  });
});
