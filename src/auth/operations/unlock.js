const { APIError } = require('../../errors');
const executeAccess = require('../executeAccess');

async function unlock(args) {
  if (!Object.prototype.hasOwnProperty.call(args.data, 'email')) {
    throw new APIError('Missing email.');
  }

  const {
    collection: {
      Model,
      config: collectionConfig,
    },
    req,
    overrideAccess,
  } = args;

  // /////////////////////////////////////
  // 1. Retrieve and execute access
  // /////////////////////////////////////

  if (!overrideAccess) {
    await executeAccess({ req }, collectionConfig.access.unlock);
  }

  let options = { ...args };

  // /////////////////////////////////////
  // 2. Execute before unlock hook
  // /////////////////////////////////////

  const { beforeUnlock } = args.collection.config.hooks;

  if (typeof beforeUnlock === 'function') {
    options = await beforeUnlock(options);
  }

  const { data } = options;

  // /////////////////////////////////////
  // 3. Perform unlock
  // /////////////////////////////////////

  const user = await Model.findOne({ email: data.email.toLowerCase() });

  if (!user) return null;

  await user.resetLoginAttempts();

  // /////////////////////////////////////
  // 4. Execute after unlock hook
  // /////////////////////////////////////

  const { afterUnlock } = args.collection.config.hooks;

  if (typeof afterUnlock === 'function') {
    await afterUnlock(options);
  }

  return true;
}

module.exports = unlock;
