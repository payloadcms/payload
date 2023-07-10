import react from '@vitejs/plugin-react';
import path from 'path';
import { InlineConfig } from 'vite';
import type { SanitizedConfig } from '../../config/types';

const mockBundlerPath = path.resolve(__dirname, '../mocks/bundlers.js');

export const getBaseConfig = (payloadConfig: SanitizedConfig): InlineConfig => {
  const rootPath = payloadConfig.routes.admin;

  return {
    server: {
      middlewareMode: true,
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
        // [`${path.resolve(__dirname, './bundler')}`]: mockBundlerPath,
      },
    },

    define: {
      __dirname: '""',
      'module.hot': 'undefined',
      process: '({argv:[],env:{},cwd:()=>""})',
    },
    base: rootPath,
    root: path.resolve(__dirname, '../../admin'),
  };
};
