import mongoose from 'mongoose';
import { randomBytes } from 'crypto';
import { initPayloadTest } from '../helpers/configHelpers';
import type { Relation } from './config';
import config, { customIdNumberSlug, customIdSlug, slug, relationSlug, pointSlug } from './config';
import payload from '../../src';
import { RESTClient } from '../helpers/rest';
import type { Post } from './payload-types';
import { mapAsync } from '../../src/utilities/mapAsync';

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

  beforeEach(async () => {
    await clearDocs();
  });

  describe('CRUD', () => {
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
      const { status, result } = await client.find<Post>();

      expect(status).toEqual(200);
      expect(result.totalDocs).toEqual(2);
      const expectedDocs = [post1, post2];
      expect(result.docs).toHaveLength(expectedDocs.length);
      expect(result.docs).toEqual(expect.arrayContaining(expectedDocs));
    });

    it('should update existing', async () => {
      const { id, description } = await createPost({ description: 'desc' });
      const updatedTitle = 'updated-title';

      const { status, doc: updated } = await client.update<Post>({
        id,
        data: { title: updatedTitle },
      });

      expect(status).toEqual(200);
      expect(updated.title).toEqual(updatedTitle);
      expect(updated.description).toEqual(description); // Check was not modified
    });

    describe('Custom ID', () => {
      describe('string', () => {
        it('should create', async () => {
          const customId = `custom-${randomBytes(32).toString('hex').slice(0, 12)}`;
          const customIdName = 'custom-id-name';
          const { doc } = await client.create({ slug: customIdSlug, data: { id: customId, name: customIdName } });
          expect(doc.id).toEqual(customId);
          expect(doc.name).toEqual(customIdName);
        });

        it('should find', async () => {
          const customId = `custom-${randomBytes(32).toString('hex').slice(0, 12)}`;
          const { doc } = await client.create({ slug: customIdSlug, data: { id: customId, name: 'custom-id-name' } });
          const { doc: foundDoc } = await client.findByID({ slug: customIdSlug, id: customId });

          expect(foundDoc.id).toEqual(doc.id);
        });

        it('should update', async () => {
          const customId = `custom-${randomBytes(32).toString('hex').slice(0, 12)}`;
          const { doc } = await client.create({ slug: customIdSlug, data: { id: customId, data: { name: 'custom-id-name' } } });
          const { doc: updatedDoc } = await client.update({ slug: customIdSlug, id: doc.id, data: { name: 'updated' } });
          expect(updatedDoc.name).toEqual('updated');
        });
      });

      describe('number', () => {
        it('should create', async () => {
          const customId = Math.floor(Math.random() * (1_000_000)) + 1;
          const { doc } = await client.create({ slug: customIdNumberSlug, data: { id: customId, name: 'custom-id-number-name' } });
          expect(doc.id).toEqual(customId);
        });

        it('should find', async () => {
          const customId = Math.floor(Math.random() * (1_000_000)) + 1;
          const { doc } = await client.create({ slug: customIdNumberSlug, data: { id: customId, name: 'custom-id-number-name' } });
          const { doc: foundDoc } = await client.findByID({ slug: customIdNumberSlug, id: customId });
          expect(foundDoc.id).toEqual(doc.id);
        });

        it('should update', async () => {
          const customId = Math.floor(Math.random() * (1_000_000)) + 1;
          const { doc } = await client.create({ slug: customIdNumberSlug, data: { id: customId, name: 'custom-id-number-name' } });
          const { doc: updatedDoc } = await client.update({ slug: customIdNumberSlug, id: doc.id, data: { name: 'updated' } });
          expect(updatedDoc.name).toEqual('updated');
        });
      });
    });

    it('should delete', async () => {
      const { id } = await createPost();

      const { status, doc } = await client.delete<Post>(id);

      expect(status).toEqual(200);
      expect(doc.id).toEqual(id);
    });

    it('should include metadata', async () => {
      await createPosts(11);

      const { result } = await client.find<Post>();

      expect(result.totalDocs).toBeGreaterThan(0);
      expect(result.limit).toBe(10);
      expect(result.page).toBe(1);
      expect(result.pagingCounter).toBe(1);
      expect(result.hasPrevPage).toBe(false);
      expect(result.hasNextPage).toBe(true);
      expect(result.prevPage).toBeNull();
      expect(result.nextPage).toBe(2);
    });
  });

  describe('Querying', () => {
    it.todo('should allow querying by a field within a group');
    describe('Relationships', () => {
      let post: Post;
      let relation: Relation;
      let relation2: Relation;
      const nameToQuery = 'name';
      const nameToQuery2 = 'name2';

      beforeEach(async () => {
        ({ doc: relation } = await client.create<Relation>({
          slug: relationSlug,
          data: {
            name: nameToQuery,
          },
        }));

        ({ doc: relation2 } = await client.create<Relation>({
          slug: relationSlug,
          data: {
            name: nameToQuery2,
          },
        }));

        post = await createPost({
          relationField: relation.id,
        });

        await createPost(); // Extra post to allow asserting totalDoc count
      });

      describe('regular relationship', () => {
        it('query by property value', async () => {
          const { status, result } = await client.find<Post>({
            query: {
              'relationField.name': {
                equals: relation.name,
              },
            },
          });

          expect(status).toEqual(200);
          expect(result.docs).toEqual([post]);
          expect(result.totalDocs).toEqual(1);
        });

        it('query by id', async () => {
          const { status, result } = await client.find<Post>({
            query: {
              relationField: {
                equals: relation.id,
              },
            },
          });

          expect(status).toEqual(200);
          expect(result.docs).toEqual([post]);
          expect(result.totalDocs).toEqual(1);
        });
      });

      it('should query nested relationship - hasMany', async () => {
        const post1 = await createPost({
          relationHasManyField: [relation.id, relation2.id],
        });

        const { status, result } = await client.find<Post>({
          query: {
            'relationHasManyField.name': {
              equals: relation.name,
            },
          },
        });

        expect(status).toEqual(200);
        expect(result.docs).toEqual([post1]);
        expect(result.totalDocs).toEqual(1);

        // Query second relationship
        const { status: status2, result: result2 } = await client.find<Post>({
          query: {
            'relationHasManyField.name': {
              equals: relation2.name,
            },
          },
        });

        expect(status2).toEqual(200);
        expect(result2.docs).toEqual([post1]);
        expect(result2.totalDocs).toEqual(1);
      });

      describe('relationTo multi', () => {
        it('nested by id', async () => {
          const post1 = await createPost({
            relationMultiRelationTo: { relationTo: relationSlug, value: relation.id },
          });
          await createPost();

          const { status, result } = await client.find<Post>({
            query: {
              'relationMultiRelationTo.value': {
                equals: relation.id,
              },
            },
          });

          expect(status).toEqual(200);
          expect(result.docs).toEqual([post1]);
          expect(result.totalDocs).toEqual(1);
        });

        it.todo('nested by property value');
      });

      describe('relationTo multi hasMany', () => {
        it('nested by id', async () => {
          const post1 = await createPost({
            relationMultiRelationToHasMany: [
              { relationTo: relationSlug, value: relation.id },
              { relationTo: relationSlug, value: relation2.id },
            ],
          });
          await createPost();

          const { status, result } = await client.find<Post>({
            query: {
              'relationMultiRelationToHasMany.value': {
                equals: relation.id,
              },
            },
          });

          expect(status).toEqual(200);
          expect(result.docs).toEqual([post1]);
          expect(result.totalDocs).toEqual(1);

          // Query second relation
          const { status: status2, result: result2 } = await client.find<Post>({
            query: {
              'relationMultiRelationToHasMany.value': {
                equals: relation.id,
              },
            },
          });

          expect(status2).toEqual(200);
          expect(result2.docs).toEqual([post1]);
          expect(result2.totalDocs).toEqual(1);
        });

        it.todo('nested by property value');
      });
    });

    describe('Operators', () => {
      it('equals', async () => {
        const valueToQuery = 'valueToQuery';
        const post1 = await createPost({ title: valueToQuery });
        await createPost();
        const { status, result } = await client.find<Post>({
          query: {
            title: {
              equals: valueToQuery,
            },
          },
        });

        expect(status).toEqual(200);
        expect(result.totalDocs).toEqual(1);
        expect(result.docs).toEqual([post1]);
      });

      it('not_equals', async () => {
        const post1 = await createPost({ title: 'not-equals' });
        const post2 = await createPost();
        const { status, result } = await client.find<Post>({
          query: {
            title: {
              not_equals: post1.title,
            },
          },
        });

        expect(status).toEqual(200);
        expect(result.totalDocs).toEqual(1);
        expect(result.docs).toEqual([post2]);
      });

      it('in', async () => {
        const post1 = await createPost({ title: 'my-title' });
        await createPost();
        const { status, result } = await client.find<Post>({
          query: {
            title: {
              in: [post1.title],
            },
          },
        });

        expect(status).toEqual(200);
        expect(result.docs).toEqual([post1]);
        expect(result.totalDocs).toEqual(1);
      });

      it('not_in', async () => {
        const post1 = await createPost({ title: 'not-me' });
        const post2 = await createPost();
        const { status, result } = await client.find<Post>({
          query: {
            title: {
              not_in: [post1.title],
            },
          },
        });

        expect(status).toEqual(200);
        expect(result.docs).toEqual([post2]);
        expect(result.totalDocs).toEqual(1);
      });

      it('like', async () => {
        const post1 = await createPost({ title: 'prefix-value' });

        const { status, result } = await client.find<Post>({
          query: {
            title: {
              like: post1.title?.substring(0, 6),
            },
          },
        });

        expect(status).toEqual(200);
        expect(result.docs).toEqual([post1]);
        expect(result.totalDocs).toEqual(1);
      });


      describe('like - special characters', () => {
        const specialCharacters = '~!@#$%^&*()_+-+[]{}|;:"<>,.?/})';

        it.each(specialCharacters.split(''))('like - special characters - %s', async (character) => {
          const post1 = await createPost({
            title: specialCharacters,
          });

          const query = {
            query: {
              title: {
                like: character,
              },
            },
          };

          const { status, result } = await client.find<Post>(query);

          expect(status).toEqual(200);
          expect(result.docs).toEqual([post1]);
          expect(result.totalDocs).toEqual(1);
        });
      });

      it('like - cyrillic characters', async () => {
        const post1 = await createPost({ title: 'Тест' });

        const { status, result } = await client.find<Post>({
          query: {
            title: {
              like: 'Тест',
            },
          },
        });

        expect(status).toEqual(200);
        expect(result.docs).toEqual([post1]);
        expect(result.totalDocs).toEqual(1);
      });

      it('like - partial word match', async () => {
        const post = await createPost({ title: 'separate words should partially match' });

        const { status, result } = await client.find<Post>({
          query: {
            title: {
              like: 'words partial',
            },
          },
        });

        expect(status).toEqual(200);
        expect(result.docs).toEqual([post]);
        expect(result.totalDocs).toEqual(1);
      });

      it('exists - true', async () => {
        const postWithDesc = await createPost({ description: 'exists' });
        await createPost({ description: undefined });
        const { status, result } = await client.find<Post>({
          query: {
            description: {
              exists: true,
            },
          },
        });

        expect(status).toEqual(200);
        expect(result.totalDocs).toEqual(1);
        expect(result.docs).toEqual([postWithDesc]);
      });

      it('exists - false', async () => {
        const postWithoutDesc = await createPost({ description: undefined });
        await createPost({ description: 'exists' });
        const { status, result } = await client.find<Post>({
          query: {
            description: {
              exists: false,
            },
          },
        });

        expect(status).toEqual(200);
        expect(result.totalDocs).toEqual(1);
        expect(result.docs).toEqual([postWithoutDesc]);
      });

      describe('numbers', () => {
        let post1: Post;
        let post2: Post;
        beforeEach(async () => {
          post1 = await createPost({ number: 1 });
          post2 = await createPost({ number: 2 });
        });

        it('greater_than', async () => {
          const { status, result } = await client.find<Post>({
            query: {
              number: {
                greater_than: 1,
              },
            },
          });

          expect(status).toEqual(200);
          expect(result.totalDocs).toEqual(1);
          expect(result.docs).toEqual([post2]);
        });

        it('greater_than_equal', async () => {
          const { status, result } = await client.find<Post>({
            query: {
              number: {
                greater_than_equal: 1,
              },
            },
          });

          expect(status).toEqual(200);
          expect(result.totalDocs).toEqual(2);
          const expectedDocs = [post1, post2];
          expect(result.docs).toHaveLength(expectedDocs.length);
          expect(result.docs).toEqual(expect.arrayContaining(expectedDocs));
        });

        it('less_than', async () => {
          const { status, result } = await client.find<Post>({
            query: {
              number: {
                less_than: 2,
              },
            },
          });

          expect(status).toEqual(200);
          expect(result.totalDocs).toEqual(1);
          expect(result.docs).toEqual([post1]);
        });

        it('less_than_equal', async () => {
          const { status, result } = await client.find<Post>({
            query: {
              number: {
                less_than_equal: 2,
              },
            },
          });

          expect(status).toEqual(200);
          expect(result.totalDocs).toEqual(2);
          const expectedDocs = [post1, post2];
          expect(result.docs).toHaveLength(expectedDocs.length);
          expect(result.docs).toEqual(expect.arrayContaining(expectedDocs));
        });
      });

      describe('near', () => {
        const point = [10, 20];
        const [lat, lng] = point;
        it('should return a document near a point', async () => {
          const near = `${lat + 0.01}, ${lng + 0.01}, 10000`;
          const { status, result } = await client.find({
            slug: pointSlug,
            query: {
              point: {
                near,
              },
            },
          });

          expect(status).toEqual(200);
          expect(result.docs).toHaveLength(1);
        });

        it('should not return a point far away', async () => {
          const near = `${lng + 1}, ${lat - 1}, 5000`;
          const { status, result } = await client.find({
            slug: pointSlug,
            query: {
              point: {
                near,
              },
            },
          });

          expect(status).toEqual(200);
          expect(result.docs).toHaveLength(0);
        });
      });

      it('or', async () => {
        const post1 = await createPost({ title: 'post1' });
        const post2 = await createPost({ title: 'post2' });
        await createPost();

        const { status, result } = await client.find<Post>({
          query: {
            or: [
              {
                title: {
                  equals: post1.title,
                },
              },
              {
                title: {
                  equals: post2.title,
                },
              },
            ],
          },
        });

        expect(status).toEqual(200);
        const expectedDocs = [post1, post2];
        expect(result.totalDocs).toEqual(expectedDocs.length);
        expect(result.docs).toEqual(expect.arrayContaining(expectedDocs));
      });

      it('or - 1 result', async () => {
        const post1 = await createPost({ title: 'post1' });
        await createPost();

        const { status, result } = await client.find<Post>({
          query: {
            or: [
              {
                title: {
                  equals: post1.title,
                },
              },
              {
                title: {
                  equals: 'non-existent',
                },
              },
            ],
          },
        });

        expect(status).toEqual(200);
        const expectedDocs = [post1];
        expect(result.totalDocs).toEqual(expectedDocs.length);
        expect(result.docs).toEqual(expect.arrayContaining(expectedDocs));
      });

      it('and', async () => {
        const description = 'description';
        const post1 = await createPost({ title: 'post1', description });
        await createPost({ title: 'post2', description }); // Diff title, same desc
        await createPost();

        const { status, result } = await client.find<Post>({
          query: {
            and: [
              {
                title: {
                  equals: post1.title,
                },
              },
              {
                description: {
                  equals: description,
                },
              },
            ],
          },
        });

        expect(status).toEqual(200);
        expect(result.totalDocs).toEqual(1);
        expect(result.docs).toEqual([post1]);
      });

      describe('every - select', () => {
        let post1: Post;
        let post2: Post;
        let post3: Post;

        beforeEach(async () => {
          post1 = await createPost({ title: 'post1', multiSelect: ['option1', 'option2'] });
          post2 = await createPost({ title: 'post2', multiSelect: ['option1'] });
          post3 = await createPost({ title: 'post3', multiSelect: ['option3'] });
          await createPost({ title: 'post4', multiSelect: ['option1', 'option2', 'option3'] });
        });

        it('every_in', async () => {
          const filterOptions = ['option1', 'option2'];

          const { status, result } = await client.find<Post>({
            slug: 'posts',
            query: {
              multiSelect: {
                every_in: filterOptions,
              },
            },
          });

          expect(status).toEqual(200);
          expect(result.totalDocs).toEqual(2);
          expect(result.docs).toContainEqual(post1);
          expect(result.docs).toContainEqual(post2);
        });

        it('every_not_in', async () => {
          const filterOptions = ['option2'];

          const { status, result } = await client.find<Post>({
            slug: 'posts',
            query: {
              multiSelect: {
                every_not_in: filterOptions,
              },
            },
          });

          expect(status).toEqual(200);
          expect(result.totalDocs).toEqual(2);
          expect(result.docs).toContainEqual(post2);
          expect(result.docs).toContainEqual(post3);
        });

        it('every_equals', async () => {
          const filterOptions = 'option1';

          const { status, result } = await client.find<Post>({
            slug: 'posts',
            query: {
              multiSelect: {
                every_equals: filterOptions,
              },
            },
          });

          expect(status).toEqual(200);
          expect(result.totalDocs).toEqual(1);
          expect(result.docs).toContainEqual(post2);
        });

        it('every_not_equals', async () => {
          const filterOptions = 'option1';

          const { status, result } = await client.find<Post>({
            slug: 'posts',
            query: {
              multiSelect: {
                every_not_equals: filterOptions,
              },
            },
          });

          expect(status).toEqual(200);
          expect(result.totalDocs).toEqual(1);
          expect(result.docs).toContainEqual(post3);
        });
      });

      describe('every - relationship', () => {
        let post2: Post;
        let post3: Post;
        let post4: Post;
        let rel1: Relation;
        let rel2: Relation;
        let rel3: Relation;

        beforeEach(async () => {
          rel1 = await createRelation({ name: 're1' });
          rel2 = await createRelation({ name: 're2' });
          rel3 = await createRelation({ name: 're3' });

          await createPost({ title: 'post1', relationHasManyField: [rel1.id, rel2.id, rel3.id] });
          post2 = await createPost({ title: 'post2', relationHasManyField: [rel1.id, rel2.id] });
          post3 = await createPost({ title: 'post3', relationHasManyField: [rel1.id] });
          post4 = await createPost({ title: 'post4', relationHasManyField: [] });
        });

        it('every_in', async () => {
          const filterOptions = [rel1.id, rel2.id];

          const { status, result } = await client.find<Post>({
            slug: 'posts',
            query: {
              relationHasManyField: {
                every_in: filterOptions,
              },
            },
          });

          expect(status).toEqual(200);
          expect(result.totalDocs).toEqual(3);
          expect(result.docs).toContainEqual(post2);
          expect(result.docs).toContainEqual(post3);
          expect(result.docs).toContainEqual(post4);
        });

        it('every_not_in', async () => {
          const filterOptions = [rel2.id];

          const { status, result } = await client.find<Post>({
            slug: 'posts',
            query: {
              relationHasManyField: {
                every_not_in: filterOptions,
              },
            },
          });

          expect(status).toEqual(200);
          expect(result.totalDocs).toEqual(2);
          expect(result.docs).toContainEqual(post3);
          expect(result.docs).toContainEqual(post4);
        });

        it('every_equals', async () => {
          const filterOptions = rel1.id;

          const { status, result } = await client.find<Post>({
            slug: 'posts',
            query: {
              relationHasManyField: {
                every_equals: filterOptions,
              },
            },
          });

          expect(status).toEqual(200);
          expect(result.totalDocs).toEqual(2);
          expect(result.docs).toContainEqual(post3);
          expect(result.docs).toContainEqual(post4);
        });

        it('every_not_equals', async () => {
          const filterOptions = rel3.id;

          const { status, result } = await client.find<Post>({
            slug: 'posts',
            query: {
              relationHasManyField: {
                every_not_equals: filterOptions,
              },
            },
          });

          expect(status).toEqual(200);
          expect(result.totalDocs).toEqual(3);
          expect(result.docs).toContainEqual(post2);
          expect(result.docs).toContainEqual(post3);
          expect(result.docs).toContainEqual(post4);
        });
      });

      describe('limit', () => {
        beforeEach(async () => {
          await mapAsync([...Array(50)], async (_, i) => createPost({ title: 'limit-test', number: i }));
        });

        it('should query a limited set of docs', async () => {
          const { status, result } = await client.find<Post>({
            limit: 15,
            query: {
              title: {
                equals: 'limit-test',
              },
            },
          });

          expect(status).toEqual(200);
          expect(result.docs).toHaveLength(15);
        });

        it('should query all docs when limit=0', async () => {
          const { status, result } = await client.find<Post>({
            limit: 0,
            query: {
              title: {
                equals: 'limit-test',
              },
            },
          });

          expect(status).toEqual(200);
          expect(result.totalDocs).toEqual(50);
        });
      });
    });
  });
});

async function createPost(overrides?: Partial<Post>) {
  const { doc } = await client.create<Post>({ data: { title: 'title', ...overrides } });
  return doc;
}

async function createRelation(overrides?: Partial<Relation>) {
  const { doc } = await client.create<Relation>({ slug: 'relation', data: { name: 'name', ...overrides } });
  return doc;
}

async function createPosts(count: number) {
  await mapAsync([...Array(count)], async () => {
    await createPost();
  });
}

async function clearDocs(): Promise<void> {
  const allDocs = await payload.find<Post>({ collection: slug, limit: 100 });
  const ids = allDocs.docs.map((doc) => doc.id);
  await mapAsync(ids, async (id) => {
    await payload.delete({ collection: slug, id });
  });
}
