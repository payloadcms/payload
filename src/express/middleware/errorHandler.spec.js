import Logger from '../../utilities/logger';
import errorHandler from './errorHandler';
import { APIError } from '../../errors';

const logger = Logger();

const testError = new APIError('test error', 503);

const mockResponse = () => {
  const res = {
    status: jest.fn(),
    send: jest.fn(),
  };

  jest.spyOn(res, 'status').mockImplementation()
    .mockReturnValue(res);

  jest.spyOn(res, 'send').mockImplementation()
    .mockReturnValue(res);
  return res;
};

const mockRequest = async () => {
  const req = {};
  req.collection = {
    config: {
      hooks: {},
    },
  };
  req.collection.config.hooks.afterError = await jest.fn();
  return req;
};

describe('errorHandler', () => {
  let res;
  let req;
  beforeAll(async (done) => {
    res = mockResponse();
    req = await mockRequest();
    done();
  });

  it('should send the response with the error', async () => {
    const handler = errorHandler({ debug: true, hooks: {} }, logger);
    await handler(testError, req, res);
    expect(res.send)
      .toHaveBeenCalledWith(
        expect.objectContaining({ errors: [{ message: 'test error' }] }),
      );
  });

  it('should include stack trace when config debug is on', async () => {
    const handler = errorHandler({ debug: true, hooks: {} }, logger);
    await handler(testError, req, res);
    expect(res.send)
      .toHaveBeenCalledWith(
        expect.objectContaining({ stack: expect.any(String) }),
      );
  });

  it('should not include stack trace when config debug is not set', async () => {
    const handler = errorHandler({ hooks: {} }, logger);
    await handler(testError, req, res);
    expect(res.send)
      .toHaveBeenCalledWith(
        expect.not.objectContaining({ stack: expect.any(String) }),
      );
  });

  it('should not include stack trace when config debug is false', async () => {
    const handler = errorHandler({ debug: false, hooks: {} }, logger);
    await handler(testError, req, res);
    expect(res.send)
      .toHaveBeenCalledWith(
        expect.not.objectContaining({ stack: expect.any(String) }),
      );
  });

  it('should show the status code when given an error with a code', async () => {
    const handler = errorHandler({ debug: false, hooks: {} }, logger);
    await handler(testError, req, res);
    expect(res.status)
      .toHaveBeenCalledWith(
        503,
      );
  });

  it('should default to 500 when an error does not have a status code', async () => {
    const handler = errorHandler({ debug: false, hooks: {} }, logger);
    testError.status = undefined;
    await handler(testError, req, res);
    expect(res.status)
      .toHaveBeenCalledWith(
        500,
      );
  });

  it('should call payload config afterError hook', async () => {
    const afterError = jest.fn();
    const handler = errorHandler({
      debug: false,
      hooks: { afterError },
    }, logger);
    await handler(testError, req, res);
    expect(afterError)
      // eslint-disable-next-line jest/prefer-called-with
      .toHaveBeenCalled();
  });

  it('should call collection config afterError hook', async () => {
    const handler = errorHandler({
      debug: false,
      hooks: {},
    }, logger);
    await handler(testError, req, res);
    expect(req.collection.config.hooks.afterError)
      // eslint-disable-next-line jest/prefer-called-with
      .toHaveBeenCalled();
  });
});
