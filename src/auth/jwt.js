const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = 'SECRET_KEY'; //normally store this in process.env.secret

module.exports = new JwtStrategy(opts, (jwtPayload, done) => {
    console.log(jwtPayload, 'jwtPayload');
    if (jwtPayload.email === 'james@jamestest.com') {
        return done(null, true)
    }
    return done(null, false)
})
