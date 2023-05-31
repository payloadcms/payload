import mongoose from 'mongoose';
import { GraphQLClient } from 'graphql-request';
import { initPayloadTest } from '../helpers/configHelpers';
import configPromise, { slug } from './config';
import payload from '../../src';
import type { Post } from './payload-types';

const title = 'title';

let client: GraphQLClient;

describe('collections-graphql', () => {
  beforeAll(async () => {
    const { serverURL } = await initPayloadTest({ __dirname, init: { local: false } });
    const config = await configPromise;
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

    it('should create using graphql variables', async () => {
      const query = `mutation Create($title: String!) {
          createPost(data: {title: $title}) {
          id
          title
        }
      }`;
      const response = await client.request(query, { title });
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

    describe('relationships', () => {
      it('should query on relationships with custom IDs', async () => {
        const query = `query {
          Posts(where: { title: { equals: "has custom ID relation" }}) {
            docs {
              id
              title
              relationToCustomID {
                id
              }
            }
            totalDocs
          }
        }`;

        const response = await client.request(query);
        const { docs, totalDocs } = response.Posts;

        expect(totalDocs).toStrictEqual(1);
        expect(docs[0].relationToCustomID.id).toStrictEqual(1);
      });
    });
  });

  describe('Error Handler', () => {
    it('should return have an array of errors when making a bad request', async () => {
      let error;

      // language=graphQL
      const query = `query {
        Posts(where: { title: { exists: true }}) {
          docs {
            badFieldName
          }
        }
      }`;
      await client.request(query).catch((err) => {
        error = err;
      });
      expect(Array.isArray(error.response.errors)).toBe(true);
      expect(typeof error.response.errors[0].message).toBe('string');
    });

    it('should return have an array of errors when failing to pass validation', async () => {
      let error;
      // language=graphQL
      const query = `mutation {
        createPost(data: {min: 1}) {
          id
          min
          createdAt
          updatedAt
        }
      }`;

      await client.request(query).catch((err) => {
        error = err;
      });
      expect(Array.isArray(error.response.errors)).toBe(true);
      expect(error.response.errors[0].message).toEqual('The following field is invalid: min');
      expect(typeof error.response.errors[0].locations).toBeDefined();
    });

    it('should return have an array of errors when failing multiple mutations', async () => {
      let error;
      // language=graphQL
      const query = `mutation createTest {
        test1:createUser(data: { email: "test@test.com", password: "test" }) {
          email
        }

        test2:createUser(data: { email: "test2@test.com", password: "" }) {
          email
        }

        test3:createUser(data: { email: "test@test.com", password: "test" }) {
          email
        }
      }`;

      await client.request(query).catch((err) => {
        error = err;
      });

      expect(Array.isArray(error.response.errors)).toBe(true);
      expect(error.response.errors[0].message).toEqual('No password was given');
      expect(Array.isArray(error.response.errors[0].locations)).toEqual(true);
      expect(error.response.errors[0].path[0]).toEqual('test2');
      expect(error.response.errors[0].extensions.name).toEqual('MissingPasswordError');

      expect(error.response.errors[1].message).toEqual('The following field is invalid: email');
      expect(error.response.errors[1].path[0]).toEqual('test3');
      expect(error.response.errors[1].extensions.name).toEqual('ValidationError');
      expect(error.response.errors[1].extensions.data[0].message).toEqual('A user with the given email is already registered');
      expect(error.response.errors[1].extensions.data[0].field).toEqual('email');
    });
  });
});

async function createPost(overrides?: Partial<Post>) {
  const doc = await payload.create({
    collection: slug,
    data: { title: 'title', ...overrides },
  });
  return doc;
}
