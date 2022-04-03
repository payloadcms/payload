/**
 * @jest-environment node
 */
import { request, GraphQLClient } from 'graphql-request';
import getConfig from '../../config/load';
import { email, password } from '../../mongoose/testCredentials';

require('isomorphic-fetch');

const config = getConfig();

const url = `${config.serverURL}${config.routes.api}${config.routes.graphQL}`;

let client = null;
let token = null;

describe('GrahpQL Preferences', () => {
  beforeAll(async (done) => {
    const query = `
      mutation {
        loginAdmin(
          email: "${email}",
          password: "${password}"
        ) {
          token
        }
      }`;

    const response = await request(url, query);

    token = response.loginAdmin.token;

    client = new GraphQLClient(url, { headers: { Authorization: `JWT ${token}` } });

    done();
  });

  describe('Update', () => {
    it('should allow a preference to be saved', async () => {
      const key = 'preference-key';
      const value = 'preference-value';

      // language=graphQL
      const query = `mutation {
          updatePreference(key: "${key}", value: "${value}") {
          key
          value
        }
      }`;

      const response = await client.request(query);

      const data = response.updatePreference;

      expect(data.key).toBe(key);
      expect(data.value).toBe(value);
    });
  });

  describe('Read', () => {
    it('should be able to read user preference', async () => {
      const key = 'preference-key';
      const value = 'preference-value';

      // language=graphQL
      const query = `mutation {
          updatePreference(key: "${key}", value: "${value}") {
          key
          value
        }
      }`;

      const response = await client.request(query);

      const { key: responseKey, value: responseValue } = response.updatePreference;
      // language=graphQL
      const readQuery = `query {
        Preference(key: "${responseKey}") {
          key
          value
        }
      }`;
      const readResponse = await client.request(readQuery);

      expect(responseKey).toStrictEqual(key);
      expect(readResponse.Preference.key).toStrictEqual(key);
      expect(responseValue).toStrictEqual(value);
      expect(readResponse.Preference.value).toStrictEqual(value);
    });
  });

  describe('Delete', () => {
    it('should be able to delete a preference', async () => {
      const key = 'gql-delete';
      const value = 'description';

      // language=graphQL
      const query = `mutation {
            updatePreference(key: "${key}" value: "${value}") {
            key
            value
          }
        }`;

      const response = await client.request(query);

      const { key: responseKey } = response.updatePreference;
      // language=graphQL
      const deleteMutation = `mutation {
        deletePreference(key: "${key}") {
          key
          value
        }
      }`;
      const deleteResponse = await client.request(deleteMutation);
      const deleteKey = deleteResponse.deletePreference.key;

      expect(responseKey).toStrictEqual(key);
      expect(deleteKey).toStrictEqual(key);
    });
  });

  it('should return null when query key is not found', async () => {
    const key = 'bad-key';
    const readQuery = `query {
        Preference(key: "${key}") {
          key
          value
        }
      }`;
    const response = await client.request(readQuery);

    expect(response.Preference).toBeNull();
  });
});
