import { Response } from 'express';
import Logger from '../../utilities/logger';
import errorHandler from './errorHandler';
import { APIError } from '../../errors';
import { PayloadRequest } from '../types';
import { SanitizedConfig } from '../../config/types';

const logger = Logger();

const testError = new APIError('test error', 503);

describe('errorHandler', () => {
  const res = generateResponse();
  const next = jest.fn();
  const req = generateRequest() as PayloadRequest;

  it('should send the response with the error', async () => {
    const handler = errorHandler(generateConfig({ debug: true }), logger);
    await handler(testError, req, res, next);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ errors: [{ message: 'test error' }] }),
    );
  });

  it('should include stack trace when config debug is on', async () => {
    const handler = errorHandler(generateConfig({ debug: true }), logger);
    await handler(testError, req, res, next);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ stack: expect.any(String) }));
  });

  it('should not include stack trace when config debug is not set', async () => {
    const handler = errorHandler(generateConfig({ debug: undefined }), logger);
    await handler(testError, req, res, next);
    expect(res.send).toHaveBeenCalledWith(
      expect.not.objectContaining({ stack: expect.any(String) }),
    );
  });

  it('should not include stack trace when config debug is false', async () => {
    const handler = errorHandler(generateConfig({ debug: false }), logger);
    await handler(testError, req, res, next);
    expect(res.send).toHaveBeenCalledWith(
      expect.not.objectContaining({ stack: expect.any(String) }),
    );
  });

  it('should show the status code when given an error with a code', async () => {
    const handler = errorHandler(generateConfig(), logger);
    await handler(testError, req, res, next);
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it('should default to 500 when an error does not have a status code', async () => {
    const handler = errorHandler(generateConfig(), logger);
    testError.status = undefined;
    await handler(testError, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should call payload config afterError hook', async () => {
    const afterError = jest.fn();
    const handler = errorHandler(
      generateConfig({
        hooks: { afterError },
      }),
      logger,
    );
    await handler(testError, req, res, next);
    expect(afterError)
      // eslint-disable-next-line jest/prefer-called-with
      .toHaveBeenCalled();
  });

  it('should call collection config afterError hook', async () => {
    const handler = errorHandler(generateConfig(), logger);
    await handler(testError, req, res, next);
    expect(req.collection.config.hooks.afterError)
      // eslint-disable-next-line jest/prefer-called-with
      .toHaveBeenCalled();
  });
});

function generateResponse() {
  const res = {
    status: jest.fn(),
    send: jest.fn(),
  };

  jest.spyOn(res, 'status').mockImplementation().mockReturnValue(res);
  jest.spyOn(res, 'send').mockImplementation().mockReturnValue(res);
  return res as unknown as Response;
}

function generateRequest(): PayloadRequest {
  return {
    collection: {
      config: {
        hooks: {
          afterError: jest.fn(),
        },
      },
    },
  } as unknown as PayloadRequest;
}

function generateConfig(overrides?: Partial<SanitizedConfig>): SanitizedConfig {
  return {
    debug: false,
    hooks: { afterError: jest.fn() },
    ...overrides,
  } as unknown as SanitizedConfig;
}
