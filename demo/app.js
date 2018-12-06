import express from 'express';
import payload from '../src';
import User from './User/User.model';
import payloadConfig from './payload.config';

import authRoutes from './Auth/Auth.routes';
import userRoutes from './User/User.routes';
import pageRoutes from './Page/Page.routes';

const router = express.Router({}); // eslint-disable-line new-cap

export const app =  express();

payload.init({
  config: payloadConfig,
  app: app,
  user: User,
  router: router
});

router.use('', authRoutes);
router.use('/users', userRoutes);
router.use('/pages', pageRoutes);

app.listen(payloadConfig.port, () => {
  console.log(`listening on ${payloadConfig.port}...`);
});
