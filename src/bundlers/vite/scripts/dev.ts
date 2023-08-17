import type { InlineConfig } from 'vite';
import vite from 'vite';
import express from 'express';
import type { PayloadHandler } from '../../../config/types';
import { Payload } from '../../../payload';
import { getViteConfig } from '../configs/vite';

const router = express.Router();

type DevAdminType = (options: {
  payload: Payload;
  viteConfig: InlineConfig;
}) => Promise<PayloadHandler>;
export const devAdmin: DevAdminType = async ({ payload, viteConfig: viteConfigArg }) => {
  // TODO: merge vite configs (https://vitejs.dev/guide/api-javascript.html#mergeconfig)

  try {
    const viteConfig = await getViteConfig(payload.config);
    const viteServer = await vite.createServer(viteConfig);

    router.use(viteServer.middlewares);
  } catch (err) {
    console.error(err);
    throw new Error('Error: there was an error creating the vite dev server.');
  }

  return router;
};
