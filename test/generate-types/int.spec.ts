import { initPayloadTest } from '../helpers/configHelpers';
import payload from '../../src';
import type { BookWhere } from './payload-types';

require('isomorphic-fetch');

describe('GenerateTypes', () => {
  beforeAll(async () => {
    await initPayloadTest({ __dirname, init: { local: true } });
  });

  describe('sample', () => {
    it('sample', async () => {
      await payload.find({
        collection: 'books',
        where: {
          'author': {equals: '1'},
        } as BookWhere,
      });
    });
  });
});
