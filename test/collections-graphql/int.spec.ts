import mongoose from 'mongoose';
import { GraphQLClient } from 'graphql-request';
import { initPayloadTest } from '../helpers/configHelpers';
import config from './config';
import payload from '../../src';
import type { Post, Relation } from './payload-types';

const slug = config.collections[0]?.slug;
const title = 'title';

let client: GraphQLClient;

describe('collections-graphql', () => {
  beforeAll(async () => {
    const { serverURL } = await initPayloadTest({ __dirname, init: { local: false } });
    const url = `${serverURL}${config.routes.api}${config.routes.graphQL}`;
    client = new GraphQLClient(url);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await payload.mongoMemoryServer.stop();
  });

  describe('CRUD', () => {
    let existingDoc: Post;

    beforeEach(async () => {
      existingDoc = await createPost();
    });

    it('should create', async () => {
      const query = `mutation {
          createPost(data: {title: "${title}"}) {
          id
          title
        }
      }`;
      const response = await client.request(query);
      const doc: Post = response.createPost;

      expect(doc).toMatchObject({ title });
      expect(doc.id.length).toBeGreaterThan(0);
    });

    it('should read', async () => {
      const query = `query {
        Post(id: "${existingDoc.id}") {
          id
          title
        }
      }`;
      const response = await client.request(query);
      const doc: Post = response.Post;

      expect(doc).toMatchObject({ id: existingDoc.id, title });
    });

    it('should find', async () => {
      const query = `query {
        Posts {
          docs {
            id
            title
          }
        }
      }`;
      const response = await client.request(query);
      const { docs } = response.Posts;

      expect(docs).toContainEqual(expect.objectContaining({ id: existingDoc.id }));
    });

    it('should update existing', async () => {
      const updatedTitle = 'updated title';

      const query = `mutation {
        updatePost(id: "${existingDoc.id}", data: { title: "${updatedTitle}"}) {
          id
          title
        }
      }`;
      const response = await client.request(query);
      const doc: Post = response.updatePost;

      expect(doc).toMatchObject({ id: existingDoc.id, title: updatedTitle });
    });

    it('should delete', async () => {
      const query = `mutation {
        deletePost(id: "${existingDoc.id}") {
          id
          title
        }
      }`;
      const response = await client.request(query);
      const doc: Post = response.deletePost;

      expect(doc).toMatchObject({ id: existingDoc.id });
    });
  });

  describe('Querying', () => {
    describe('Operators', () => {
      let post1: Post;
      let post2: Post;

      beforeEach(async () => {
        post1 = await createPost({ title: 'post1' });
        post2 = await createPost({ title: 'post2' });
      });

      it('equals', async () => {
        const query = `query {
        Posts(where:{title: {equals:"${post1.title}"}}) {
          docs {
            id
            title
          }
        }
      }`;

        const response = await client.request(query);
        const { docs } = response.Posts;

        expect(docs).toContainEqual(expect.objectContaining({ id: post1.id, title: post1.title }));
      });

      it('not_equals', async () => {
        const query = `query {
        Posts(where:{title: {not_equals:"${post1.title}"}}) {
          docs {
            id
            title
          }
        }
      }`;

        const response = await client.request(query);
        const { docs } = response.Posts;

        expect(docs[0]).toMatchObject({ id: post2.id, title: post2.title });
      });

      it('like', async () => {
        const postWithWords = await createPost({ title: 'the quick brown fox' });
        const query = `query {
        Posts(where:{title: {like:"${postWithWords.title?.split(' ')[1]}"}}) {
          docs {
            id
            title
          }
        }
      }`;

        const response = await client.request(query);
        const { docs } = response.Posts;

        expect(docs[0]).toMatchObject({ id: postWithWords.id, title: postWithWords.title });
      });

      it('contains', async () => {
        const query = `query {
        Posts(where:{title: {contains:"${post1.title?.slice(0, 4)}"}}) {
          docs {
            id
            title
          }
        }
      }`;

        const response = await client.request(query);
        const { docs } = response.Posts;

        expect(docs).toContainEqual(expect.objectContaining({ id: post1.id, title: post1.title }));
        expect(docs).toContainEqual(expect.objectContaining({ id: post2.id, title: post2.title }));
      });

      it('exists - true', async () => {
        const withDescription = await createPost({ description: 'description' });
        const query = `query {
        Posts(where:{description: {exists:true}}) {
          docs {
            id
            title
          }
        }
      }`;

        const response = await client.request(query);
        const { docs } = response.Posts;

        expect(docs).toContainEqual(expect.objectContaining({ id: withDescription.id, title: withDescription.title }));
      });

      it('exists - false', async () => {
        const withDescription = await createPost({ description: 'description' });
        const query = `query {
        Posts(where:{description: {exists:false}}) {
          docs {
            id
            title
          }
        }
      }`;

        const response = await client.request(query);
        const { docs } = response.Posts;

        expect(docs).not.toContainEqual(expect.objectContaining({ id: withDescription.id }));
        expect(docs).toContainEqual(expect.objectContaining({ id: post1.id }));
      });

      describe('numbers', () => {
        let numPost1: Post;
        let numPost2: Post;

        beforeEach(async () => {
          numPost1 = await createPost({ number: 1 });
          numPost2 = await createPost({ number: 2 });
        });

        it('greater_than', async () => {
          const query = `query {
          Posts(where:{number: {greater_than:1}}) {
            docs {
              id
              title
            }
          }
        }`;

          const response = await client.request(query);
          const { docs } = response.Posts;

          expect(docs).toContainEqual(expect.objectContaining({ id: numPost2.id }));
        });

        it('greater_than_equal', async () => {
          const query = `query {
          Posts(where:{number: {greater_than_equal:1}}) {
            docs {
              id
              title
            }
          }
        }`;

          const response = await client.request(query);
          const { docs } = response.Posts;

          expect(docs).toContainEqual(expect.objectContaining({ id: numPost1.id }));
          expect(docs).toContainEqual(expect.objectContaining({ id: numPost2.id }));
        });

        it('less_than', async () => {
          const query = `query {
          Posts(where:{number: {less_than:2}}) {
            docs {
              id
              title
            }
          }
        }`;

          const response = await client.request(query);
          const { docs } = response.Posts;

          expect(docs).toContainEqual(expect.objectContaining({ id: numPost1.id }));
        });

        it('less_than_equal', async () => {
          const query = `query {
          Posts(where:{number: {less_than_equal:2}}) {
            docs {
              id
              title
            }
          }
        }`;

          const response = await client.request(query);
          const { docs } = response.Posts;

          expect(docs).toContainEqual(expect.objectContaining({ id: numPost1.id }));
          expect(docs).toContainEqual(expect.objectContaining({ id: numPost2.id }));
        });
      });

      describe('every - select', () => {
        let post3: Post;
        let post4: Post;
        let post5: Post;
        let post6: Post;
        let post7: Post;

        beforeAll(async () => {
          post3 = await createPost({ title: 'post3', multiSelect: ['option1', 'option2'] });
          post4 = await createPost({ title: 'post4', multiSelect: ['option1'] });
          post5 = await createPost({ title: 'post5', multiSelect: ['option3'] });
          post6 = await createPost({ title: 'post6', multiSelect: ['option1', 'option2', 'option3'] });
          post7 = await createPost({ title: 'post7', multiSelect: [] });
        });

        afterAll(async () => {
          await Promise.all([
            deletePost(post3.id),
            deletePost(post4.id),
            deletePost(post5.id),
            deletePost(post6.id),
          ]);
        });

        it('every_in', async () => {
          const query = `query {
          Posts(where:{multiSelect: {every_in:[option1, option2]}}) {
            docs {
              id
              title
            }
          }
        }`;

          const response = await client.request(query);
          const { docs } = response.Posts;

          expect(docs).toContainEqual(expect.objectContaining({ id: post3.id }));
          expect(docs).toContainEqual(expect.objectContaining({ id: post4.id }));
          expect(docs).not.toContainEqual(expect.objectContaining({ id: post5.id }));
          expect(docs).not.toContainEqual(expect.objectContaining({ id: post6.id }));
          expect(docs).toContainEqual(expect.objectContaining({ id: post7.id }));
        });

        it('every_not_in', async () => {
          const query = `query {
          Posts(where:{multiSelect: {every_not_in:[option1, option2]}}) {
            docs {
              id
              title
            }
          }
        }`;

          const response = await client.request(query);
          const { docs } = response.Posts;

          expect(docs).not.toContainEqual(expect.objectContaining({ id: post3.id }));
          expect(docs).not.toContainEqual(expect.objectContaining({ id: post4.id }));
          expect(docs).toContainEqual(expect.objectContaining({ id: post5.id }));
          expect(docs).not.toContainEqual(expect.objectContaining({ id: post6.id }));
          expect(docs).toContainEqual(expect.objectContaining({ id: post7.id }));
        });

        it('every_equals', async () => {
          const query = `query {
          Posts(where:{multiSelect: {every_equals:option1}}) {
            docs {
              id
              title
            }
          }
        }`;

          const response = await client.request(query);
          const { docs } = response.Posts;

          expect(docs).not.toContainEqual(expect.objectContaining({ id: post3.id }));
          expect(docs).toContainEqual(expect.objectContaining({ id: post4.id }));
          expect(docs).not.toContainEqual(expect.objectContaining({ id: post5.id }));
          expect(docs).not.toContainEqual(expect.objectContaining({ id: post6.id }));
          expect(docs).toContainEqual(expect.objectContaining({ id: post7.id }));
        });

        it('every_not_equals', async () => {
          const query = `query {
          Posts(where:{multiSelect: {every_not_equals:option1}}) {
            docs {
              id
              title
            }
          }
        }`;

          const response = await client.request(query);
          const { docs } = response.Posts;

          expect(docs).not.toContainEqual(expect.objectContaining({ id: post3.id }));
          expect(docs).not.toContainEqual(expect.objectContaining({ id: post4.id }));
          expect(docs).toContainEqual(expect.objectContaining({ id: post5.id }));
          expect(docs).not.toContainEqual(expect.objectContaining({ id: post6.id }));
          expect(docs).toContainEqual(expect.objectContaining({ id: post7.id }));
        });
      });

      describe('every - relationship', () => {
        let post3: Post;
        let post4: Post;
        let post5: Post;
        let post6: Post;
        let post7: Post;

        let rel1: Relation;
        let rel2: Relation;
        let rel3: Relation;

        beforeAll(async () => {
          rel1 = await createRelation({ name: 'rel1' });
          rel2 = await createRelation({ name: 'rel2' });
          rel3 = await createRelation({ name: 'rel3' });

          post3 = await createPost({ title: 'post3', relationHasManyField: [rel1.id, rel2.id] });
          post4 = await createPost({ title: 'post4', relationHasManyField: [rel1.id] });
          post5 = await createPost({ title: 'post5', relationHasManyField: [rel3.id] });
          post6 = await createPost({ title: 'post6', relationHasManyField: [rel1.id, rel2.id, rel3.id] });
          post7 = await createPost({ title: 'post7', relationHasManyField: [] });
        });

        afterAll(async () => {
          await Promise.all([
            deletePost(post3.id),
            deletePost(post4.id),
            deletePost(post5.id),
            deletePost(post6.id),
            deletePost(post7.id),
            deleteRelation(rel1.id),
            deleteRelation(rel2.id),
            deleteRelation(rel3.id),
          ]);
        });

        it('every_in', async () => {
          const query = `query {
          Posts(where: {relationHasManyField: {every_in: ["${rel1.id}", "${rel2.id}"]}}) {
            docs {
              id
              title
            }
          }
        }`;

          const response = await client.request(query);
          const { docs } = response.Posts;

          expect(docs).toContainEqual(expect.objectContaining({ id: post3.id }));
          expect(docs).toContainEqual(expect.objectContaining({ id: post4.id }));
          expect(docs).not.toContainEqual(expect.objectContaining({ id: post5.id }));
          expect(docs).not.toContainEqual(expect.objectContaining({ id: post6.id }));
          expect(docs).toContainEqual(expect.objectContaining({ id: post7.id }));
        });

        it('every_not_in', async () => {
          const query = `query {
          Posts(where: {relationHasManyField: {every_not_in: ["${rel1.id}", "${rel2.id}"]}}) {
            docs {
              id
              title
            }
          }
        }`;

          const response = await client.request(query);
          const { docs } = response.Posts;

          expect(docs).not.toContainEqual(expect.objectContaining({ id: post3.id }));
          expect(docs).not.toContainEqual(expect.objectContaining({ id: post4.id }));
          expect(docs).toContainEqual(expect.objectContaining({ id: post5.id }));
          expect(docs).not.toContainEqual(expect.objectContaining({ id: post6.id }));
          expect(docs).toContainEqual(expect.objectContaining({ id: post7.id }));
        });

        it('every_equals', async () => {
          const query = `query {
          Posts(where: {relationHasManyField: {every_equals:"${rel1.id}"}}) {
            docs {
              id
              title
            }
          }
        }`;

          const response = await client.request(query);
          const { docs } = response.Posts;

          expect(docs).not.toContainEqual(expect.objectContaining({ id: post3.id }));
          expect(docs).toContainEqual(expect.objectContaining({ id: post4.id }));
          expect(docs).not.toContainEqual(expect.objectContaining({ id: post5.id }));
          expect(docs).not.toContainEqual(expect.objectContaining({ id: post6.id }));
          expect(docs).toContainEqual(expect.objectContaining({ id: post7.id }));
        });

        it('every_not_equals', async () => {
          const query = `query {
          Posts(where: {relationHasManyField: {every_not_equals:"${rel1.id}"}}) {
            docs {
              id
              title
            }
          }
        }`;

          const response = await client.request(query);
          const { docs } = response.Posts;

          expect(docs).not.toContainEqual(expect.objectContaining({ id: post3.id }));
          expect(docs).not.toContainEqual(expect.objectContaining({ id: post4.id }));
          expect(docs).toContainEqual(expect.objectContaining({ id: post5.id }));
          expect(docs).not.toContainEqual(expect.objectContaining({ id: post6.id }));
          expect(docs).toContainEqual(expect.objectContaining({ id: post7.id }));
        });
      });

      it('or', async () => {
        const query = `query {
        Posts(
          where: {OR: [{ title: { equals: "${post1.title}" } }, { title: { equals: "${post2.title}" } }]
        }) {
          docs {
            id
            title
          }
        }
      }`;

        const response = await client.request(query);
        const { docs } = response.Posts;

        expect(docs).toContainEqual(expect.objectContaining({ id: post1.id }));
        expect(docs).toContainEqual(expect.objectContaining({ id: post2.id }));
      });

      it('or - 1 result', async () => {
        const query = `query {
        Posts(
          where: {OR: [{ title: { equals: "${post1.title}" } }, { title: { equals: "nope" } }]
        }) {
          docs {
            id
            title
          }
        }
      }`;

        const response = await client.request(query);
        const { docs } = response.Posts;

        expect(docs).toContainEqual(expect.objectContaining({ id: post1.id }));
        expect(docs).not.toContainEqual(expect.objectContaining({ id: post2.id }));
      });

      it('and', async () => {
        const specialPost = await createPost({ description: 'special-123123' });

        const query = `query {
        Posts(
          where: {
            AND: [
              { title: { equals: "${specialPost.title}" } }
              { description: { equals: "${specialPost.description}" } }
            ]
        }) {
          docs {
            id
            title
          }
        }
      }`;

        const response = await client.request(query);
        const { docs } = response.Posts;

        expect(docs).toContainEqual(expect.objectContaining({ id: specialPost.id }));
      });
    });
  });
});

async function createPost(overrides?: Partial<Post>) {
  const doc = await payload.create<Post>({
    collection: slug,
    data: { title: 'title', ...overrides },
  });
  return doc;
}

async function deletePost(id: string) {
  await payload.delete({ collection: slug, id });
}

async function createRelation(overrides?: Partial<Relation>) {
  const doc = await payload.create<Relation>({
    collection: 'relation',
    data: { name: 'name', ...overrides },
  });
  return doc;
}

async function deleteRelation(id: string) {
  await payload.delete({ collection: 'relation', id });
}
