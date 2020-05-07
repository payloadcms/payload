const errorHandler = require('./errorHandler');
const APIError = require('./APIError');

const testError = new APIError('test error', 503);

const mockResponse = () => {
  const res = {};
  res.status = jest.fn()
    .mockReturnValue(res);
  res.send = jest.fn()
    .mockReturnValue(res);
  return res;
};

describe('errorHandler', () => {
  let res;
  const req = {};
  beforeAll(async (done) => {
    res = mockResponse();
    done();
  });

  it('should send the response with the error', () => {
    const handler = errorHandler({ debug: true });
    handler(testError, req, res);
    expect(res.send)
      .toHaveBeenCalledWith(
        expect.objectContaining({ error: 'test error' }),
      );
  });

  it('should include stack trace when config debug is on', () => {
    const handler = errorHandler({ debug: true });
    handler(testError, req, res);
    expect(res.send)
      .toHaveBeenCalledWith(
        expect.objectContaining({ stack: expect.any(String) }),
      );
  });

  it('should not include stack trace when config debug is not set', () => {
    const handler = errorHandler({});
    handler(testError, req, res);
    expect(res.send)
      .toHaveBeenCalledWith(
        expect.not.objectContaining({ stack: expect.any(String) }),
      );
  });

  it('should not include stack trace when config debug is false', () => {
    const handler = errorHandler({ debug: false });
    handler(testError, req, res);
    expect(res.send)
      .toHaveBeenCalledWith(
        expect.not.objectContaining({ stack: expect.any(String) }),
      );
  });

  it('should show the status code when given an error with a code', () => {
    const handler = errorHandler({ debug: false });
    handler(testError, req, res);
    expect(res.status)
      .toHaveBeenCalledWith(
        503,
      );
  });

  it('should default to 500 when an error does not have a status code', () => {
    const handler = errorHandler({ debug: false });
    testError.status = undefined;
    handler(testError, req, res);
    expect(res.status)
      .toHaveBeenCalledWith(
        500,
      );
  });
});
