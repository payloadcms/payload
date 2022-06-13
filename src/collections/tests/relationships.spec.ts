import getConfig from '../../config/load';
import { email, password } from '../../mongoose/testCredentials';

require('isomorphic-fetch');

const { serverURL: url } = getConfig();

let token = null;
let headers = null;

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

  describe('Relationships', () => {
    let documentA;
    let documentB;
    let strictAccessDoc;

    beforeAll(async (done) => {
      const strictAccessRes = await fetch(`${url}/api/strict-access`, {
        body: JSON.stringify({
          address: '123 Test Lane',
          city: 'Grand Rapids',
          state: 'MI',
          zip: 49504,
        }),
        headers,
        method: 'post',
      });

      const strictAccessJSON = await strictAccessRes.json();
      strictAccessDoc = strictAccessJSON.doc;

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
          strictAccess: strictAccessDoc.id,
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
          postMaxDepth: documentB.id,
        }),
        headers,
        method: 'put',
      });
      const updateAData = await updateA.json();
      documentA = updateAData.doc;
      done();
    });

    it('should create and read collections with relationships', async () => {
      expect(documentA.post).toBeDefined();
      expect(documentB.post).toHaveLength(1);
    });

    it('should prevent an unauthorized population of strict access', async () => {
      const response = await fetch(`${url}/api/relationship-b/${documentB.id}`);
      const data = await response.json();

      expect(typeof data.strictAccess).not.toBe('object');
    });

    it('should populate strict access when authorized', async () => {
      const response = await fetch(`${url}/api/relationship-b/${documentB.id}`, {
        headers,
      });

      const data = await response.json();
      expect(typeof data.strictAccess).toBe('object');
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

    it('should respect max depth at the field level', async () => {
      const response = await fetch(`${url}/api/relationship-a?depth=1`, {
        headers,
        method: 'get',
      });
      const data = await response.json();
      const [doc] = data.docs;
      // asserts postMaxDepth is not populated
      expect(doc.postMaxDepth).toBe(documentB.id);
      expect(doc.postMaxDepth).not.toHaveProperty('post');
    });

    it('should allow a custom id relation', async () => {
      const customID = {
        id: 30,
        name: 'custom',
      };

      const newCustomID = await fetch(`${url}/api/custom-id`, {
        headers,
        body: JSON.stringify(customID),
        method: 'post',
      });

      const custom = await newCustomID.json();
      const response = await fetch(`${url}/api/relationship-a/${documentA.id}`, {
        headers,
        body: JSON.stringify({
          ...documentA,
          post: documentB.id,
          customID: [custom.doc.id],
        }),
        method: 'put',
      });
      const { doc } = await response.json();
      expect(doc.customID[0].id).toBe(customID.id);
    });

    it('should allow a custom id relation and parse the id type', async () => {
      const customID = {
        id: '40',
        name: 'custom',
      };

      const newCustomID = await fetch(`${url}/api/custom-id`, {
        headers,
        body: JSON.stringify(customID),
        method: 'post',
      });

      const custom = await newCustomID.json();
      const response = await fetch(`${url}/api/relationship-a/${documentA.id}`, {
        headers,
        body: JSON.stringify({
          ...documentA,
          post: documentB.id,
          customID: [custom.doc.id],
        }),
        method: 'put',
      });
      const { doc } = await response.json();

      expect(custom.doc.id).toBe(parseFloat(customID.id));
      expect(doc.customID[0].id).toBe(parseFloat(customID.id));
    });

    it('should use filterOptions to limit relationship options', async () => {
      // update documentB to disable relations
      await fetch(`${url}/api/relationship-b/${documentB.id}`, {
        headers,
        body: JSON.stringify({
          disableRelation: true,
        }),
        method: 'put',
      });

      // attempt to save relationship to documentB
      const response = await fetch(`${url}/api/relationship-a/${documentA.id}`, {
        headers,
        body: JSON.stringify({
          filterRelationship: documentB.id,
        }),
        method: 'put',
      });

      const result = await response.json();

      expect(result.errors).toBeDefined();
    });
  });
});
