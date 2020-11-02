const PassportAPIKey = require('passport-headerapikey').HeaderAPIKeyStrategy;

module.exports = ({ operations }, { Model, config }) => {
  const opts = {
    header: 'Authorization',
    prefix: `${config.labels.singular} API-Key `,
  };

  return new PassportAPIKey(opts, true, async (apiKey, done, req) => {
    try {
      const where = {};
      if (config.auth.emailVerification) {
        where.and = [
          {
            apiKey: {
              equals: apiKey,
            },
          },
          {
            _verified: {
              not_equals: false,
            },
          },
        ];
      } else {
        where.apiKey = {
          equals: apiKey,
        };
      }
      const userQuery = await operations.collections.find({
        where,
        collection: {
          Model,
          config,
        },
        req,
        overrideAccess: true,
        depth: config.auth.depth,
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
