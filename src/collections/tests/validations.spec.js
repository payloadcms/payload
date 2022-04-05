import getConfig from '../../config/load';
import { email, password } from '../../mongoose/testCredentials';

require('isomorphic-fetch');

const { serverURL: url } = getConfig();

let token = null;
let headers = null;

describe('Validations - REST', () => {
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

  describe('Validations', () => {
    let validation;

    beforeAll(async (done) => {
      const result = await fetch(`${url}/api/validations`, {
        body: JSON.stringify({
          validationOptions: 'ok',
          text: 'test',
          lessThan10: 9,
          greaterThan10LessThan50: 20,
          atLeast3Rows: [
            { greaterThan30: 40 },
            { greaterThan30: 50 },
            { greaterThan30: 60 },
          ],
          array: [
            { lessThan20: 10 },
          ],
        }),
        headers,
        method: 'post',
      });

      const data = await result.json();
      validation = data.doc;
      done();
    });

    it('should create with custom validation', async () => {
      expect(validation.id).toBeDefined();
    });
    it('should update with custom validation', async () => {
      const result = await fetch(`${url}/api/validations/${validation.id}`, {
        body: JSON.stringify({
          validationOptions: 'update',
        }),
        headers,
        method: 'put',
      });

      const data = await result.json();
      validation = data.doc;

      expect(validation.validationOptions).toStrictEqual('update');
    });
  });
});
