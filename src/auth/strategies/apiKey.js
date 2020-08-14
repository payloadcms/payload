const PassportAPIKey = require('passport-headerapikey').HeaderAPIKeyStrategy;

module.exports = ({ operations }, { Model, config }) => {
  const opts = {
    header: 'Authorization',
    prefix: `${config.labels.singular} API-Key `,
  };

  return new PassportAPIKey(opts, true, async (apiKey, done, req) => {
    try {
      const userQuery = await operations.collections.find({
        where: {
          apiKey: {
            equals: apiKey,
          },
        },
        collection: {
          Model,
          config,
        },
        req,
        overrideAccess: true,
      });

      if (userQuery.docs && userQuery.docs.length > 0) {
        const user = userQuery.docs[0];
        user.collection = config.slug;
        done(null, user);
      } else {
        done(null, false);
      }
    } catch (err) {
      done(null, false);
    }
  });
};
