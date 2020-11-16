const PassportAPIKey = require('passport-headerapikey').HeaderAPIKeyStrategy;
const crypto = require('crypto');

module.exports = ({ operations, config: { secret } }, { Model, config }) => {
  const opts = {
    header: 'Authorization',
    prefix: `${config.labels.singular} API-Key `,
  };

  return new PassportAPIKey(opts, true, async (apiKey, done, req) => {
    const apiKeyIndex = crypto.createHmac('sha1', secret)
      .update(apiKey)
      .digest('hex');

    try {
      const where = {};
      if (config.auth.verify) {
        where.and = [
          {
            // TODO: Search for index
            apiKeyIndex: {
              equals: apiKeyIndex,
            },
          },
          {
            _verified: {
              not_equals: false,
            },
          },
        ];
      } else {
        where.apiKeyIndex = {
          equals: apiKeyIndex,
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
