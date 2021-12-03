import { GraphQLClient } from 'graphql-request';
import getConfig from '../../config/load';
import { email, password } from '../../mongoose/testCredentials';

require('isomorphic-fetch');

const { serverURL, routes } = getConfig();

let token = null;
let headers = null;

describe('GeoJSON', () => {
  beforeAll(async (done) => {
    const response = await fetch(`${serverURL}/api/admins/login`, {
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

  describe('Point Field - REST', () => {
    const location = [10, 20];
    const localizedPoint = [30, 40];
    const group = { point: [15, 25] };
    let doc;

    beforeAll(async (done) => {
      const create = await fetch(`${serverURL}/api/geolocation`, {
        body: JSON.stringify({ location, localizedPoint, group }),
        headers,
        method: 'post',
      });
      ({ doc } = await create.json());

      done();
    });

    it('should create and read collections with points', async () => {
      expect(doc.id).toBeDefined();
      expect(doc.location).toStrictEqual(location);
      expect(doc.localizedPoint).toStrictEqual(localizedPoint);
    });

    it('should query where near point', async () => {
      const [lng, lat] = location;
      const hitResponse = await fetch(`${serverURL}/api/geolocation?where[location][near]=${lng + 0.01},${lat + 0.01},10000`, {
        headers,
        method: 'get',
      });
      const hitData = await hitResponse.json();
      const hitDocs = hitData.docs;

      const missResponse = await fetch(`${serverURL}/api/geolocation?where[location][near]=-${lng},-${lat},5000`, {
        headers,
        method: 'get',
      });
      const missData = await missResponse.json();
      const missDocs = missData.docs;

      expect(hitDocs).toHaveLength(1);
      expect(missDocs).toHaveLength(0);
    });

    it('should query where near localized point', async () => {
      const [lng, lat] = localizedPoint;
      const hitResponse = await fetch(`${serverURL}/api/geolocation?where[localizedPoint][near]=${lng + 0.01},${lat + 0.01},10000`, {
        headers,
        method: 'get',
      });
      const hitData = await hitResponse.json();
      const hitDocs = hitData.docs;

      const missResponse = await fetch(`${serverURL}/api/geolocation?where[localizedPoint][near]=-${lng},-${lat},5000`, {
        headers,
        method: 'get',
      });
      const missData = await missResponse.json();
      const missDocs = missData.docs;

      expect(hitDocs).toHaveLength(1);
      expect(missDocs).toHaveLength(0);
    });

    it('should query near a nested point', async () => {
      const [x, y] = group.point;
      const hitResponse = await fetch(`${serverURL}/api/geolocation?where[group.point][near]=${x + 0.01},${y + 0.01},10000`, {
        headers,
        method: 'get',
      });
      const hitData = await hitResponse.json();
      const hitDocs = hitData.docs;

      const missResponse = await fetch(`${serverURL}/api/geolocation?where[group.point][near]=-${x},-${y},5000`, {
        headers,
        method: 'get',
      });
      const missData = await missResponse.json();
      const missDocs = missData.docs;

      expect(hitDocs).toHaveLength(1);
      expect(missDocs).toHaveLength(0);
    });
  });

  describe('Point Field - GraphQL', () => {
    const url = `${serverURL}${routes.api}${routes.graphQL}`;
    let client = null;
    const location = [50, 60];
    const localizedPoint = [70, 80];
    const group = { point: [50.5, 60.5] };
    let doc;

    beforeAll(async (done) => {
      client = new GraphQLClient(url, { headers: { Authorization: `JWT ${token}` } });

      // language=graphQL
      const query = `mutation {
            createGeolocation (
              data: {
                location: [${location[0]}, ${location[1]}],
                localizedPoint: [${localizedPoint[0]}, ${localizedPoint[1]}],
                group: {
                  point: [${group.point[0]}, ${group.point[1]}]
                }
              }
              ) {
            id
            location
            localizedPoint
          }
        }`;

      const response = await client.request(query);

      const { id } = response.createGeolocation;
      // language=graphQL
      const readQuery = `query {
        Geolocation(id: "${id}") {
          id
          location
          localizedPoint
        }
      }`;
      const readResponse = await client.request(readQuery);
      doc = readResponse.Geolocation;
      done();
    });

    it('should create and read collections with points', async () => {
      expect(doc.id).toBeDefined();
      expect(doc.location).toStrictEqual(location);
      expect(doc.localizedPoint).toStrictEqual(localizedPoint);
    });

    it('should query where near point', async () => {
      const [lng, lat] = location;
      // language=graphQL
      const hitQuery = `query getGeos {
        Geolocations(where: { location: { near: [${lng + 0.01},${lat + 0.01},10000]}}) {
          docs {
            id
            location
            localizedPoint
          }
        }
      }`;
      const hitResponse = await client.request(hitQuery);
      const hitDocs = hitResponse.Geolocations.docs;

      const missQuery = `query getGeos {
        Geolocations(where: { location: { near: [${-lng},${-lat},10000]}}) {
          docs {
            id
            location
            localizedPoint
          }
        }
      }`;
      const missResponse = await client.request(missQuery);
      const missDocs = missResponse.Geolocations.docs;

      expect(hitDocs).toHaveLength(1);
      expect(missDocs).toHaveLength(0);
    });

    it('should query where near a point in a group', async () => {
      const [x, y] = group.point;
      // language=graphQL
      const hitQuery = `query getGeos {
        Geolocations(where: { group__point: { near: [${x + 0.01},${y + 0.01},10000]}}) {
          docs {
            id
            group {
              point
            }
          }
        }
      }`;
      const hitResponse = await client.request(hitQuery);
      const hitDocs = hitResponse.Geolocations.docs;

      const missQuery = `query getGeos {
        Geolocations(where: { group__point: { near: [${-x},${-y},10000]}}) {
          docs {
            id
            group {
              point
            }
          }
        }
      }`;
      const missResponse = await client.request(missQuery);
      const missDocs = missResponse.Geolocations.docs;

      expect(hitDocs).toHaveLength(1);
      expect(missDocs).toHaveLength(0);
    });
  });
});
