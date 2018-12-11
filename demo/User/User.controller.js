import User from './User.model';
import payloadUser from '../../src/user';

const user = payloadUser(User);

const userController = {
  post: user.post,
};

export default userController;
