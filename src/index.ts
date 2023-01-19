import { Config as GeneratedTypes } from 'payload/generated-types';
import {
  InitOptions,
} from './config/types';
import { initHTTP } from './initHTTP';
import { Payload, BasePayload } from './payload';

export { getPayload } from './payload';

require('isomorphic-fetch');

export class PayloadHTTP extends BasePayload<GeneratedTypes> {
  async init(options: InitOptions): Promise<Payload> {
    const payload = await initHTTP(options);
    Object.assign(this, payload);
    return payload;
  }
}

const payload = new PayloadHTTP();

export default payload;
module.exports = payload;
