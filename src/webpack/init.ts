import express, { Router } from 'express';
import { resolve } from 'path';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { SanitizedConfig } from '../config/types';

const router = express.Router();

function initWebpack(config: SanitizedConfig): Router {
  const base = config.routes.admin;
  const server = createServer({
    server: {
      middlewareMode: true,
      base,
    },
    appType: 'spa',
    plugins: [
      typeof react === 'function' && react(),
      {
        name: 'payload',
        transformIndexHtml(html) {
          if (html.includes('/index.tsx')) return html;
          return html.replace(
            '</body>',
            `<script type="module" src="${base}/index.tsx"></script></body>`,
          );
        },
      },
    ],
    resolve: {
      alias: {
        'payload-config': config.paths.rawConfig,
        // Alternative is to remove ~ from the import
        '~payload-user-css': config.admin.css,
        '~react-toastify': 'react-toastify',
        path: resolve(__dirname, 'mocks/path.js'),
      },
    },

    define: {
      __dirname: '""',
      'module.hot': 'undefined',
      process: '({argv:[],env:{},cwd:()=>""})',
    },
    base,
    root: resolve(__dirname, '..', 'admin'),
  }).then((vite) => {
    // Vite is now ready to handle requests
    router.use(base, vite.middlewares);
  });

  router.use(config.routes.admin, async (req, res, next) => {
    // Pause while Vite is preparing the server
    await server;
    next();
  });

  return router;
}

export default initWebpack;
