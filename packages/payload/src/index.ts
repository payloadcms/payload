import type { Config as GeneratedTypes } from 'payload/generated-types';

import 'isomorphic-fetch'

import type { InitOptions } from './config/types.js';
import type { Payload as LocalPayload} from './payload.js';

import { initHTTP } from './initHTTP.js';
import { BasePayload } from './payload.js';

export type { RequestContext } from './express/types.js';

export { getPayload } from './payload.js';


export class Payload extends BasePayload<GeneratedTypes> {
  async init(options: InitOptions): Promise<LocalPayload> {
    const payload = await initHTTP(options);
    Object.assign(this, payload);

    if (!options.local) {
      if (typeof options.onInit === 'function') await options.onInit(this);
      if (typeof this.config.onInit === 'function') await this.config.onInit(this);
    }

    return payload;
  }
}

const payload = new Payload();

export default payload;