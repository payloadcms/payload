import {
  InitOptions,
} from './config/types';
import { initHTTP } from './initHTTP';
import { Payload } from './payload';

export { getPayload } from './payload';

require('isomorphic-fetch');

export class PayloadHTTP extends Payload {
  async init<T = any>(options: InitOptions): Promise<Payload<T>> {
    const payload = await initHTTP<T>(options);
    Object.assign(this, payload);
    return payload;
  }
}

const payload = new PayloadHTTP();

export default payload;
module.exports = payload;
