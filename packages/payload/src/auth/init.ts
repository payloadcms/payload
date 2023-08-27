import passport from 'passport';
import AnonymousStrategy from 'passport-anonymous';
import { Payload } from '../payload.js';
import jwtStrategy from './strategies/jwt.js';

function initAuth(ctx: Payload): void {
  passport.use(new AnonymousStrategy.Strategy());
  passport.use('jwt', jwtStrategy(ctx));
}

export default initAuth;
