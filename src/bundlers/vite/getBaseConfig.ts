import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import type { InlineConfig } from 'vite';
import type { SanitizedConfig } from '../../config/types';

const mockBundlerPath = resolve(__dirname, '../mocks/bundlers.js');

export const getBaseConfig = (payloadConfig: SanitizedConfig): InlineConfig => {
  const rootPath = payloadConfig.routes.admin;

  return {
    configFile: false,
    server: {
      middlewareMode: true,
    },
    appType: 'spa',
    optimizeDeps: { exclude: ['fsevents'] },
    mode: 'development',
    plugins: [
      typeof react === 'function' && react(),
      {
        name: 'payload',
        transformIndexHtml(html) {
          if (html.includes('/index.tsx')) return html;
          return html.replace(
            '</body>',
            `<script type="module" src="${rootPath}/index.tsx"></script></body>`,
          );
        },
      },
    ],
    resolve: {
      alias: {
        'payload-config': payloadConfig.paths.rawConfig,
        // Alternative is to remove ~ from the import
        '~payload-user-css': payloadConfig.admin.css,
        '~react-toastify': 'react-toastify',
        [`${resolve(__dirname, './bundler')}`]: mockBundlerPath,
        // path: resolve(__dirname, '../mocks/path.js'),
      },
    },

    define: {
      __dirname: '""',
      'module.hot': 'undefined',
      // process: '({argv:[],env:{},cwd:()=>""})',
    },
    base: rootPath,
    root: resolve(__dirname, '../../admin'),
  };
};
