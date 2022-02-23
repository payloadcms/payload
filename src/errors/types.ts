import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { PayloadRequest } from '../express/types';
import { APIError } from './index';
import { ErrorResponse } from '../express/responses/formatError';

export * from '.';

export type AfterErrorHook = (args: {
  error: GraphQLError | APIError,
  response: GraphQLFormattedError | ErrorResponse | unknown
  req: PayloadRequest
  status?: number
}) => { response: GraphQLFormattedError | ErrorResponse | unknown, status: number } | void;
