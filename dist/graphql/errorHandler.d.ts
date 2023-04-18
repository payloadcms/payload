import { GraphQLFormattedError } from 'graphql';
import { AfterErrorHook } from '../collections/config/types';
import { Payload } from '../payload';
/**
 *
 * @param info
 * @param debug
 * @param afterErrorHook
 * @returns {Promise<unknown[]>}
 */
declare const errorHandler: (payload: Payload, info: any, debug: boolean, afterErrorHook: AfterErrorHook) => Promise<GraphQLFormattedError[]>;
export default errorHandler;
