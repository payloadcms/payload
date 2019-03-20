import express from 'express';
import bindModel from '../../src/middleware/bindModel';
import { query, create, findOne, destroy, update } from '../../src/requestHandlers';

import Page from './Page.model';
import pagePolicy from './Page.policy';

const pageRoutes = express.Router(); // eslint-disable-line new-cap

pageRoutes.all('*', bindModel(Page));

pageRoutes
  .route('')
  .get(pagePolicy.read, query)
  .post(pagePolicy.create, create);

pageRoutes
  .route('/:_id')
  .get(pagePolicy.read, findOne)
  .put(pagePolicy.update, update)
  .delete(pagePolicy.destroy, destroy);

export { pageRoutes };
