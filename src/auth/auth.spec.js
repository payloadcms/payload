require('isomorphic-fetch');
const faker = require('faker');
const { email, password } = require('../tests/credentials');

/**
 * @jest-environment node
 */

const config = require('../../demo/payload.config');

const url = config.serverURL;

let token = null;

describe('Users REST API', () => {
  it('should prevent registering a first user', async () => {
    const response = await fetch(`${url}/api/admins/first-register`, {
      body: JSON.stringify({
        email: 'thisuser@shouldbeprevented.com',
        password: 'get-out',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'post',
    });

    expect(response.status).toBe(403);
  });

  it('should login a user successfully', async () => {
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

    expect(response.status).toBe(200);
    expect(data.token).not.toBeNull();

    ({ token } = data);
  });

  it('should return a logged in user from /me', async () => {
    const response = await fetch(`${url}/api/admins/me`, {
      headers: {
        Authorization: `Admin JWT ${token}`,
      },
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.email).not.toBeNull();
  });

  it('should refresh a token and reset its expiration', async () => {
    const response = await fetch(`${url}/api/admins/refresh-token`, {
      method: 'post',
      headers: {
        Authorization: `Admin JWT ${token}`,
      },
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).not.toBeNull();

    token = data.refreshedToken;
  });

  it('should allow forgot-password by email', async () => {
    // TODO: figure out how to spy on payload instance functions
    // const mailSpy = jest.spyOn(payload, 'sendEmail');
    const response = await fetch(`${url}/api/admins/forgot-password`, {
      method: 'post',
      body: JSON.stringify({
        email,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // is not working
    // expect(mailSpy).toHaveBeenCalled();

    expect(response.status).toBe(200);
  });

  it('should allow a user to be created', async () => {
    const response = await fetch(`${url}/api/admins/register`, {
      body: JSON.stringify({
        email: `${faker.name.firstName()}@test.com`,
        password,
        roles: ['editor'],
      }),
      headers: {
        Authorization: `Admin JWT ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'post',
    });

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('doc');

    const { doc } = data;

    expect(doc).toHaveProperty('email');
    expect(doc).toHaveProperty('createdAt');
    expect(doc).toHaveProperty('roles');
  });
});
