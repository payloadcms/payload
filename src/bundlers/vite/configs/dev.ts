import { InlineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { getDevConfig as getDevWebpackConfig } from '../../webpack/configs/dev';
import { SanitizedConfig } from '../../../config/types';
import { getBaseConfig } from './base';

export const getDevConfig = (payloadConfig: SanitizedConfig): InlineConfig => {
  const baseConfig = getBaseConfig(payloadConfig);

  const webpackConfig = getDevWebpackConfig(payloadConfig);
  const webpackAliases = webpackConfig?.resolve?.alias || {} as any;

  const indexFile = process.env.PAYLOAD_DEV_MODE === 'true' ? 'index.tsx' : 'index.js';

  const viteConfig: InlineConfig = {
    ...baseConfig,
    server: {
      middlewareMode: true,
    },
    plugins: [
      {
        name: 'init-admin-panel',
        transformIndexHtml(html) {
          if (html.includes(`/${indexFile}`)) return html;
          return html.replace(
            '</body>',
            `<script> var exports = {}; </script></script><script type="module" src="${payloadConfig.routes.admin}/${indexFile}"></script></body>`,
          );
        },
      },
      typeof react === 'function' && react(),
      ...(baseConfig?.plugins || []),
    ],
    resolve: {
      ...(baseConfig?.resolve || {}),
      alias: {
        ...(webpackAliases || {}),
        ...(baseConfig?.resolve?.alias || {}),
      },
    },
    define: {
      ...(baseConfig?.define || {}),
      __dirname: '""',
      'module.hot': 'undefined',
      process: '({argv:[],env:{},cwd:()=>""})',
    },
  };

  return viteConfig;
};
