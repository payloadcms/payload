/**
 * @jest-environment node
 */

import getConfig from '../../config/load';
import { email, password } from '../../../tests/api/credentials';

require('isomorphic-fetch');

const { serverURL: url } = getConfig();

let token = null;

const navData = {
  en: {
    nav1: {
      text: 'Navigation 1',
      textarea: 'Some navigation text',
    },
    nav2: {
      text: 'Navigation 2',
      textarea: 'Some more navigation text',
    },
  },
  es: {
    nav1: {
      text: 'Navegación 1',
      textarea: 'algún texto de navegación',
    },
    nav2: {
      text: 'Navegación 2',
      textarea: 'un poco más de texto de navegación',
    },
  },
};

describe('Globals - REST', () => {
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

    done();
  });

  describe('Create', () => {
    it('should create one', async () => {
      const response = await fetch(`${url}/api/globals/navigation-array`, {

        body: JSON.stringify({
          array: [
            {
              text: navData.en.nav1.text,
              textarea: navData.en.nav1.textarea,
            },
          ],
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      const { text, textarea } = data.result.array[0];
      expect(text).toStrictEqual(navData.en.nav1.text);
      expect(textarea).toStrictEqual(navData.en.nav1.textarea);
    });
  });

  describe('Update', () => {
    it('should update one', async () => {
      const response = await fetch(`${url}/api/globals/navigation-array`, {

        body: JSON.stringify({
          array: [
            {
              text: navData.en.nav1.text,
              textarea: navData.en.nav1.textarea,
            },
            {
              text: navData.en.nav2.text,
              textarea: navData.en.nav2.textarea,
            },
          ],
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.result.array).toHaveLength(2);
      const { text, textarea } = data.result.array[1];
      expect(text).toStrictEqual(navData.en.nav2.text);
      expect(textarea).toStrictEqual(navData.en.nav2.textarea);
    });

    it('should allow Spanish update', async () => {
      const response = await fetch(`${url}/api/globals/navigation-array?locale=es`, {

        body: JSON.stringify({
          array: [
            {
              text: navData.es.nav1.text,
              textarea: navData.es.nav1.textarea,
            },
            {
              text: navData.es.nav2.text,
              textarea: navData.es.nav2.textarea,
            },
          ],
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.result.array).toHaveLength(2);
      const { text, textarea } = data.result.array[0];
      expect(text).toStrictEqual(navData.es.nav1.text);
      expect(textarea).toStrictEqual(navData.es.nav1.textarea);
    });
  });

  describe('Read', () => {
    it('should read one', async () => {
      const response = await fetch(`${url}/api/globals/navigation-array`, {
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      const { text, textarea } = data.array[0];
      expect(text).toStrictEqual(navData.en.nav1.text);
      expect(textarea).toStrictEqual(navData.en.nav1.textarea);
    });

    it('should read Spanish', async () => {
      const response = await fetch(`${url}/api/globals/navigation-array?locale=es`, {
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      const { text, textarea } = data.array[0];
      expect(text).toStrictEqual(navData.es.nav1.text);
      expect(textarea).toStrictEqual(navData.es.nav1.textarea);
    });
  });
});
