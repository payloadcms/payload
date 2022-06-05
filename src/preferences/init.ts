import express from 'express';

import { Payload } from '../index';
import Model from './model';
import findOne from './operations/findOne';
import update from './operations/update';
import deleteHandler from './requestHandlers/delete';

export default function initPreferences(ctx: Payload): void {
  ctx.preferences = { Model };

  if (!ctx.local) {
    const router = express.Router();
    router
      .route('/_preferences/:key')
      .get(findOne)
      .post(update)
      .delete(deleteHandler);

    ctx.router.use(router);
  }
}
