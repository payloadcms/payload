import express from 'express';
import findOne from './requestHandlers/findOne';
import update from './requestHandlers/update';
import deleteHandler from './requestHandlers/delete';
import { PayloadHTTP } from '..';

export default function initPreferences(ctx: PayloadHTTP): void {
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
