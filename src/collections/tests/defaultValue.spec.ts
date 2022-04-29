import getConfig from '../../config/load';
import { email, password } from '../../mongoose/testCredentials';

require('isomorphic-fetch');

const { serverURL: url } = getConfig();

let token = null;
let headers = null;

describe('DefaultValue - REST', () => {
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

  describe('DefaultValues', () => {
    let document;
    beforeAll(async (done) => {
      const result = await fetch(`${url}/api/default-values`, {
        body: JSON.stringify({}),
        headers,
        method: 'post',
      });

      const data = await result.json();
      document = data.doc;
      done();
    });

    it('should create with defaultValues saved', async () => {
      expect(document.id).toBeDefined();
      expect(document.function).toStrictEqual('function');
      expect(document.asyncText).toStrictEqual('asyncFunction');
      expect(document.array[0].arrayText1).toStrictEqual('Get out');
      expect(document.group.nestedText1).toStrictEqual('this should take priority');
      expect(document.group.nestedText2).toStrictEqual('nested default text 2');
      expect(document.group.nestedText3).toStrictEqual('neat');
    });
  });
});
