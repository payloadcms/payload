/**
 * @jest-environment node
 */

require('isomorphic-fetch');
const faker = require('faker');
const config = require('../../../demo/payload.config');
const { email, password } = require('../../tests/credentials');

const url = config.serverURL;

let token = null;

let localizedPostID;
const englishPostDesc = faker.lorem.lines(20);
const spanishPostDesc = faker.lorem.lines(20);

beforeAll(async (done) => {
  const response = await fetch(`${url}/api/login`, {
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

describe('Collection REST Create', () => {
  it('should allow a post to be created', async () => {
    const response = await fetch(`${url}/api/posts`, {
      body: JSON.stringify({
        title: faker.name.firstName(),
        description: englishPostDesc,
        priority: 1,
      }),
      headers: {
        Authorization: `JWT ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'post',
    });

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.doc.title).not.toBeNull();
    expect(data.doc.id).not.toBeNull();

    localizedPostID = data.doc.id;
  });
});

describe('Localized Collection REST Update', () => {
  it('should allow a Spanish locale to be added to an existing post', async () => {
    const response = await fetch(`${url}/api/posts/${localizedPostID}?locale=es`, {
      body: JSON.stringify({
        title: `Spanish-${faker.name.firstName()}`,
        description: spanishPostDesc,
        priority: 1,
      }),
      headers: {
        Authorization: `JWT ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'put',
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.doc.description).toBe(spanishPostDesc);
  });
});

describe('Localized Collection REST Read', () => {
  it('should allow a localized post to be retrieved in unspecified locale, defaulting to English', async () => {
    const response = await fetch(`${url}/api/posts/${localizedPostID}`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.description).toBe(englishPostDesc);
  });

  it('should allow a localized post to be retrieved in specified English locale', async () => {
    const response = await fetch(`${url}/api/posts/${localizedPostID}?locale=en`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.description).toBe(englishPostDesc);
  });

  it('should allow a localized post to be retrieved in Spanish', async () => {
    const response = await fetch(`${url}/api/posts/${localizedPostID}?locale=es`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.description).toBe(spanishPostDesc);
  });

  it('should allow a localized post to be retrieved in all locales', async () => {
    const response = await fetch(`${url}/api/posts/${localizedPostID}?locale=all`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.description.es).toBe(spanishPostDesc);
    expect(data.description.en).toBe(englishPostDesc);
  });
});
