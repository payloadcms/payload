import MongoClient from 'mongodb';
import getConfig from '../config/load';
import { email, password, connection } from '../mongoose/testCredentials';

require('isomorphic-fetch');

const { url: mongoURL, port: mongoPort, name: mongoDBName } = connection;

const { serverURL: url } = getConfig();

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
    expect(data.token).toBeDefined();

    ({ token } = data);
  });

  it('should return a logged in user from /me', async () => {
    const response = await fetch(`${url}/api/admins/me`, {
      headers: {
        Authorization: `JWT ${token}`,
      },
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.email).toBeDefined();
  });

  it('should refresh a token and reset its expiration', async () => {
    const response = await fetch(`${url}/api/admins/refresh-token`, {
      method: 'post',
      headers: {
        Authorization: `JWT ${token}`,
      },
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.refreshedToken).toBeDefined();

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
    const response = await fetch(`${url}/api/admins`, {
      body: JSON.stringify({
        email: 'name@test.com',
        password,
        roles: ['editor'],
      }),
      headers: {
        Authorization: `JWT ${token}`,
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

  it('should allow verification of a user', async () => {
    const emailToVerify = 'verify@me.com';
    const response = await fetch(`${url}/api/public-users`, {
      body: JSON.stringify({
        email: emailToVerify,
        password,
        roles: ['editor'],
      }),
      headers: {
        Authorization: `JWT ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'post',
    });

    expect(response.status).toBe(201);
    const client = await MongoClient.connect(`${mongoURL}:${mongoPort}`, {
      useUnifiedTopology: true,
    });

    const db = client.db(mongoDBName);
    const userResult = await db.collection('public-users').findOne({ email: emailToVerify });
    const { _verified, _verificationToken } = userResult;

    expect(_verified).toBe(false);
    expect(_verificationToken).toBeDefined();

    const verificationResponse = await fetch(`${url}/api/public-users/verify/${_verificationToken}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'post',
    });

    expect(verificationResponse.status).toBe(200);

    const afterVerifyResult = await db.collection('public-users').findOne({ email: emailToVerify });
    const { _verified: afterVerified, _verificationToken: afterToken } = afterVerifyResult;
    expect(afterVerified).toBe(true);
    expect(afterToken).toBeUndefined();
  });

  describe('Account Locking', () => {
    const userEmail = 'lock@me.com';
    let db;
    beforeAll(async () => {
      const client = await MongoClient.connect(`${mongoURL}:${mongoPort}`);
      db = client.db(mongoDBName);
    });

    it('should lock the user after too many attempts', async () => {
      await fetch(`${url}/api/admins`, {
        body: JSON.stringify({
          email: userEmail,
          password,
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
      });

      const tryLogin = () => fetch(`${url}/api/admins/login`, {
        body: JSON.stringify({
          email: userEmail,
          password: 'bad',
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
      });

      await tryLogin();
      await tryLogin();
      await tryLogin();
      await tryLogin();
      await tryLogin();

      const userResult = await db.collection('admins').findOne({ email: userEmail });
      const { loginAttempts, lockUntil } = userResult;

      expect(loginAttempts).toBe(5);
      expect(lockUntil).toBeDefined();
    });

    it('should unlock account once lockUntil period is over', async () => {
      await db.collection('admins').findOneAndUpdate(
        { email: userEmail },
        { $set: { lockUntil: Date.now() - (605 * 1000) } },
      );

      await fetch(`${url}/api/admins/login`, {
        body: JSON.stringify({
          email: userEmail,
          password,
        }),
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
      });

      const userResult = await db.collection('admins').findOne({ email: userEmail });
      const { loginAttempts, lockUntil } = userResult;

      expect(loginAttempts).toBe(0);
      expect(lockUntil).toBeUndefined();
    });
  });
});
