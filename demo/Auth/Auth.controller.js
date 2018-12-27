import User from '../User/User.model';
import auth from '../../src/auth';

const Auth = auth(User);

const authController = {
  login: Auth.login,
  me: Auth.me,
  role: Auth.role,
  check: Auth.check
}

export default authController;
