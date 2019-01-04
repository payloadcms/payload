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

  it('At least role - exact', () => {
    const roleList = [
      'admin',
      'user',
      'viewer'
    ];
    const req = {
      user: {
        role: 'user'
      }
    };

    middleware.atLeastRole(roleList, 'user')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('At least role - permitted', () => {
    const roleList = [
      'admin',
      'user',
      'viewer'
    ];
    const req = {
      user: {
        role: 'user'
      }
    };

    middleware.atLeastRole(roleList, 'viewer')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('At least role - unauthorized', () => {
    const roleList = [
      'admin',
      'user',
      'viewer'
    ];
    const req = {
      user: {
        role: 'user'
      }
    };

    middleware.atLeastRole(roleList, 'admin')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('At least role - non-existent role', () => {
    const roleList = [
      'admin',
      'user',
      'viewer'
    ];
    const req = {
      user: {
        role: 'user'
      }
    };

    middleware.atLeastRole(roleList, 'invalid')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  })
});
