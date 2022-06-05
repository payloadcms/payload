/* eslint-disable no-param-reassign */
import { Collection } from '../../../collections/config/types';
import { Payload } from '../../..';
import verifyEmail from '../../operations/verifyEmail';

function verifyEmailResolver(payload: Payload, collection: Collection) {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const options = {
      collection,
      token: args.token,
      req: context.req,
      res: context.res,
      api: 'GraphQL',
    };

    const success = await verifyEmail(options);
    return success;
  }

  return resolver;
}

export default verifyEmailResolver;
