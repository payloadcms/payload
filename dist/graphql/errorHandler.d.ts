import { GraphQLFormattedError } from 'graphql';
import { AfterErrorHook } from '../collections/config/types';
import { Payload } from '../payload';
declare const errorHandler: (payload: Payload, err: any, debug: boolean, afterErrorHook: AfterErrorHook) => Promise<GraphQLFormattedError>;
export default errorHandler;
