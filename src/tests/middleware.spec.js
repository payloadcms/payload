import middleware from '../middleware';
import mockExpress from 'jest-mock-express';

let res = null;
let next = null;

beforeEach(() => {
  res = mockExpress.response();
  next = jest.fn();
});

describe('Payload Role Middleware', () => {
  it('Exact role - authorized', () => {
    const req = {
      user: {
        role: 'user'
      }
    };

    middleware.role('user')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('Exact role - unauthorized', () => {
    const req = {
      user: {
        role: 'user'
      }
    };

    middleware.role('admin')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalled();
  });
});
