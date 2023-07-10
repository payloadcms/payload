
import express from 'express';
import { InlineConfig, createServer, mergeConfig } from 'vite';
import { PayloadBundler } from '../types';
import { getBaseConfig } from './getBaseConfig';

export const getViteBundler = (viteConfig?: InlineConfig): PayloadBundler => ({
  dev: async (sanitizedConfig) => {
    const router = express.Router();

    const rootPath = sanitizedConfig.routes.admin;
    const baseConfig = getBaseConfig(sanitizedConfig);
    const mergedViteConfig = mergeConfig(baseConfig, viteConfig);
    const server = createServer(baseConfig).then((vite) => {
      // Vite is now ready to handle requests
      router.use(rootPath, vite.middlewares);
    });

    router.use(rootPath, async (req, res, next) => {
      // Pause while Vite is preparing the server
      await server;
      next();
    });

    return router;
  },
  build: async (sanitizedConfig) => {
  },
  serve: async (sanitizedConfig) => {
    // serve built files in production
  },
});
