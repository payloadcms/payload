import SchemaLoader from '../../mongoose/schema/schemaLoader';
import config from '../../../demo/payload.config';

let schemaLoader;

describe('schemaLoader', () => {

  beforeAll(() => {
    schemaLoader = new SchemaLoader(config);
  });

  it('load collections', () => {
    expect(schemaLoader.collections).not.toBeNull();
  });

  it('load globals', () => {
    expect(schemaLoader.globalModel).not.toBeNull();
    expect(schemaLoader.globals).not.toBeNull();
  });

  it('load blocks', () => {
    expect(schemaLoader.blockSchema).not.toBeNull();
    expect(schemaLoader.contentBlocks).not.toBeNull();
  });
});
