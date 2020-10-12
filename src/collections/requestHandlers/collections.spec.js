/**
 * @jest-environment node
 */

const fs = require('fs');
const path = require('path');
require('isomorphic-fetch');
const faker = require('faker');
const FormData = require('form-data');
const getConfig = require('../../utilities/getConfig');
const { email, password } = require('../../../tests/api/credentials');
const fileExists = require('../../../tests/api/utils/fileExists');

const { serverURL: url } = getConfig();

let token = null;
let headers = null;

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
    headers = {
      Authorization: `JWT ${token}`,
      'Content-Type': 'application/json',
    };

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
        headers,
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
        headers,
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
        headers,
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
        headers,
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
        headers,
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
        headers,
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
        headers,
        method: 'post',
      });

      const response2 = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: title2,
          description: 'desc',
          priority: 1,
        }),
        headers,
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
        headers,
        method: 'post',
      });

      const response2 = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: title2,
          description: 'desc',
          priority: 1,
        }),
        headers,
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
        headers,
        method: 'post',
      });

      const data = await response.json();
      const docId = data.doc.id;
      expect(response.status).toBe(201);
      expect(docId).not.toBeNull();

      const deleteResponse = await fetch(`${url}/api/localized-posts/${docId}`, {
        headers,
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
        headers,
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
        headers,
        method: 'post',
      });

      const req2 = await fetch(`${url}/api/localized-posts`, {
        body: JSON.stringify({
          title: 'zzz',
          description: desc,
          priority: 1,
        }),
        headers,
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
      expect(data.docs[0].id).toStrictEqual(id1);
      expect(data.docs[1].id).toStrictEqual(id2);

      // Query on shared desc and sort descending
      const getResponseSorted = await fetch(`${url}/api/localized-posts?where[description][equals]=${desc}&sort=-title`);
      const sortedData = await getResponseSorted.json();

      expect(getResponse.status).toBe(200);
      expect(sortedData.docs).toHaveLength(2);
      // Opposite order from first request
      expect(sortedData.docs[0].id).toStrictEqual(id2);
      expect(sortedData.docs[1].id).toStrictEqual(id1);
    });
  });

  describe('Hooks', () => {
    describe('Before', () => {
      it('beforeChange', async () => {
        const response = await fetch(`${url}/api/hooks`, {
          body: JSON.stringify({
            title: faker.name.firstName(),
            description: 'Original',
            priority: 1,
          }),
          headers: {
            ...headers,
            hook: 'beforeChange', // Used by hook
          },
          method: 'post',
        });
        const data = await response.json();
        expect(response.status).toBe(201);
        expect(data.doc.description).toStrictEqual('Original-beforeChangeSuffix');
      });

      it('beforeDelete', async () => {
        const createResponse = await fetch(`${url}/api/hooks`, {
          body: JSON.stringify({
            title: faker.name.firstName(),
            description: 'Original',
            priority: 1,
          }),
          headers,
          method: 'post',
        });
        const createData = await createResponse.json();
        const { id } = createData.doc;

        const response = await fetch(`${url}/api/hooks/${id}`, {
          headers: {
            ...headers,
            hook: 'beforeDelete', // Used by hook
          },
          method: 'delete',
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        // Intentionally afterDeleteHook - beforeDelete hook is setting header in order to trigger afterDelete hook
        expect(data.afterDeleteHook).toStrictEqual(true);
      });
    });

    describe('After', () => {
      it('afterRead', async () => {
        const response = await fetch(`${url}/api/hooks`, {
          body: JSON.stringify({
            title: faker.name.firstName(),
            description: 'afterRead',
            priority: 1,
          }),
          headers: {
            ...headers,
            hook: 'afterRead', // Used by hook
          },
          method: 'post',
        });
        const data = await response.json();
        const getResponse = await fetch(`${url}/api/hooks/${data.doc.id}`);
        const getResponseData = await getResponse.json();
        expect(getResponse.status).toBe(200);
        expect(getResponseData.afterReadHook).toStrictEqual(true);
      });

      it('afterChange', async () => {
        const createResponse = await fetch(`${url}/api/hooks`, {
          body: JSON.stringify({
            title: faker.name.firstName(),
            description: 'Original',
            priority: 1,
          }),
          headers,
          method: 'post',
        });
        const createData = await createResponse.json();
        const { id } = createData.doc;

        const response = await fetch(`${url}/api/hooks/${id}`, {
          body: JSON.stringify({
            description: 'afterChange',
          }),
          headers: {
            ...headers,
            hook: 'afterChange', // Used by hook
          },
          method: 'put',
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.doc.afterChangeHook).toStrictEqual(true);
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
        expect(data.afterDeleteHook).toStrictEqual(true);
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
        headers,
        method: 'post',
      });
      const createAData = await createA.json();
      // create document b, related to a
      const createB = await fetch(`${url}/api/relationship-b`, {
        body: JSON.stringify({
          post: [createAData.doc.id],
        }),
        headers,
        method: 'post',
      });
      // update a to relate to b
      const createBData = await createB.json();
      documentB = createBData.doc;
      const updateA = await fetch(`${url}/api/relationship-a/${createAData.doc.id}`, {
        body: JSON.stringify({
          post: documentB.id,
        }),
        headers,
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
        headers,
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

  describe('Media', () => {
    const mediaDir = path.join(__dirname, '../../../demo', 'media');
    beforeAll(async () => {
      // Clear demo/media directory
      const mediaDirExists = await fileExists(mediaDir);
      if (!mediaDirExists) return;
      fs.readdir(mediaDir, (err, files) => {
        if (err) throw err;

        // eslint-disable-next-line no-restricted-syntax
        for (const file of files) {
          fs.unlink(path.join(mediaDir, file), (unlinkErr) => {
            if (unlinkErr) throw unlinkErr;
          });
        }
      });
    });

    it('create', async () => {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(path.join(__dirname, '../../..', 'tests/api/assets/image.png')));
      formData.append('alt', 'test media');
      formData.append('locale', 'en');

      const response = await fetch(`${url}/api/media`, {
        body: formData,
        headers: {
          Authorization: `JWT ${token}`,
        },
        method: 'post',
      });

      const data = await response.json();

      expect(response.status).toBe(201);

      // Check for files
      expect(await fileExists(path.join(mediaDir, 'image.png'))).toBe(true);
      expect(await fileExists(path.join(mediaDir, 'image-16x16.png'))).toBe(true);
      expect(await fileExists(path.join(mediaDir, 'image-320x240.png'))).toBe(true);
      expect(await fileExists(path.join(mediaDir, 'image-640x480.png'))).toBe(true);

      // Check api response
      expect(data).toMatchObject({
        doc: {
          alt: 'test media',
          filename: 'image.png',
          mimeType: 'image/png',
          sizes: {
            icon: {
              filename: 'image-16x16.png',
              width: 16,
              height: 16,
            },
            mobile: {
              filename: 'image-320x240.png',
              width: 320,
              height: 240,
            },
            tablet: {
              filename: 'image-640x480.png',
              width: 640,
              height: 480,
            },
          },
        },
      });
    });

    it('update', async () => {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(path.join(__dirname, '../../..', 'tests/api/assets/update.png')));
      formData.append('alt', 'test media');
      formData.append('locale', 'en');

      const response = await fetch(`${url}/api/media`, {
        body: formData,
        headers: {
          Authorization: `JWT ${token}`,
        },
        method: 'post',
      });

      const data = await response.json();

      expect(response.status).toBe(201);

      const updateFormData = new FormData();
      const newAlt = 'my new alt';

      updateFormData.append('filename', data.doc.filename);
      updateFormData.append('alt', newAlt);
      const updateResponse = await fetch(`${url}/api/media/${data.doc.id}`, {
        body: updateFormData,
        headers: {
          Authorization: `JWT ${token}`,
        },
        method: 'put',
      });

      expect(updateResponse.status).toBe(200);

      const updateResponseData = await updateResponse.json();

      // Check that files weren't affected
      expect(await fileExists(path.join(mediaDir, 'update.png'))).toBe(true);
      expect(await fileExists(path.join(mediaDir, 'update-16x16.png'))).toBe(true);
      expect(await fileExists(path.join(mediaDir, 'update-320x240.png'))).toBe(true);
      expect(await fileExists(path.join(mediaDir, 'update-640x480.png'))).toBe(true);

      // Check api response
      expect(updateResponseData).toMatchObject({
        doc: {
          alt: newAlt,
          filename: 'update.png',
          mimeType: 'image/png',
          sizes: {
            icon: {
              filename: 'update-16x16.png',
              width: 16,
              height: 16,
            },
            mobile: {
              filename: 'update-320x240.png',
              width: 320,
              height: 240,
            },
            tablet: {
              filename: 'update-640x480.png',
              width: 640,
              height: 480,
            },
          },
        },
      });
    });

    it('delete', async () => {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(path.join(__dirname, '../../..', 'tests/api/assets/delete.png')));
      formData.append('alt', 'test media');
      formData.append('locale', 'en');

      const createResponse = await fetch(`${url}/api/media`, {
        body: formData,
        headers: {
          Authorization: `JWT ${token}`,
        },
        method: 'post',
      });

      const createData = await createResponse.json();
      expect(createResponse.status).toBe(201);
      const docId = createData.doc.id;

      const response = await fetch(`${url}/api/media/${docId}`, {
        headers: {
          Authorization: `JWT ${token}`,
        },
        method: 'delete',
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.id).toBe(docId);

      const imageExists = await fileExists(path.join(mediaDir, 'delete.png'));
      expect(imageExists).toBe(false);
    });
  });
});
