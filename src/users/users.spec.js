require('isomorphic-fetch');
const faker = require('faker');
const { email, password } = require('../tests/credentials');

/**
 * @jest-environment node
 */

const config = require('../../demo/payload.config');

describe('Users REST API', () => {
  const url = config.serverURL;
  const usernameField = config.user.auth.useAsUsername;

  let token = null;

  it('should prevent registering a first user', async () => {
    const response = await fetch(`${url}/api/first-register`, {
      body: JSON.stringify({
        [usernameField]: 'thisuser@shouldbeprevented.com',
        password: 'get-out',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'post',
    });

    const data = await response.json();

    expect(response.status).toBe(403);
  });

  it('should login a user successfully', async () => {
    const response = await fetch(`${url}/api/login`, {
      body: JSON.stringify({
        [usernameField]: email,
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

  it('should return a logged in user from /me', async () => {
    const response = await fetch(`${url}/api/me`, {
      method: 'post',
      headers: {
        Authorization: `JWT ${token}`,
      },
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data[usernameField]).not.toBeNull();
  });

  it('should allow a user to be created', async () => {
    const response = await fetch(`${url}/api/users/register`, {
      body: JSON.stringify({
        [usernameField]: `${faker.name.firstName()}@test.com`,
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
    expect(data).toHaveProperty(usernameField);
    expect(data).toHaveProperty('role');
    expect(data).toHaveProperty('createdAt');
  });
});
