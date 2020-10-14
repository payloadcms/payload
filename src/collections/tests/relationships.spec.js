require('isomorphic-fetch');
const getConfig = require('../../utilities/getConfig');
const { email, password } = require('../../../tests/api/credentials');

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
});
