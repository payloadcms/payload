const PassportAPIKey = require('passport-headerapikey').HeaderAPIKeyStrategy;

module.exports = ({ Model, config }) => {
  const opts = {
    header: 'Authorization',
    prefix: `${config.labels.singular} API-Key `,
  };

  return new PassportAPIKey(opts, false, (apiKey, done) => {
    Model.findOne({ apiKey, enableAPIKey: true }, (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false);

      const json = user.toJSON({ virtuals: true });
      json.collection = config.slug;

      return done(null, json);
    });
  });
};
