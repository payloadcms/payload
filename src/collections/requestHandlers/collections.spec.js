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

beforeAll(async (done) => {
  const response = await fetch(`${url}/api/login`, {
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

describe('REST', () => {
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

      localizedPostID = data.doc.id;
    });
  });

  describe('Update', () => {
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
    async function createPost(description) {
      const response = await fetch(`${url}/api/posts`, {
        body: JSON.stringify({
          title: faker.name.firstName(),
          description,
          priority: 1,
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
      });

      expect(response.status).toBe(201);
    }

    it('should include metadata', async () => {
      const desc = 'metadataDesc';
      for (let i = 0; i < 12; i += 1) {
      // eslint-disable-next-line no-await-in-loop
        await createPost(desc);
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
  });
});
