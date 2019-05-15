import express from 'express';
import bindModel from '../../src/middleware/bindModel';
import { query, create, findOne, destroy, update } from '../../src/requestHandlers';

import Category from './Category.model';
import categoryPolicy from './Category.policy';

const categoryRoutes = express.Router(); // eslint-disable-line new-cap

categoryRoutes.all('*', bindModel(Category));

categoryRoutes
  .route('')
  .get(categoryPolicy.read, query)
  .post(categoryPolicy.create, create);

categoryRoutes
  .route('/:_id')
  .get(categoryPolicy.read, findOne)
  .put(categoryPolicy.update, update)
  .delete(categoryPolicy.destroy, destroy);

export { categoryRoutes };
