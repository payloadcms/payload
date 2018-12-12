import passportJwt from 'passport-jwt';

const JwtStrategy = passportJwt.Strategy;
const ExtractJwt = passportJwt.ExtractJwt;

const opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = 'SECRET_KEY'; //normally store this in process.env.secret

export default User => {
  return new JwtStrategy(opts, (jwtPayload, done) => {

    // Access to User model
    console.log(User);

    if (jwtPayload.email === 'james@jamestest.com') {
        return done(null, true)
    }
    return done(null, false)
  })
}
