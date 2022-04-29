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

    it('should not overwrite other locales when updating', async () => {
      const slug = 'updated';
      const esSlug = 'spanish';
      const createResult = await fetch(`${url}/api/default-values`, {
        body: JSON.stringify({
          text: 'unique',
          slug: 'unique',
        }),
        headers,
        method: 'post',
      });

      const createData = await createResult.json();

      const { id } = createData.doc;

      const enResult = await fetch(`${url}/api/default-values/${id}?locale=en`, {
        body: JSON.stringify({
          slug,
        }),
        headers,
        method: 'put',
      });

      const enData = await enResult.json();

      const esResult = await fetch(`${url}/api/default-values/${id}?locale=es`, {
        body: JSON.stringify({
          slug: esSlug,
        }),
        headers,
        method: 'put',
      });

      const esData = await esResult.json();

      const allResult = await fetch(`${url}/api/default-values/${id}?locale=all`, {
        headers,
        method: 'get',
      });

      const allData = await allResult.json();

      expect(createData.doc.slug).toStrictEqual('unique');
      expect(enData.doc.slug).toStrictEqual(slug);
      expect(esData.doc.slug).toStrictEqual(esSlug);
      expect(allData.slug.en).toStrictEqual(slug);
      expect(allData.slug.es).toStrictEqual(esSlug);
    });
  });
});
