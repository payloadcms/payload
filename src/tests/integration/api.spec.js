/**
 * @jest-environment node
 */

const http = require('http');
const faker = require('faker');
const server = require('../../../demo/server');

describe('API', () => {
  const url = 'http://localhost:3000';
  let token = null;
  const email = 'test@test.com';
  const password = 'test123';

  let localizedPostID;
  const englishPostDesc = faker.lorem.lines(20);
  const spanishPostDesc = faker.lorem.lines(20);

  beforeAll((done) => {
    server.start(done);
  });

  it('should register a first user', async () => {
    const response = await fetch(`${url}/api/first-register`, {
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

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('email');
    expect(data).toHaveProperty('role');
    expect(data).toHaveProperty('createdAt');
  });

  it('should login a user successfully', async () => {
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

    expect(response.status).toBe(200);
    expect(data.token).not.toBeNull();

    ({ token } = data);
  });

  it('should allow a user to be created', async () => {
    const response = await fetch(`${url}/api/users/register`, {
      body: JSON.stringify({
        email: `${faker.name.firstName()}@test.com`,
        password,
      }),
      headers: {
        Authorization: `JWT ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'post',
    });

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('email');
    expect(data).toHaveProperty('role');
    expect(data).toHaveProperty('createdAt');
  });

  it('should allow a post to be created in English', async () => {
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

  it('should allow a localized post to be retrieved in default locale of English', async () => {
    const response = await fetch(`${url}/api/posts/${localizedPostID}`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.description).toBe(englishPostDesc);
  });

  it('should allow a localized post to be retrieved in default locale of English', async () => {
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

  afterAll((done) => {
    server.close(done);
  });
});
