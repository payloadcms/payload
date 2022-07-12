import mongoose from 'mongoose';
import { initPayloadTest } from '../../helpers/configHelpers';
import type { Post } from './config';
import config from './config';
import payload from '../../../src';
import { RESTClient } from '../../helpers/rest';
import { mapAsync } from '../../../src/utilities/mapAsync';

const slug = config.collections[0]?.slug;

let client: RESTClient;

describe('collections-rest', () => {
  beforeAll(async () => {
    const { serverURL } = await initPayloadTest({ __dirname, init: { local: false } });
    client = new RESTClient(config, { serverURL, defaultSlug: slug });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await payload.mongoMemoryServer.stop();
  });

  afterEach(async () => {
    await clearDocs();
  });

  it('should create', async () => {
    const data = {
      title: 'title',
    };
    const doc = await createPost(data);

    expect(doc).toMatchObject(data);
  });

  it('should find', async () => {
    const post1 = await createPost();
    const post2 = await createPost();
    const { status, result } = await client.find<Post>({
      slug,
    });

    expect(status).toEqual(200);
    expect(result.totalDocs).toEqual(2);
    expect(result.docs).toEqual(expect.arrayContaining([post1, post2]));
  });

  // it('should query by field value', async () => {
  //   const post1 = await createPost({ title: 'valueToQuery' });
  //   const post2 = await createPost();
  //   const { status, result } = await client.find<Post>({
  //     slug,
  //     query: {

  //     },
  //   });

  //   expect(status).toEqual(200);
  //   expect(result.totalDocs).toEqual(2);
  //   expect(result.docs).toEqual(expect.arrayContaining([post1, post2]));
  // });

  it('should find by id', async () => {
    const doc = await createPost();
    const { status, doc: retrievedDoc } = await client.findByID<Post>(slug);

    expect(status).toEqual(200);
    expect(retrievedDoc).toMatchObject(doc);
  });

  it('should update existing', async () => {
    const { id, description } = await createPost({ description: 'desc' });
    const updatedTitle = 'updated-title';

    const { status, doc: updated } = await client.update<Post>({
      id,
      slug,
      data: { title: updatedTitle },
    });

    expect(status).toEqual(200);
    expect(updated.title).toEqual(updatedTitle);
    expect(updated.description).toEqual(description); // Check was not modified
  });

  it('should delete', async () => {
    const { id } = await createPost();

    const { status, doc } = await client.delete<Post>(id);

    expect(status).toEqual(200);
    expect(doc.id).toEqual(id);
  });
});

async function createPost(overrides?: Partial<Post>) {
  const { doc } = await client.create<Post>({ slug, data: { title: 'title', ...overrides } });
  return doc;
}

async function clearDocs(): Promise<void> {
  const allDocs = await payload.find<Post>({ collection: slug, limit: 100 });
  const ids = allDocs.docs.map((doc) => doc.id);
  await mapAsync(ids, async (id) => {
    await payload.delete({ collection: slug, id });
  });
}
