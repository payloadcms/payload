import express from 'express';
import Payload from '../src';
import payloadConfig from './payload.config';
// import { authRoutes } from './Auth/Auth.routes';
// import { userRoutes } from './User/User.routes';
import User from './config/User';
import Page from './config/Page';
import Category from './config/Category';
const router = express.Router({}); // eslint-disable-line new-cap

export const app = express();

new Payload({
  models: [
    User,
    Page,
    Category,
  ],
  config: payloadConfig,
  app: app,
  router: router,
});

if (process.env.NODE_ENV !== 'production') {
  router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
  });
}

// router.use('/', authRoutes);
// router.use('/users', userRoutes);

app.listen(payloadConfig.port, () => {
  console.log(`listening on ${payloadConfig.port}...`);
});
