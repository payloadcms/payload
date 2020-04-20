const PassportAPIKey = require('passport-headerapikey').HeaderAPIKeyStrategy;

module.exports = ({ Model }) => {
  const opts = {
    header: 'Authorization',
    prefix: 'Api-Key',
  };

  return new PassportAPIKey(opts, false, async (apiKey, done) => {
    try {
      const user = await Model.findOne({ apiKey });
      return done(null, user);
    } catch (err) {
      return done(null, false);
    }
  });
};
