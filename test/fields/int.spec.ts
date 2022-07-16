import { initPayloadTest } from '../helpers/configHelpers';
import { RESTClient } from '../helpers/rest';
import config from '../uploads/config';
import payload from '../../src';
import { pointDoc } from './collections/Point';

let client;

describe('Fields', () => {
  beforeAll(async (done) => {
    const { serverURL } = await initPayloadTest({ __dirname, init: { local: false } });
    client = new RESTClient(config, { serverURL, defaultSlug: 'point-fields' });
    await client.login();

    done();
  });

  describe('point', () => {
    let doc;

    beforeAll(async () => {
      const findDoc = await payload.find({
        collection: 'point-fields',
        pagination: false,
      });
      [doc] = findDoc.docs;
    });

    it('read', async () => {
      const find = await payload.find({
        collection: 'point-fields',
        pagination: false,
      });

      [doc] = find.docs;

      expect(doc.point).toEqual(pointDoc.point);
      expect(doc.localized).toEqual(pointDoc.localized);
      expect(doc.group).toMatchObject(pointDoc.group);
    });

    it('creates', async () => {
      const point = [7, -7];
      const localized = [5, -2];
      const group = { point: [1, 9] };
      doc = await payload.create({
        collection: 'point-fields',
        data: {
          point,
          localized,
          group,
        },
      });

      expect(doc.point).toEqual(point);
      expect(doc.localized).toEqual(localized);
      expect(doc.group).toMatchObject(group);
    });
  });
});
