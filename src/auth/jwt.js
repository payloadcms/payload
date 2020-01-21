const passportJwt = require('passport-jwt');

const JwtStrategy = passportJwt.Strategy;
const { ExtractJwt } = passportJwt;

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('JWT');
opts.secretOrKey = process.env.secret || 'SECRET_KEY';

module.exports = User => new JwtStrategy(opts, (token, done) => {
  console.log(`Token authenticated for user: ${token.email}`);
  User.findByUsername(token.email, (err, user) => {
    if (err || !user) done(null, false);
    return done(null, user);
  });
});
