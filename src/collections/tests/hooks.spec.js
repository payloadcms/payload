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

  describe('Hooks', () => {
    describe('Before', () => {
      it('beforeChange', async () => {
        const response = await fetch(`${url}/api/hooks`, {
          body: JSON.stringify({
            title: 'title',
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
            title: 'title',
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
            title: 'title',
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
            title: 'title',
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
            title: 'title',
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
});
