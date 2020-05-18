/**
 * @jest-environment node
 */

require('isomorphic-fetch');
const faker = require('faker');
const config = require('../../../demo/payload.config');
const { username, password } = require('../../tests/credentials');

const url = config.serverURL;

let token = null;

let localizedPostID;
const englishPostDesc = faker.lorem.lines(2);
const spanishPostDesc = faker.lorem.lines(2);

beforeAll(async (done) => {
  const response = await fetch(`${url}/api/users/login`, {
    body: JSON.stringify({
      username,
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

describe('Collections - REST', () => {
  describe('Create', () => {
    it('should allow a post to be created', async () => {
      const response = await fetch(`${url}/api/posts`, {
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
      expect(data.doc.createdAt).toEqual(expect.stringMatching(timestampRegex));
      expect(data.doc.updatedAt).toEqual(expect.stringMatching(timestampRegex));

      localizedPostID = data.doc.id;
    });
  });

  describe('Update', () => {
    it('should allow updating an existing post', async () => {
      const createResponse = await fetch(`${url}/api/posts`, {
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
      const response = await fetch(`${url}/api/posts/${id}`, {
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
      const response = await fetch(`${url}/api/posts/${localizedPostID}?locale=es`, {
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
        const response = await fetch(`${url}/api/posts/${localizedPostID}`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.description).toBe(englishPostDesc);
      });

      it('should allow a localized post to be retrieved in specified English locale', async () => {
        const response = await fetch(`${url}/api/posts/${localizedPostID}?locale=en`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.description).toBe(englishPostDesc);
      });

      it('should allow a localized post to be retrieved in Spanish', async () => {
        const response = await fetch(`${url}/api/posts/${localizedPostID}?locale=es`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.description).toBe(spanishPostDesc);
      });

      it('should allow a localized post to be retrieved in all locales', async () => {
        const response = await fetch(`${url}/api/posts/${localizedPostID}?locale=all`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.description.es).toBe(spanishPostDesc);
        expect(data.description.en).toBe(englishPostDesc);
      });
    });

    it('should allow querying by id', async () => {
      const response = await fetch(`${url}/api/posts`, {
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
      const getResponse = await fetch(`${url}/api/posts/${data.doc.id}`);
      expect(getResponse.status).toBe(200);

      const getData = await getResponse.json();

      expect(getData.id).not.toBeNull();
    });

    it('should allow querying on a field', async () => {
      const desc = 'query test';
      const response = await fetch(`${url}/api/posts`, {
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
      const getResponse = await fetch(`${url}/api/posts?where[description][equals]=${desc}`);
      const data = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(data.docs[0].description).toBe(desc);
      expect(data.docs.length).toBe(1);
    });
  });

  describe('Delete', () => {
    it('should allow a post to be deleted', async () => {
      const response = await fetch(`${url}/api/posts`, {
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

      const deleteResponse = await fetch(`${url}/api/posts/${docId}`, {
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
      await fetch(`${url}/api/posts`, {
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

      const getResponse = await fetch(`${url}/api/posts?where[description][equals]=${desc}`);
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
      const req1 = await fetch(`${url}/api/posts`, {
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

      const req2 = await fetch(`${url}/api/posts`, {
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
      const getResponse = await fetch(`${url}/api/posts?where[description][equals]=${desc}&sort=title`);
      const data = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(data.docs.length).toEqual(2);
      expect(data.docs[0].id).toEqual(id1);
      expect(data.docs[1].id).toEqual(id2);

      // Query on shared desc and sort descending
      const getResponseSorted = await fetch(`${url}/api/posts?where[description][equals]=${desc}&sort=-title`);
      const sortedData = await getResponseSorted.json();

      expect(getResponse.status).toBe(200);
      expect(sortedData.docs.length).toEqual(2);
      // Opposite order from first request
      expect(sortedData.docs[0].id).toEqual(id2);
      expect(sortedData.docs[1].id).toEqual(id1);
    });
  });

  describe('Hooks', () => {
    describe('Before', () => {
      it('beforeCreate', async () => {
        const response = await fetch(`${url}/api/hooktests`, {
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

      it('beforeRead', async () => {
        const response = await fetch(`${url}/api/hooktests`, {
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
            hook: 'beforeRead', // Used by hook
          },
          method: 'get',
        });
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.limit).toEqual(1); // Set in our beforeRead hook
      });

      it('beforeUpdate', async () => {
        const createResponse = await fetch(`${url}/api/hooktests`, {
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

        const response = await fetch(`${url}/api/hooktests/${id}`, {
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
        const createResponse = await fetch(`${url}/api/hooktests`, {
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

        const response = await fetch(`${url}/api/hooktests/${id}`, {
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
        const response = await fetch(`${url}/api/hooktests`, {
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
        const response = await fetch(`${url}/api/hooktests`, {
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
        const getResponse = await fetch(`${url}/api/hooktests/${data.doc.id}`);
        const getResponseData = await getResponse.json();
        expect(getResponse.status).toBe(200);
        expect(getResponseData.afterReadHook).toEqual(true);
      });

      it('afterUpdate', async () => {
        const createResponse = await fetch(`${url}/api/hooktests`, {
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

        const response = await fetch(`${url}/api/hooktests/${id}`, {
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
        const createResponse = await fetch(`${url}/api/hooktests`, {
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

        const response = await fetch(`${url}/api/hooktests/${id}`, {
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
});
