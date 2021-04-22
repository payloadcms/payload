import express, { Router } from 'express';
import { PayloadConfig } from 'payload/config';
import { PayloadRequest } from 'payload/dist/express/types';
import { Options } from './types';
import operation from './operation';

export default (config: PayloadConfig, options: Options): Router => {
  const router = express.Router();

  router.post(options.routePath || '/validate-password', async (req: PayloadRequest, res) => {
    try {
      const {
        body: {
          collection,
          password,
          id,
        } = {},
        payload,
      } = req;

      await operation({
        config,
        payload,
        options,
        collection,
        password,
        id,
        res,
      });

      res.status(200).send();
    } catch (e) {
      res.status(401).send();
    }
  });

  return router;
};
