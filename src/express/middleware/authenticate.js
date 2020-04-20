const passport = require('passport');

module.exports = passport.authenticate(['jwt', 'anonymous', 'headerapikey'], { session: false });
