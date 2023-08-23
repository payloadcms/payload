import { Collection } from '../../../collections/config/types';
import forgotPassword from '../../operations/forgotPassword';

function forgotPasswordResolver(collection: Collection): any {
  async function resolver(_, args, context) {
    const options = {
      collection,
      data: {
        email: args.email,
      },
      req: context.req,
      disableEmail: args.disableEmail,
      expiration: args.expiration,
    };

    await forgotPassword(options);
    return true;
  }

  return resolver;
}

export default forgotPasswordResolver;
