import express from 'express';
import bindModel from '../../src/middleware/bindModel';
import { query, create, find, destroy, update } from '../../src/requestHandlers';

import Page from './Page.model';
import pagePolicy from './Page.policy';

const router = express.Router(); // eslint-disable-line new-cap

router.all('*', bindModel(Page));

router
  .route('')
  .get(pagePolicy.query, query)
  .post(pagePolicy.create, create);

router
  .route('/:id')
  .get(pagePolicy.find, bindModel(Page), find)
  .put(pagePolicy.update, update)
  .delete(pagePolicy.destroy, destroy);

export default router;
