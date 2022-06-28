import payload from '../..';
import getConfig from '../../config/load';
import { initPayloadTest } from '../../tests/helpers/configHelpers';

const collection = 'localized-collection';

describe('test', () => {
  beforeAll(() => {
    process.env.MEMORY_SERVER = 'true';
    initPayloadTest(__dirname);
  });

  it('should get config values', () => {
    const { serverURL: url } = getConfig();
    expect(url).toStrictEqual('http://localhost:3000');
  });

  it('should allow creation', async () => {
    const data = {
      title: 'title',
    };
    const response = await payload.create({
      collection,
      data,
    });

    expect(response).toMatchObject(data);
  });
});
