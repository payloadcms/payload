import SchemaLoader from '../../mongoose/schema/schemaLoader';
import config from '../../../demo/payload.config';

let schemaLoader;

describe('schemaLoader', () => {

  beforeAll(async () => {
    schemaLoader = new SchemaLoader(config);
    console.log('before done');
  });

  it('load collections', async () => {
    expect(schemaLoader.collections).not.toBeNull();
  });

  it('load globals', async () => {
    expect(schemaLoader.globalModel).not.toBeNull();
    expect(schemaLoader.globals).not.toBeNull();
  });

  it('load blocks', async () => {
    expect(schemaLoader.blockSchema).not.toBeNull();
    expect(schemaLoader.contentBlocks).not.toBeNull();
  });
});
