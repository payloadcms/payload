import path from 'path';
import { InlineConfig, createLogger } from 'vite';
import viteCommonJS from 'vite-plugin-commonjs';
import virtual from 'vite-plugin-virtual';
import scss from 'rollup-plugin-scss';
import image from '@rollup/plugin-image';
import rollupCommonJS from '@rollup/plugin-commonjs';
import react from '@vitejs/plugin-react';
import getPort from 'get-port';
import { getDevConfig as getDevWebpackConfig } from '../../webpack/configs/dev';
import type { SanitizedConfig } from '../../../config/types';

const logger = createLogger('warn', { prefix: '[VITE-WARNING]', allowClearScreen: false });
const originalWarning = logger.warn;
logger.warn = (msg, options) => {
  // TODO: fix this? removed these warnings to make debugging easier
  if (msg.includes('Default and named imports from CSS files are deprecated')) return;
  originalWarning(msg, options);
};

const bundlerPath = path.resolve(__dirname, '../bundler');
const relativeAdminPath = path.resolve(__dirname, '../../../admin');

export const getViteConfig = async (payloadConfig: SanitizedConfig): Promise<InlineConfig> => {
  const webpackConfig = getDevWebpackConfig(payloadConfig);
  const webpackAliases = webpackConfig?.resolve?.alias || {} as any;
  const hmrPort = await getPort();

  return {
    root: path.resolve(__dirname, '../../../admin'),
    base: payloadConfig.routes.admin,
    customLogger: logger,
    server: {
      middlewareMode: true,
      hmr: {
        port: hmrPort,
      },
    },
    resolve: {
      alias: {
        // Alternative is to remove ~ from the import
        '~payload-user-css': payloadConfig.admin.css,
        '~react-toastify': 'react-toastify',
        ...(webpackAliases || {}),
      },
    },
    define: {
      __dirname: '""',
      'module.hot': 'undefined',
      process: '({argv:[],env:{},cwd:()=>""})',
    },
    plugins: [
      virtual({
        crypto: 'export default {}',
        https: 'export default {}',
        http: 'export default {}',
      }),
      react(),
      viteCommonJS(),
      {
        name: 'init-admin-panel',
        transformIndexHtml(html) {
          const indexFile = process.env.PAYLOAD_DEV_MODE === 'true' ? 'index.tsx' : 'index.js';

          if (html.includes(`/${indexFile}`)) return html;

          return html.replace(
            '</body>',
            `<script> var exports = {}; </script></script><script type="module" src="${payloadConfig.routes.admin}/${indexFile}"></script></body>`,
          );
        },
      },
      {
        name: 'shim-bundler-file',
        load(id) {
          if (id.startsWith(bundlerPath)) {
            return 'export default () => { };';
          }
          return null;
        },
      },
    ],

    build: {
      outDir: payloadConfig.admin.buildPath,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        plugins: [
          image(),
          rollupCommonJS(),
          scss({
            output: path.resolve(payloadConfig.admin.buildPath, 'styles.css'),
            outputStyle: 'compressed',
            include: [`${relativeAdminPath}/**/*.scss`],
          }),
        ],
        treeshake: true,
        input: {
          main: path.resolve(__dirname, relativeAdminPath),
        },
      },
    },
  };
};
