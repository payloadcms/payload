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

    if (!options.local) {
      if (typeof options.onInit === 'function') await options.onInit(this);
      if (typeof this.config.onInit === 'function') await this.config.onInit(this);
    }

    return payload;
  }
}

const payload = new PayloadHTTP();

export default payload;
module.exports = payload;
