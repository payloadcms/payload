import { InitOptions } from 'payload/config';
import { BasePayload as Payload, Payload as LocalPayload } from './payload';

require('isomorphic-fetch');

export { Payload };

const payload = new Payload();

export const getPayload = (options: InitOptions): Promise<LocalPayload> =>
  // eslint-disable-next-line implicit-arrow-linebreak
  payload.init(options);

export default payload;
module.exports = payload;
