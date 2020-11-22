import passport from 'passport';
import AnonymousStrategy from 'passport-anonymous';
import jwtStrategy from './strategies/jwt';

function initAuth(): void {
  passport.use(new AnonymousStrategy.Strategy());
  passport.use('jwt', jwtStrategy(this));
}

export default initAuth;
