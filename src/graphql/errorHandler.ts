import { GraphQLFormattedError } from 'graphql';
import utilities from '../utilities/logger';
import { PayloadRequestInfo } from './index';
import { AfterErrorHook } from '../errors/types';

const logger = utilities();

type Arguments = {
  info: PayloadRequestInfo,
  debug: boolean,
  afterError: AfterErrorHook[],
}

const errorHandler = async ({
  info,
  debug,
  afterError,
}: Arguments): Promise<GraphQLFormattedError[]> => Promise.all(info.result.errors.map(async (error) => {
  logger.error(error.stack);

  let response: GraphQLFormattedError = {
    message: error.message,
    locations: error.locations,
    path: error.path,
    extensions: {
      name: error?.originalError?.name || undefined,
      data: (error && error.originalError && error.originalError.data) || undefined,
      stack: debug ? error.stack : undefined,
    },
  };

  await afterError.reduce(async (priorHook, hook) => {
    await priorHook;
    try {
      ({ response } = (hook({
        error,
        response,
        req: info.context.req,
      }) || { response }) as { response: GraphQLFormattedError});
    } catch (hookError) {
      logger.error(hookError);
    }
  }, Promise.resolve());

  return response;
}));

export default errorHandler;
