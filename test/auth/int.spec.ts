import mongoose from 'mongoose';
import payload from '../../src';
import { initPayloadTest } from '../helpers/configHelpers';
import { slug } from './config';
import { devUser } from '../credentials';

require('isomorphic-fetch');

let apiUrl;

const headers = {
  'Content-Type': 'application/json',
};
const { email, password } = devUser;

describe('Auth', () => {
  beforeAll(async () => {
    const { serverURL } = await initPayloadTest({ __dirname, init: { local: false } });
    apiUrl = `${serverURL}/api`;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await payload.mongoMemoryServer.stop();
  });

  describe('admin user', () => {
    beforeAll(async () => {
      await fetch(`${apiUrl}/${slug}/first-register`, {
        body: JSON.stringify({
          email,
          password,
        }),
        headers,
        method: 'post',
      });
    });

    it('should prevent registering a new first user', async () => {
      const response = await fetch(`${apiUrl}/${slug}/first-register`, {
        body: JSON.stringify({
          email: 'thisuser@shouldbeprevented.com',
          password: 'get-out',
        }),
        headers,
        method: 'post',
      });

      expect(response.status).toBe(403);
    });

    it('should login a user successfully', async () => {
      const response = await fetch(`${apiUrl}/${slug}/login`, {
        body: JSON.stringify({
          email,
          password,
        }),
        headers,
        method: 'post',
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.token).toBeDefined();
    });

    describe('logged in', () => {
      let token: string | undefined;
      beforeAll(async () => {
        const response = await fetch(`${apiUrl}/${slug}/login`, {
          body: JSON.stringify({
            email,
            password,
          }),
          headers,
          method: 'post',
        });

        const data = await response.json();
        token = data.token;
      });

      it('should return a logged in user from /me', async () => {
        const response = await fetch(`${apiUrl}/${slug}/me`, {
          headers: {
            ...headers,
            Authorization: `JWT ${token}`,
          },
        });

        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.user.email).toBeDefined();
      });


      it('should allow authentication with an API key with useAPIKey', async () => {
        const apiKey = '0123456789ABCDEFGH';
        const user = await payload.create({
          collection: slug,
          data: {
            email: 'dev@example.com',
            password: 'test',
            apiKey,
          },
        });
        const response = await fetch(`${apiUrl}/${slug}/me`, {
          headers: {
            ...headers,
            Authorization: `${slug} API-Key ${user.apiKey}`,
          },
        });

        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.user.email).toBeDefined();
        expect(data.user.apiKey).toStrictEqual(apiKey);
      });

      it('should refresh a token and reset its expiration', async () => {
        const response = await fetch(`${apiUrl}/${slug}/refresh-token`, {
          method: 'post',
          headers: {
            Authorization: `JWT ${token}`,
          },
        });

        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.refreshedToken).toBeDefined();
      });

      it('should allow a user to be created', async () => {
        const response = await fetch(`${apiUrl}/${slug}`, {
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

      it.skip('should allow verification of a user', async () => {
        const emailToVerify = 'verify@me.com';
        const response = await fetch(`${apiUrl}/public-users`, {
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
        // const client = await MongoClient.connect(`${mongoURL}:${mongoPort}`, {
        //   useUnifiedTopology: true,
        // });

        // const db = client.db(mongoDBName);
        const { db } = mongoose.connection;
        const userResult = await db.collection('public-users').findOne({ email: emailToVerify });
        // @ts-expect-error trust
        const { _verified, _verificationToken } = userResult;

        expect(_verified).toBe(false);
        expect(_verificationToken).toBeDefined();

        const verificationResponse = await fetch(`${apiUrl}/public-users/verify/${_verificationToken}`, {
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

        const tryLogin = async () => {
          await fetch(`${apiUrl}/${slug}/login`, {
            body: JSON.stringify({
              email: userEmail,
              password: 'bad',
            }),
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'post',
          });
          // expect(loginRes.status).toEqual(401);
        };

        beforeAll(async () => {
          const response = await fetch(`${apiUrl}/${slug}/login`, {
            body: JSON.stringify({
              email,
              password,
            }),
            headers,
            method: 'post',
          });

          const data = await response.json();
          token = data.token;

          // New user to lock
          await fetch(`${apiUrl}/${slug}`, {
            body: JSON.stringify({
              email: userEmail,
              password,
            }),
            headers: {
              'Content-Type': 'application/json',
              Authorization: `JWT ${token}`,
            },
            method: 'post',
          });
        });

        it('should lock the user after too many attempts', async () => {
          await tryLogin();
          await tryLogin();

          const userResult = await mongoose.connection.db.collection(slug).findOne<any>({ email: userEmail });
          const { loginAttempts, lockUntil } = userResult;

          expect(loginAttempts).toBe(2);
          expect(lockUntil).toBeDefined();
        });

        it('should unlock account once lockUntil period is over', async () => {
          // Lock user
          await tryLogin();
          await tryLogin();

          // set lockUntil
          await mongoose.connection.db
            .collection(slug)
            .findOneAndUpdate({ email: userEmail }, { $set: { lockUntil: Date.now() - 605 * 1000 } });

          // login
          await fetch(`${apiUrl}/${slug}/login`, {
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

          const userResult = await mongoose.connection.db
            .collection(slug)
            .findOne<any>({ email: userEmail });
          const { loginAttempts, lockUntil } = userResult;

          expect(loginAttempts).toBe(0);
          expect(lockUntil).toBeNull();
        });
      });
    });

    it('should allow forgot-password by email', async () => {
      // TODO: Spy on payload sendEmail function
      const response = await fetch(`${apiUrl}/${slug}/forgot-password`, {
        method: 'post',
        body: JSON.stringify({
          email,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // expect(mailSpy).toHaveBeenCalled();

      expect(response.status).toBe(200);
    });
  });

  describe('API Key', () => {
    it('should authenticate via the correct API key user', async () => {
      const usersQuery = await payload.find({
        collection: 'api-keys',
      });

      const [user1, user2] = usersQuery.docs;

      const success = await fetch(`${apiUrl}/api-keys/${user2.id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `api-keys API-Key ${user2.apiKey}`,
        },
      }).then((res) => res.json());

      expect(success.apiKey).toStrictEqual(user2.apiKey);

      const fail = await fetch(`${apiUrl}/api-keys/${user1.id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `api-keys API-Key ${user2.apiKey}`,
        },
      });

      expect(fail.status).toStrictEqual(404);
    });
  });
});
