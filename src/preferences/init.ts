import express from 'express';

import { Payload } from '../index';
import Model from './model';

export default function initPreferences(ctx: Payload): void {
  const { findOne, update, delete: deleteHandler } = ctx.requestHandlers.preferences;

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
