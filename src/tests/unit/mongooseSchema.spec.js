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

  xit('insert content block', async () => {
    const Quote = schemaLoader.contentBlocks.quote.model;

    await new Quote({
      author: 'Bob',
      quote: 'Hi there',
      color: '#ddd',
    }).save(() => {
      // not working without a callback? I don't understand
    });

    const quote = await Quote.findOne({author: 'Bob'});
    expect(quote.author).toEqual('Bob');

  });
});
