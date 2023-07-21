import path from 'path';
import { InlineConfig } from 'vite';
import type { SanitizedConfig } from '../../../config/types';
import { getDevConfig as getDevWebpackConfig } from '../../webpack/configs/dev';

const mockBundlerPath = path.resolve(__dirname, '../../mocks/emptyModule.js');

const bundlerPath = path.resolve(__dirname, '../bundler');
export const getBaseConfig = (payloadConfig: SanitizedConfig): InlineConfig => {
  const webpackConfig = getDevWebpackConfig(payloadConfig);
  const webpackAliases = webpackConfig?.resolve?.alias || {} as any;

  return {
    root: path.resolve(__dirname, '../../../admin'),
    base: payloadConfig.routes.admin,
    plugins: [
      {
        name: 'payload',
        transformIndexHtml(html) {
          if (html.includes('/index.tsx')) return html;
          return html.replace(
            '</body>',
            `<script type="module" src="${payloadConfig.routes.admin}/index.tsx"></script></body>`,
          );
        },
      },
    ],
    resolve: {
      alias: {
        ...webpackAliases,
        path: require.resolve('path-browserify'),
        'payload-config': payloadConfig.paths.rawConfig,
        // Alternative is to remove ~ from the import
        '~payload-user-css': payloadConfig.admin.css,
        '~react-toastify': 'react-toastify',
        [bundlerPath]: mockBundlerPath,
      },
    },
  };
};
