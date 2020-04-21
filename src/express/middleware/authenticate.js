const passport = require('passport');

module.exports = passport.authenticate(['jwt', 'headerapikey', 'anonymous'], { session: false });
