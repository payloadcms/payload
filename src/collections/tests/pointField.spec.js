import getConfig from '../../config/load';
import { email, password } from '../../mongoose/testCredentials';

require('isomorphic-fetch');

const { serverURL: url } = getConfig();

let token = null;
let headers = null;

describe('GeoJSON', () => {
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

  describe('Point Field', () => {
    const location = {
      coordinates: [100, 200],
    };
    let doc;

    beforeAll(async (done) => {
      // create document a
      const create = await fetch(`${url}/api/geolocation`, {
        body: JSON.stringify({ location }),
        headers,
        method: 'post',
      });
      ({ doc } = await create.json());

      done();
    });

    it('should create and read collections with points', async () => {
      expect(doc).not.toBeNull();
      console.log(doc);
    });

    it('should query for nearest point', async () => {
      const q = `${url}/api/geolocation?location[near]=${location.coordinates}`;
      console.log(q);
      const response = await fetch(`${url}/api/geolocation?where[location][near]=${location.coordinates}`, {
        headers,
        method: 'get',
      });
      const data = await response.json();
      [doc] = data.docs;

      expect(data.docs).toHaveLength(1);
    });
  });
});
