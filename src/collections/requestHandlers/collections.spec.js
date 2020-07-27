/**
 * @jest-environment node
 */

require('isomorphic-fetch');
const faker = require('faker');
const config = require('../../../demo/payload.config');
const { email, password } = require('../../tests/credentials');

const url = config.serverURL;

let token = null;

let localizedPostID;
const englishPostDesc = faker.lorem.lines(2);
const spanishPostDesc = faker.lorem.lines(2);

describe('Collections - REST', () => {
  beforeAll(async (done) => {
    const response = await fetch(`${url}/api/admins/login`, {
      body: JSON.stringify({
        email,
        password,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'post',
    });

    const data = await response.json();

    ({ token } = data);

    done();
  });

  describe('Create', () => {
    it('should allow a localized post to be created', async () => {
      const response = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: faker.name.firstName(),
          description: englishPostDesc,
          priority: 1,
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.doc.title).not.toBeNull();
      expect(data.doc.id).not.toBeNull();
      const timestampRegex = /^(\d{4})(?:-?W(\d+)(?:-?(\d+)D?)?|(?:-(\d+))?-(\d+))(?:[T ](\d+):(\d+)(?::(\d+)(?:\.(\d+))?)?)?(?:Z(-?\d*))?$/;
      expect(data.doc.createdAt).toStrictEqual(expect.stringMatching(timestampRegex));
      expect(data.doc.updatedAt).toStrictEqual(expect.stringMatching(timestampRegex));

      localizedPostID = data.doc.id;
    });
  });

  describe('Update', () => {
    it('should allow updating an existing post', async () => {
      const createResponse = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: faker.name.firstName(),
          description: 'original description',
          priority: 1,
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
      });

      expect(createResponse.status).toBe(201);
      const createData = await createResponse.json();
      const { id } = createData.doc;

      const updatedDesc = 'updated description';
      const response = await fetch(`${url}/api/localized-posts/${id}`, {
        body: JSON.stringify({
          title: 'asdf',
          description: updatedDesc,
          priority: 1,
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'put',
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.doc.description).toBe(updatedDesc);
    });

    it('should allow a Spanish locale to be added to an existing post', async () => {
      const response = await fetch(`${url}/api/localized-posts/${localizedPostID}?locale=es`, {
        body: JSON.stringify({
          title: `Spanish-${faker.name.firstName()}`,
          description: spanishPostDesc,
          priority: 1,
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'put',
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.doc.description).toBe(spanishPostDesc);
    });
  });

  describe('Read', () => {
    describe('Localized', () => {
      it('should allow a localized post to be retrieved in unspecified locale, defaulting to English', async () => {
        const response = await fetch(`${url}/api/localized-posts/${localizedPostID}`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.description).toBe(englishPostDesc);
      });

      it('should allow a localized post to be retrieved in specified English locale', async () => {
        const response = await fetch(`${url}/api/localized-posts/${localizedPostID}?locale=en`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.description).toBe(englishPostDesc);
      });

      it('should allow a localized post to be retrieved in Spanish', async () => {
        const response = await fetch(`${url}/api/localized-posts/${localizedPostID}?locale=es`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.description).toBe(spanishPostDesc);
      });

      it('should allow a localized post to be retrieved in all locales', async () => {
        const response = await fetch(`${url}/api/localized-posts/${localizedPostID}?locale=all`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.description.es).toBe(spanishPostDesc);
        expect(data.description.en).toBe(englishPostDesc);
      });
    });

    it('should allow querying by id', async () => {
      const response = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: faker.name.firstName(),
          description: faker.lorem.lines(2),
          priority: 1,
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      const getResponse = await fetch(`${url}/api/localized-posts/${data.doc.id}`);

      expect(getResponse.status).toBe(200);

      const getData = await getResponse.json();

      expect(getData.id).not.toBeNull();
    });

    it('should allow querying on a field', async () => {
      const desc = 'query test';
      const response = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: faker.name.firstName(),
          description: desc,
          priority: 1,
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
      });

      expect(response.status).toBe(201);
      const getResponse = await fetch(`${url}/api/localized-posts?where[description][equals]=${desc}`);
      const data = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(data.docs[0].description).toBe(desc);
      expect(data.docs).toHaveLength(1);
    });

    it('should allow querying with OR', async () => {
      const title1 = 'Or1';
      const title2 = 'Or2';
      const response = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: title1,
          description: 'desc',
          priority: 1,
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
      });

      const response2 = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: title2,
          description: 'desc',
          priority: 1,
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
      });

      expect(response.status).toBe(201);
      expect(response2.status).toBe(201);

      const queryResponse = await fetch(`${url}/api/localized-posts?where[or][0][title][equals]=${title1}&where[or][1][title][equals]=${title2}`);
      const data = await queryResponse.json();

      expect(queryResponse.status).toBe(200);
      expect(data.docs).toHaveLength(2);
      expect(data.docs).toContainEqual(expect.objectContaining({ title: title1 }));
      expect(data.docs).toContainEqual(expect.objectContaining({ title: title2 }));
    });

    it('should allow querying with OR, 1 result', async () => {
      const title1 = 'OrNegative1';
      const title2 = 'OrNegative2';
      const response = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: title1,
          description: 'desc',
          priority: 1,
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
      });

      const response2 = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: title2,
          description: 'desc',
          priority: 1,
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
      });

      expect(response.status).toBe(201);
      expect(response2.status).toBe(201);

      const queryResponse = await fetch(`${url}/api/localized-posts?where[or][0][title][equals]=${title1}&where[or][1][title][equals]=nonexistent`);
      const data = await queryResponse.json();

      expect(queryResponse.status).toBe(200);
      expect(data.docs).toHaveLength(1);
      expect(data.docs[0].title).toBe(title1);
    });
  });

  describe('Delete', () => {
    it('should allow a post to be deleted', async () => {
      const response = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: faker.name.firstName(),
          description: englishPostDesc,
          priority: 1,
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
      });

      const data = await response.json();
      const docId = data.doc.id;
      expect(response.status).toBe(201);
      expect(docId).not.toBeNull();

      const deleteResponse = await fetch(`${url}/api/localized-posts/${docId}`, {
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'delete',
      });
      expect(deleteResponse.status).toBe(200);
      const deleteData = await deleteResponse.json();
      expect(deleteData.id).toBe(docId);
    });
  });

  describe('Metadata', () => {
    async function createPost(title, description) {
      await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: title || faker.name.firstName(),
          description,
          priority: 1,
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
      });
    }

    it('should include metadata', async () => {
      const desc = 'metadataDesc';
      for (let i = 0; i < 12; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await createPost(null, desc);
      }

      const getResponse = await fetch(`${url}/api/localized-posts?where[description][equals]=${desc}`);
      const data = await getResponse.json();

      expect(getResponse.status).toBe(200);

      // TODO: Assert exact length once query bug is fixed
      expect(data.docs.length).toBeGreaterThan(0);
      expect(data.totalDocs).toBeGreaterThan(0);
      expect(data.limit).toBe(10);
      expect(data.totalPages).toBe(2);
      expect(data.page).toBe(1);
      expect(data.pagingCounter).toBe(1);
      expect(data.hasPrevPage).toBe(false);
      expect(data.hasNextPage).toBe(true);
      expect(data.prevPage).toBeNull();
      expect(data.nextPage).toBe(2);
    });

    it('should sort the results', async () => {
      const desc = 'sort';

      // Create 2 posts with different titles, same desc
      const req1 = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: 'aaa',
          description: desc,
          priority: 1,
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
      });

      const req2 = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: 'zzz',
          description: desc,
          priority: 1,
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
      });

      const req1data = await req1.json();
      const req2data = await req2.json();
      const id1 = req1data.doc.id;
      const id2 = req2data.doc.id;

      // Query on shared desc and sort ascending
      const getResponse = await fetch(`${url}/api/localized-posts?where[description][equals]=${desc}&sort=title`);
      const data = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(data.docs).toHaveLength(2);
      expect(data.docs[0].id).toEqual(id1);
      expect(data.docs[1].id).toEqual(id2);

      // Query on shared desc and sort descending
      const getResponseSorted = await fetch(`${url}/api/localized-posts?where[description][equals]=${desc}&sort=-title`);
      const sortedData = await getResponseSorted.json();

      expect(getResponse.status).toBe(200);
      expect(sortedData.docs).toHaveLength(2);
      // Opposite order from first request
      expect(sortedData.docs[0].id).toEqual(id2);
      expect(sortedData.docs[1].id).toEqual(id1);
    });
  });

  describe('Hooks', () => {
    describe('Before', () => {
      it('beforeCreate', async () => {
        const response = await fetch(`${url}/api/hooks`, {
          body: JSON.stringify({
            title: faker.name.firstName(),
            description: 'Original',
            priority: 1,
          }),
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
            hook: 'beforeCreate', // Used by hook
          },
          method: 'post',
        });
        const data = await response.json();
        expect(response.status).toBe(201);
        expect(data.doc.description).toEqual('Original-beforeCreateSuffix');
      });

      it('beforeUpdate', async () => {
        const createResponse = await fetch(`${url}/api/hooks`, {
          body: JSON.stringify({
            title: faker.name.firstName(),
            description: 'Original',
            priority: 1,
          }),
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
          },
          method: 'post',
        });
        const createData = await createResponse.json();
        expect(createResponse.status).toBe(201);
        const { id } = createData.doc;

        const response = await fetch(`${url}/api/hooks/${id}`, {
          body: JSON.stringify({
            description: 'Updated',
          }),
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
            hook: 'beforeUpdate', // Used by hook

          },
          method: 'put',
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.doc.description).toEqual('Updated-beforeUpdateSuffix');
      });

      it('beforeDelete', async () => {
        const createResponse = await fetch(`${url}/api/hooks`, {
          body: JSON.stringify({
            title: faker.name.firstName(),
            description: 'Original',
            priority: 1,
          }),
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
          },
          method: 'post',
        });
        const createData = await createResponse.json();
        const { id } = createData.doc;

        const response = await fetch(`${url}/api/hooks/${id}`, {
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
            hook: 'beforeDelete', // Used by hook
          },
          method: 'delete',
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        // Intentionally afterDeleteHook - beforeDelete hook is setting header in order to trigger afterDelete hook
        expect(data.afterDeleteHook).toEqual(true);
      });
    });

    describe('After', () => {
      it('afterCreate', async () => {
        const response = await fetch(`${url}/api/hooks`, {
          body: JSON.stringify({
            title: faker.name.firstName(),
            description: 'Original',
            priority: 1,
          }),
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
            hook: 'afterCreate', // Used by hook
          },
          method: 'post',
        });
        const data = await response.json();
        expect(response.status).toBe(201);
        expect(data.doc.afterCreateHook).toEqual(true);
      });

      it('afterRead', async () => {
        const response = await fetch(`${url}/api/hooks`, {
          body: JSON.stringify({
            title: faker.name.firstName(),
            description: 'afterRead',
            priority: 1,
          }),
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
            hook: 'afterRead', // Used by hook
          },
          method: 'post',
        });
        const data = await response.json();
        const getResponse = await fetch(`${url}/api/hooks/${data.doc.id}`);
        const getResponseData = await getResponse.json();
        expect(getResponse.status).toBe(200);
        expect(getResponseData.afterReadHook).toEqual(true);
      });

      it('afterUpdate', async () => {
        const createResponse = await fetch(`${url}/api/hooks`, {
          body: JSON.stringify({
            title: faker.name.firstName(),
            description: 'Original',
            priority: 1,
          }),
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
          },
          method: 'post',
        });
        const createData = await createResponse.json();
        const { id } = createData.doc;

        const response = await fetch(`${url}/api/hooks/${id}`, {
          body: JSON.stringify({
            description: 'afterUpdate',
          }),
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
            hook: 'afterUpdate', // Used by hook
          },
          method: 'put',
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.doc.afterUpdateHook).toEqual(true);
      });

      it('afterDelete', async () => {
        const createResponse = await fetch(`${url}/api/hooks`, {
          body: JSON.stringify({
            title: faker.name.firstName(),
            description: 'Original',
            priority: 1,
          }),
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
          },
          method: 'post',
        });
        const createData = await createResponse.json();
        const { id } = createData.doc;

        const response = await fetch(`${url}/api/hooks/${id}`, {
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
            hook: 'afterDelete', // Used by hook
          },
          method: 'delete',
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.afterDeleteHook).toEqual(true);
      });
    });
  });

  describe('Relationships', () => {
    let documentA;
    let documentB;

    beforeAll(async (done) => {
      // create document a
      const createA = await fetch(`${url}/api/relationship-a`, {
        body: JSON.stringify({}),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
      });
      const createAData = await createA.json();
      // create document b, related to a
      const createB = await fetch(`${url}/api/relationship-b`, {
        body: JSON.stringify({
          post: [createAData.doc.id],
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
      });
      // update a to relate to b
      const createBData = await createB.json();
      documentB = createBData.doc;
      const updateA = await fetch(`${url}/api/relationship-a/${createAData.doc.id}`, {
        body: JSON.stringify({
          post: documentB.id,
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'put',
      });
      const updateAData = await updateA.json();
      documentA = updateAData.doc;
      done();
    });

    it('should create and read collections with relationships', async () => {
      expect(documentA.post).not.toBeNull();
      expect(documentB.post).toHaveLength(1);
    });

    it('should use depth to limit the number of relationships returned', async () => {
      const response = await fetch(`${url}/api/relationship-a?depth=3`, {
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'get',
      });
      const data = await response.json();
      const [doc] = data.docs;
      expect(doc.id).toBe(documentA.id);
      let nested = doc.post;
      expect(nested.id).toBe(documentB.id);
      [nested] = nested.post;
      expect(nested.id).toBe(documentA.id);
      nested = nested.post;
      expect(nested.id).toBe(documentB.id);
      [nested] = nested.post;
      expect(nested).not.toHaveProperty('post');
      expect(nested).toBe(documentA.id);
    });
  });
});
