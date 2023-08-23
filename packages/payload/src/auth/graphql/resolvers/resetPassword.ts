/* eslint-disable no-param-reassign */
import { Collection } from '../../../collections/config/types';
import resetPassword from '../../operations/resetPassword';

function resetPasswordResolver(collection: Collection) {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale;
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

    const options = {
      collection,
      data: args,
      req: context.req,
      res: context.res,
      api: 'GraphQL',
      depth: 0,
    };

    const result = await resetPassword(options);

    return result;
  }

  return resolver;
}

export default resetPasswordResolver;
