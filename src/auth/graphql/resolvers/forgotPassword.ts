import { Collection } from '../../../collections/config/types';

function forgotPassword(collection: Collection): any {
  async function resolver(_, args, context) {
    const options = {
      collection,
      data: { email: args.email },
      req: context.req,
      disableEmail: args.disableEmail,
      expiration: args.expiration,
    };

    await this.operations.collections.auth.forgotPassword(options);
    return true;
  }

  const forgotPasswordResolver = resolver.bind(this);

  return forgotPasswordResolver;
}

export default forgotPassword;
