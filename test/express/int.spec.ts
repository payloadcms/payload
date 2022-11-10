import mongoose from 'mongoose';
import payload from '../../src';
import jwtStrategy from '../../src/auth/strategies/jwt';
import { NextFunction, Request, Response } from 'express';
import { initPayloadTest } from '../helpers/configHelpers';
import { slug } from './config';
import { devUser } from '../credentials';

require('isomorphic-fetch');


jest.mock('../../src/collections/operations/findByID', () => {
  return {
    __esModule: true,
    default: jest.fn(() => Promise.resolve({email: 'dev@payloadcms.com'}))
  }
})
import * as findByID from '../../src/collections/operations/findByID';
const mockedFindByID = findByID.default as jest.MockedFunction<typeof findByID.default>;

jest.mock('../../src/auth/getExtractJWT', () => {
  return {
    __esModule: true,
    default: jest.fn(() => () => 'token')
  }
})
import * as getExtractJWT from '../../src/auth/getExtractJWT';
const mockedGetExtractJWT = getExtractJWT.default as jest.MockedFunction<typeof getExtractJWT.default>;

import passport from 'passport';

const { email, password } = devUser;


describe('Express', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeAll(async () => {
    await initPayloadTest({ __dirname, init: { local: false } });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await payload.mongoMemoryServer.stop();
  });

  beforeEach(() => {
    mockRequest = {
      url: "test"
    };
  })

  describe('middleware', () => {
    let token: string | undefined;
    beforeAll(async () => {
      const data = await payload.login({
        collection: slug,
        data: {email, password}
      })

      token = data.token;
    });

    it('jwt strategy to retrieve user from request token', async () => {
      mockedGetExtractJWT.mockReturnValue(() => token ?? null);

      await passport.authenticate(jwtStrategy(payload), {
          session: false,
      })(mockRequest, mockResponse, nextFunction);

      expect(mockRequest.user).toBeDefined();
      expect(nextFunction).toBeCalledTimes(1);
      expect(mockedFindByID).toBeCalledTimes(0); // Expect to fail here. Instead of retrieving user from DB, it could be retrieved from request token
    });
  });
});
