import path from 'path';
import { InlineConfig, createLogger } from 'vite';
import viteCommonJS from 'vite-plugin-commonjs';
import dynamicImport from 'vite-plugin-dynamic-import';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import scss from 'rollup-plugin-scss';
import image from '@rollup/plugin-image';
import rollupCommonJS from '@rollup/plugin-commonjs';
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

export const getViteConfig = (payloadConfig: SanitizedConfig): InlineConfig => {
  const webpackConfig = getDevWebpackConfig(payloadConfig);
  const webpackAliases = webpackConfig?.resolve?.alias || {} as any;

  return {
    root: path.resolve(__dirname, '../../../admin'),
    base: payloadConfig.routes.admin,
    customLogger: logger,
    server: {
      middlewareMode: true,
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
      dynamicImport(),
      viteCommonJS(),
      nodePolyfills({
        exclude: [
          'fs',
        ],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
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
        name: 'replace-bundler-path',
        transform(code, id) {
          if (id.startsWith(bundlerPath)) {
            return 'export default () => { };';
          }

          return code;
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
