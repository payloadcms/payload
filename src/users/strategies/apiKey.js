const PassportAPIKey = require('passport-headerapikey').HeaderAPIKeyStrategy;

module.exports = ({ Model }) => {
  const opts = {
    header: 'Authorization',
    prefix: 'API-Key ',
  };

  return new PassportAPIKey(opts, false, (apiKey, done) => {
    Model.findOne({ apiKey, enableAPIKey: true }, (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false);
      return done(null, user);
    });
  });
};
