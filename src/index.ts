import {
  InitOptions,
} from './config/types';
import { initHTTP } from './initHTTP';
import { Payload, getPayload } from './payload';

require('isomorphic-fetch');

export const init = async <T = any>(options: InitOptions): Promise<Payload<T>> => {
  return initHTTP<T>(options);
};

export default getPayload;
