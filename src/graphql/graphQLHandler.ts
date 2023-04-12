import { Response } from 'express';
import { createHandler } from 'graphql-http/lib/use/express';
import { GraphQLError } from 'graphql';
import { PayloadRequest } from '../express/types';
import errorHandler from './errorHandler';

const graphQLHandler = (req: PayloadRequest, res: Response) => {
  const { payload } = req;

  const afterErrorHook = typeof payload.config.hooks.afterError === 'function' ? payload.config.hooks.afterError : null;

  return createHandler(
    {
      schema: payload.schema,
      onOperation: async (request, args, result) => {
        if (result.errors) {
          const errors = await Promise.all(result.errors.map((error) => {
            return errorHandler(payload, error, payload.config.debug, afterErrorHook);
          })) as GraphQLError[];
          // errors type should be FormattedGraphQLError[] but onOperation has a return type of ExecutionResult instead of FormattedExecutionResult
          return { ...result, errors };
        }
        return result;
      },
      context: { req, res },
      validationRules: (request, variables, defaultRules) => defaultRules.concat(payload.validationRules(variables)),
    },
  );
};

export default graphQLHandler;
