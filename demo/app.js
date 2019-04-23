import express from 'express';
import payload from '../src';

import User from './User/User.model';
import payloadConfig from './payload.config';
import { authRoutes } from './Auth/Auth.routes';
import { userRoutes } from './User/User.routes';
import { pageRoutes } from './Page/Page.routes';
import schema from '../demo/graphql';

const router = express.Router({}); // eslint-disable-line new-cap

export const app = express();

payload.init({
  config: payloadConfig,
  app: app,
  user: User,
  router: router,
  graphQLSchema: schema,
  cors: ['http://localhost:8080', 'http://localhost:8081']
});

if (process.env.NODE_ENV !== 'production') {
  router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
  });
}

router.use('/', authRoutes);
router.use('/users', userRoutes);
router.use('/pages', pageRoutes);

app.listen(payloadConfig.port, () => {
  console.log(`listening on ${payloadConfig.port}...`);
});
