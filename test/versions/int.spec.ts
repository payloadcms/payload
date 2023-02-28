import { request, GraphQLClient } from 'graphql-request';
import { initPayloadTest } from '../helpers/configHelpers';
import payload from '../../src';
import configPromise from './config';
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
  beforeAll(async () => {
    const config = await configPromise;

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
  });

  describe('Collections - Local', () => {
    describe('Create', () => {
      it('should allow a new version to be created and updated', async () => {
        const autosavePost = await payload.create({
          collection,
          data: {
            title: 'Here is an autosave post in EN',
            description: '345j23o4ifj34jf54g',
          },
        });

        collectionLocalPostID = autosavePost.id;

        const updatedTitle = 'Here is an updated post title in EN';

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

        expect(updatedPost.title).toBe(updatedTitle);
        expect(updatedPost._status).toStrictEqual('draft');

        const versions = await payload.findVersions({
          collection,
        });

        collectionLocalVersionID = versions.docs[0].id;

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
          where: {
            parent: {
              equals: collectionLocalPostID,
            },
          },
        });

        expect(versions.docs[0].version.title.en).toStrictEqual(newEnglishTitle);
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

        // restore to latest version
        const restoredVersion = await payload.restoreVersion({
          collection,
          id: versions.docs[1].id,
        });

        expect(restoredVersion.title).toBeDefined();

        const latestDraft = await payload.findByID({
          collection,
          id: collectionLocalPostID,
          draft: true,
        });

        expect(latestDraft.title).toBe(versions.docs[0].version.title);
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
          locale: 'en',
          data: {
            title: updatedTitle,
          },
          draft: true,
        });

        const spanishTitle = 'es title';

        // second update to existing draft
        await payload.update({
          id: collectionLocalPostID,
          collection,
          locale: 'es',
          data: {
            title: spanishTitle,
          },
          draft: true,
        });

        const publishedPost = await payload.findByID({
          collection,
          id: collectionLocalPostID,
        });

        const draftPost = await payload.findByID({
          collection,
          locale: 'all',
          id: collectionLocalPostID,
          draft: true,
        });

        expect(publishedPost.title).toBe(originalTitle);
        expect(draftPost.title.en).toBe(updatedTitle);
        expect(draftPost.title.es).toBe(spanishTitle);
      });
    });

    describe('Draft Count', () => {
      it('creates proper number of drafts', async () => {
        const originalDraft = await payload.create({
          collection: 'draft-posts',
          draft: true,
          data: {
            title: 'A',
            description: 'A',
            _status: 'draft',
          },
        });

        await payload.update({
          collection: 'draft-posts',
          id: originalDraft.id,
          draft: true,
          data: {
            title: 'B',
            description: 'B',
            _status: 'draft',
          },
        });

        await payload.update({
          collection: 'draft-posts',
          id: originalDraft.id,
          draft: true,
          data: {
            title: 'C',
            description: 'C',
            _status: 'draft',
          },
        });

        const mostRecentDraft = await payload.findByID({
          collection: 'draft-posts',
          id: originalDraft.id,
          draft: true,
        });

        expect(mostRecentDraft.title).toStrictEqual('C');

        const versions = await payload.findVersions({
          collection: 'draft-posts',
          where: {
            parent: {
              equals: originalDraft.id,
            },
          },
        });

        expect(versions.docs).toHaveLength(3);
      });
    });

    describe('Max Versions', () => {
      // create 2 documents with 3 versions each
      // expect 2 documents with 2 versions each
      it('retains correct versions', async () => {
        const doc1 = await payload.create({
          collection: 'version-posts',
          data: {
            title: 'A',
            description: 'A',
          },
        });

        await payload.update({
          collection: 'version-posts',
          id: doc1.id,
          data: {
            title: 'B',
            description: 'B',
          },
        });

        await payload.update({
          collection: 'version-posts',
          id: doc1.id,
          data: {
            title: 'C',
            description: 'C',
          },
        });

        const doc2 = await payload.create({
          collection: 'version-posts',
          data: {
            title: 'D',
            description: 'D',
          },
        });

        await payload.update({
          collection: 'version-posts',
          id: doc2.id,
          data: {
            title: 'E',
            description: 'E',
          },
        });

        await payload.update({
          collection: 'version-posts',
          id: doc2.id,
          data: {
            title: 'F',
            description: 'F',
          },
        });

        const doc1Versions = await payload.findVersions({
          collection: 'version-posts',
          sort: '-updatedAt',
          where: {
            parent: {
              equals: doc1.id,
            },
          },
        });

        const doc2Versions = await payload.findVersions({
          collection: 'version-posts',
          sort: '-updatedAt',
          where: {
            parent: {
              equals: doc2.id,
            },
          },
        });

        // correctly retains 2 documents in the versions collection
        expect(doc1Versions.totalDocs).toStrictEqual(2);
        // correctly retains the most recent 2 versions
        expect(doc1Versions.docs[1].version.title).toStrictEqual('B');

        // correctly retains 2 documents in the versions collection
        expect(doc2Versions.totalDocs).toStrictEqual(2);
        // correctly retains the most recent 2 versions
        expect(doc2Versions.docs[1].version.title).toStrictEqual('E');

        const docs = await payload.find({
          collection: 'version-posts',
        });

        // correctly retains 2 documents in the actual collection
        expect(docs.totalDocs).toStrictEqual(2);
      });
    });
  });

  describe('Querying', () => {
    const originalTitle = 'original title';
    const updatedTitle1 = 'new title 1';
    const updatedTitle2 = 'new title 2';
    let firstDraft;

    beforeAll(async () => {
      // This will be created in the `draft-posts` collection
      firstDraft = await payload.create({
        collection: 'draft-posts',
        data: {
          title: originalTitle,
          description: 'my description',
          radio: 'test',
        },
      });

      // This will be created in the `_draft-posts_versions` collection
      await payload.update({
        collection: 'draft-posts',
        id: firstDraft.id,
        draft: true,
        data: {
          title: updatedTitle1,
        },
      });

      // This will be created in the `_draft-posts_versions` collection
      // and will be the newest draft, able to be queried on
      await payload.update({
        collection: 'draft-posts',
        id: firstDraft.id,
        draft: true,
        data: {
          title: updatedTitle2,
        },
      });
    });

    it('should allow querying a draft doc from main collection', async () => {
      const findResults = await payload.find({
        collection: 'draft-posts',
        where: {
          title: {
            equals: originalTitle,
          },
        },
      });

      expect(findResults.docs[0].title).toStrictEqual(originalTitle);
    });

    it('should not be able to query an old draft version with draft=true', async () => {
      const draftFindResults = await payload.find({
        collection: 'draft-posts',
        draft: true,
        where: {
          title: {
            equals: updatedTitle1,
          },
        },
      });

      expect(draftFindResults.docs).toHaveLength(0);
    });

    it('should be able to query the newest draft version with draft=true', async () => {
      const draftFindResults = await payload.find({
        collection: 'draft-posts',
        draft: true,
        where: {
          title: {
            equals: updatedTitle2,
          },
        },
      });

      expect(draftFindResults.docs[0].title).toStrictEqual(updatedTitle2);
    });

    it('should not be able to query old drafts that don\'t match with draft=true', async () => {
      const draftFindResults = await payload.find({
        collection: 'draft-posts',
        draft: true,
        where: {
          title: {
            equals: originalTitle,
          },
        },
      });

      expect(draftFindResults.docs).toHaveLength(0);
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

      beforeAll(async () => {
        // modify the post to create a new version
        // language=graphQL
        const update = `mutation {
          updateAutosavePost(id: "${collectionGraphQLPostID}", data: {title: "${updatedTitle}"}) {
            title
            updatedAt
            createdAt
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
        expect(data.version.title).toStrictEqual(updatedTitle);
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
          locale: 'en',
          data: {
            title: updatedTitle,
          },
          draft: true,
        });

        await payload.updateGlobal({
          slug: globalSlug,
          locale: 'es',
          data: {
            title: updatedTitle,
          },
          draft: true,
        });

        const updatedGlobal = await payload.findGlobal({
          slug: globalSlug,
          locale: 'all',
          draft: true,
        });

        expect(publishedGlobal.title).toBe(originalTitle);
        expect(updatedGlobal.title.en).toBe(updatedTitle);
        expect(updatedGlobal.title.es).toBe(updatedTitle);
      });

      it('should allow a draft to be published', async () => {
        const originalTitle = 'Here is a draft';

        await payload.updateGlobal({
          slug: globalSlug,
          data: {
            title: originalTitle,
            _status: 'draft',
          },
          draft: true,
        });

        const updatedTitle = 'Now try to publish';

        const result = await payload.updateGlobal({
          slug: globalSlug,
          data: {
            title: updatedTitle,
            _status: 'published',
          },
        });

        expect(result.title).toBe(updatedTitle);
      });
    });
  });

  describe('Globals - GraphQL', () => {
    describe('Read', () => {
      beforeAll(async () => {
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
