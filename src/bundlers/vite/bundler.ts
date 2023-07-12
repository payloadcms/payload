
import express from 'express';
import path from 'path';
import { createServer } from 'vite';
import type { InlineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { PayloadBundler } from '../types';
// import { getBaseConfig } from './getBaseConfig';

const mockBundlerPath = path.resolve(__dirname, '../mocks/bundlers.js');

const router = express.Router();

export const getViteBundler = (viteConfig?: InlineConfig): PayloadBundler => ({
  dev: async (sanitizedConfig) => {
    const adminRoute = sanitizedConfig.routes.admin;

    const viteServer = await createServer({
      appType: 'spa',
      base: adminRoute,
      root: path.resolve(__dirname, '../../admin'),
      server: {
        middlewareMode: true,
      },
      configFile: false,
      // optimizeDeps: { exclude: ['fsevents'] },
      mode: 'development',
      plugins: [
        typeof react === 'function' && react(),
        {
          name: 'payload',
          transformIndexHtml(html) {
            if (html.includes('/index.tsx')) return html;
            return html.replace(
              '</body>',
              `<script type="module" src="${adminRoute}/index.tsx"></script></body>`,
            );
          },
        },
      ],
      resolve: {
        alias: {
          'payload-config': sanitizedConfig.paths.rawConfig,
          // Alternative is to remove ~ from the import
          '~payload-user-css': sanitizedConfig.admin.css,
          '~react-toastify': 'react-toastify',
          [`${path.resolve(__dirname, '.')}`]: mockBundlerPath,
        },
      },
      define: {
        __dirname: '""',
        'module.hot': 'undefined',
      },
    });

    router.use(adminRoute, viteServer.middlewares);

    return router;
  },
  build: async (sanitizedConfig) => {
  },
  serve: async (sanitizedConfig) => {
    // serve built files in production
  },
});


// I need to create middleware
