import { request, GraphQLClient } from 'graphql-request';
import { initPayloadTest } from '../helpers/configHelpers';
import payload from '../../src';
import config from './config';
import AutosavePosts from './collections/Autosave';
import AutosaveGlobal from './globals/Autosave';
import { devUser } from '../credentials';

let collectionLocalPostID;
let collectionLocalVersionID;

let graphQLURL;

let graphQLClient;
let token;

let collectionGraphQLPostID;
let collectionGraphQLVersionID;
const collectionGraphQLOriginalTitle = 'autosave title';

const collection = AutosavePosts.slug;
const globalSlug = AutosaveGlobal.slug;

let globalLocalVersionID;
let globalGraphQLVersionID;
const globalGraphQLOriginalTitle = 'updated global title';

describe('Versions', () => {
  beforeAll(async (done) => {
    const { serverURL } = await initPayloadTest({ __dirname, init: { local: false } });
    graphQLURL = `${serverURL}${config.routes.api}${config.routes.graphQL}`;

    const login = `
      mutation {
        loginUser(
          email: "${devUser.email}",
          password: "${devUser.password}"
        ) {
          token
        }
      }`;

    const response = await request(graphQLURL, login);
    token = response.loginUser.token;
    graphQLClient = new GraphQLClient(graphQLURL, { headers: { Authorization: `JWT ${token}` } });

    done();
  });

  describe('Collections - Local', () => {
    describe('Create', () => {
      it('should allow a new version to be created', async () => {
        const autosavePost = await payload.create({
          collection,
          data: {
            title: 'Here is an autosave post in EN',
            description: '345j23o4ifj34jf54g',
          },
        });

        const updatedTitle = 'Here is an updated post title in EN';

        collectionLocalPostID = autosavePost.id;

        const updatedPost: {
          title: string
          _status?: string
        } = await payload.update({
          id: collectionLocalPostID,
          collection,
          data: {
            title: updatedTitle,
          },
        });

        const versions = await payload.findVersions({
          collection,
        });

        collectionLocalVersionID = versions.docs[0].id;

        expect(updatedPost.title).toBe(updatedTitle);
        expect(updatedPost._status).toStrictEqual('draft');

        expect(collectionLocalVersionID).toBeDefined();
      });

      it('should allow saving multiple versions of models with unique fields', async () => {
        const autosavePost = await payload.create({
          collection,
          data: {
            title: 'unique unchanging title',
            description: 'description 1',
          },
        });

        await payload.update({
          id: autosavePost.id,
          collection,
          data: {
            description: 'description 2',
          },
        });
        const finalDescription = 'final description';

        const secondUpdate = await payload.update({
          id: autosavePost.id,
          collection,
          data: {
            description: finalDescription,
          },
        });

        expect(secondUpdate.description).toBe(finalDescription);
      });

      it('should allow a version to be retrieved by ID', async () => {
        const version = await payload.findVersionByID({
          collection,
          id: collectionLocalVersionID,
        });

        expect(version.id).toStrictEqual(collectionLocalVersionID);
      });

      it('should allow a version to save locales properly', async () => {
        const englishTitle = 'Title in EN';
        const spanishTitle = 'Title in ES';

        await payload.update({
          collection,
          id: collectionLocalPostID,
          data: {
            title: englishTitle,
          },
        });

        const updatedPostES = await payload.update({
          collection,
          id: collectionLocalPostID,
          locale: 'es',
          data: {
            title: spanishTitle,
          },
        });

        expect(updatedPostES.title).toBe(spanishTitle);

        const newEnglishTitle = 'New title in EN';

        await payload.update({
          collection,
          id: collectionLocalPostID,
          data: {
            title: newEnglishTitle,
          },
        });

        const versions = await payload.findVersions({
          collection,
          locale: 'all',
        });

        expect(versions.docs[0].version.title.en).toStrictEqual(englishTitle);
        expect(versions.docs[0].version.title.es).toStrictEqual(spanishTitle);
      });
    });

    describe('Restore', () => {
      it('should allow a version to be restored', async () => {
        const title2 = 'Here is an updated post title in EN';

        const updatedPost = await payload.update({
          collection,
          id: collectionLocalPostID,
          data: {
            title: title2,
          },
        });

        expect(updatedPost.title).toBe(title2);

        const versions = await payload.findVersions({
          collection,
        });

        const restore = await payload.restoreVersion({
          collection,
          id: versions.docs[0].id,
        });

        expect(restore.title).toBeDefined();

        const restoredPost = await payload.findByID({
          collection,
          id: collectionLocalPostID,
          draft: true,
        });

        expect(restoredPost.title).toBe(restore.title);
      });
    });

    describe('Update', () => {
      it('should allow a draft to be patched', async () => {
        const originalTitle = 'Here is a published post';

        const originalPublishedPost = await payload.create({
          collection,
          data: {
            title: originalTitle,
            description: 'kjnjyhbbdsfseankuhsjsfghb',
            _status: 'published',
          },
        });

        const updatedTitle = 'Here is a draft post with a patched title';

        collectionLocalPostID = originalPublishedPost.id;

        await payload.update({
          id: collectionLocalPostID,
          collection,
          data: {
            title: updatedTitle,
          },
          draft: true,
        });

        const publishedPost = await payload.findByID({
          collection,
          id: collectionLocalPostID,
        });

        const draftPost = await payload.findByID({
          collection,
          id: collectionLocalPostID,
          draft: true,
        });

        expect(publishedPost.title).toBe(originalTitle);
        expect(draftPost.title).toBe(updatedTitle);
      });
    });
  });

  describe('Collections - GraphQL', () => {
    describe('Create', () => {
      it('should allow a new doc to be created with draft status', async () => {
        const description = 'autosave description';

        const query = `mutation {
            createAutosavePost(data: {title: "${collectionGraphQLOriginalTitle}", description: "${description}"}) {
            id
            title
            description
            createdAt
            updatedAt
            _status
          }
        }`;

        const response = await graphQLClient.request(query);

        const data = response.createAutosavePost;
        collectionGraphQLPostID = data.id;

        expect(data._status).toStrictEqual('draft');
      });
    });

    describe('Read', () => {
      const updatedTitle = 'updated title';

      beforeAll(async (done) => {
        // modify the post to create a new version
        // language=graphQL
        const update = `mutation {
          updateAutosavePost(id: "${collectionGraphQLPostID}", data: {title: "${updatedTitle}"}) {
            title
          }
        }`;
        await graphQLClient.request(update);

        // language=graphQL
        const query = `query {
            versionsAutosavePosts(where: { parent: { equals: "${collectionGraphQLPostID}" } }) {
            docs {
              id
            }
          }
        }`;

        const response = await graphQLClient.request(query);

        collectionGraphQLVersionID = response.versionsAutosavePosts.docs[0].id;
        done();
      });

      it('should allow read of versions by version id', async () => {
        const query = `query {
          versionAutosavePost(id: "${collectionGraphQLVersionID}") {
            id
            parent {
              id
            }
            version {
              title
            }
          }
        }`;

        const response = await graphQLClient.request(query);

        const data = response.versionAutosavePost;
        collectionGraphQLVersionID = data.id;

        expect(data.id).toBeDefined();
        expect(data.parent.id).toStrictEqual(collectionGraphQLPostID);
        expect(data.version.title).toStrictEqual(collectionGraphQLOriginalTitle);
      });

      it('should allow read of versions by querying version content', async () => {
        // language=graphQL
        const query = `query {
            versionsAutosavePosts(where: { version__title: {equals: "${collectionGraphQLOriginalTitle}" } }) {
            docs {
              id
              parent {
              id
            }
              version {
                title
              }
            }
          }
        }`;

        const response = await graphQLClient.request(query);

        const data = response.versionsAutosavePosts;
        const doc = data.docs[0];
        collectionGraphQLVersionID = doc.id;

        expect(doc.id).toBeDefined();
        expect(doc.parent.id).toStrictEqual(collectionGraphQLPostID);
        expect(doc.version.title).toStrictEqual(collectionGraphQLOriginalTitle);
      });
    });

    describe('Restore', () => {
      it('should allow a version to be restored', async () => {
        // update a versionsPost
        const restore = `mutation {
          restoreVersionAutosavePost(id: "${collectionGraphQLVersionID}") {
            title
          }
        }`;

        await graphQLClient.request(restore);

        const query = `query {
          AutosavePost(id: "${collectionGraphQLPostID}") {
            title
          }
        }`;

        const response = await graphQLClient.request(query);
        const data = response.AutosavePost;
        expect(data.title).toStrictEqual(collectionGraphQLOriginalTitle);
      });
    });
  });

  describe('Globals - Local', () => {
    describe('Create', () => {
      it('should allow a new version to be created', async () => {
        await payload.updateGlobal({
          slug: globalSlug,
          data: {
            title: 'Test Global',
          },
        });

        const title2 = 'Here is an updated global title in EN';

        const updatedGlobal = await payload.updateGlobal({
          slug: globalSlug,
          data: {
            title: title2,
          },
        });

        expect(updatedGlobal.title).toBe(title2);
        expect(updatedGlobal._status).toStrictEqual('draft');

        const versions = await payload.findGlobalVersions({
          slug: globalSlug,
        });

        globalLocalVersionID = versions.docs[0].id;
      });
    });

    describe('Read', () => {
      it('should allow a version to be retrieved by ID', async () => {
        const version = await payload.findGlobalVersionByID({
          slug: globalSlug,
          id: globalLocalVersionID,
        });

        expect(version.id).toStrictEqual(globalLocalVersionID);
      });
    });

    describe('Update', () => {
      it('should allow a version to save locales properly', async () => {
        const englishTitle = 'Title in EN';
        const spanishTitle = 'Title in ES';

        await payload.updateGlobal({
          slug: globalSlug,
          data: {
            title: englishTitle,
          },
        });

        const updatedGlobalES = await payload.updateGlobal({
          slug: globalSlug,
          locale: 'es',
          data: {
            title: spanishTitle,
          },
        });

        expect(updatedGlobalES.title).toBe(spanishTitle);

        const newEnglishTitle = 'New title in EN';

        await payload.updateGlobal({
          slug: globalSlug,
          data: {
            title: newEnglishTitle,
          },
        });

        const versions = await payload.findGlobalVersions({
          slug: globalSlug,
          locale: 'all',
        });

        expect(versions.docs[0].version.title.en).toStrictEqual(newEnglishTitle);
        expect(versions.docs[0].version.title.es).toStrictEqual(spanishTitle);
      });
    });

    describe('Restore', () => {
      it('should allow a version to be restored', async () => {
        const title2 = 'Here is an updated title in EN';

        const updatedGlobal = await payload.updateGlobal({
          slug: globalSlug,
          data: {
            title: title2,
          },
        });

        expect(updatedGlobal.title).toBe(title2);

        const versions = await payload.findGlobalVersions({
          slug: globalSlug,
        });

        globalLocalVersionID = versions.docs[0].id;

        const restore = await payload.restoreGlobalVersion({
          slug: globalSlug,
          id: globalLocalVersionID,
        });

        expect(restore.title).toBeDefined();

        const restoredGlobal = await payload.findGlobal({
          slug: globalSlug,
          draft: true,
        });

        expect(restoredGlobal.title).toBe(restore.title);
      });
    });

    describe('Patch', () => {
      it('should allow a draft to be patched', async () => {
        const originalTitle = 'Here is a published global';

        await payload.updateGlobal({
          slug: globalSlug,
          data: {
            title: originalTitle,
            description: 'kjnjyhbbdsfseankuhsjsfghb',
            _status: 'published',
          },
        });

        const publishedGlobal = await payload.findGlobal({
          slug: globalSlug,
          draft: true,
        });

        const updatedTitle = 'Here is a draft global with a patched title';

        await payload.updateGlobal({
          slug: globalSlug,
          data: {
            title: updatedTitle,
          },
          draft: true,
        });

        const updatedGlobal = await payload.findGlobal({
          slug: globalSlug,
          draft: true,
        });

        expect(publishedGlobal.title).toBe(originalTitle);
        expect(updatedGlobal.title).toBe(updatedTitle);
      });
    });
  });

  describe('Globals - GraphQL', () => {
    describe('Read', () => {
      beforeAll(async (done) => {
        // language=graphql
        const update = `mutation {
          updateAutosaveGlobal(draft: true, data: {
            title: "${globalGraphQLOriginalTitle}"
          }) {
            _status
            title
          }
        }`;
        await graphQLClient.request(update);

        // language=graphQL
        const query = `query {
          versionsAutosaveGlobal(where: { version__title: { equals: "${globalGraphQLOriginalTitle}" } }) {
            docs {
              id
              version {
                title
              }
            }
          }
        }`;

        const response = await graphQLClient.request(query);

        globalGraphQLVersionID = response.versionsAutosaveGlobal.docs[0].id;
        done();
      });

      it('should allow read of versions by version id', async () => {
        // language=graphql
        const query = `query {
          versionAutosaveGlobal(id: "${globalGraphQLVersionID}") {
            id
            version {
              title
            }
          }
        }`;

        const response = await graphQLClient.request(query);

        const data = response.versionAutosaveGlobal;
        globalGraphQLVersionID = data.id;

        expect(data.id).toBeDefined();
        expect(data.version.title).toStrictEqual(globalGraphQLOriginalTitle);
      });

      it('should allow read of versions by querying version content', async () => {
        // language=graphQL
        const query = `query {
          versionsAutosaveGlobal(where: { version__title: {equals: "${globalGraphQLOriginalTitle}" } }) {
            docs {
              id
              version {
                title
              }
            }
          }
        }`;

        const response = await graphQLClient.request(query);

        const data = response.versionsAutosaveGlobal;
        const doc = data.docs[0];
        globalGraphQLVersionID = doc.id;

        expect(doc.id).toBeDefined();
        expect(doc.version.title).toStrictEqual(globalGraphQLOriginalTitle);
      });
    });

    describe('Restore', () => {
      it('should allow a version to be restored', async () => {
        // language=graphql
        const restore = `mutation {
          restoreVersionAutosaveGlobal(id: "${globalGraphQLVersionID}") {
            title
          }
        }`;

        await graphQLClient.request(restore);

        const query = `query {
          AutosaveGlobal {
            title
          }
        }`;

        const response = await graphQLClient.request(query);
        const data = response.AutosaveGlobal;
        expect(data.title).toStrictEqual(globalGraphQLOriginalTitle);
      });
    });
  });
});
