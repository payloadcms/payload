import passportJwt from 'passport-jwt';

const JwtStrategy = passportJwt.Strategy;
const ExtractJwt = passportJwt.ExtractJwt;

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('JWT');
opts.secretOrKey = process.env.secret || 'SECRET_KEY';

export default () => new JwtStrategy(opts, (jwtPayload, done) => {
  console.log(`Token authenticated for user: ${jwtPayload.email}`);
  return done(null, true);
})
