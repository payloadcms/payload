import { InlineConfig } from 'vite';
import scss from 'rollup-plugin-scss';
import image from '@rollup/plugin-image';
import path from 'path';
import commonjs from '@rollup/plugin-commonjs';
import { SanitizedConfig } from '../../../config/types';
import { getBaseConfig } from './base';
import { getProdConfig as getWebpackProdConfig } from '../../webpack/configs/prod';

const relativeAdminPath = path.resolve(__dirname, '../../../admin');

export const getProdConfig = (payloadConfig: SanitizedConfig): InlineConfig => {
  const webpackConfig = getWebpackProdConfig(payloadConfig);
  const webpackAliases = webpackConfig?.resolve?.alias || {};
  const baseConfig = getBaseConfig(payloadConfig) as any;

  const viteConfig: InlineConfig = {
    ...baseConfig,
    plugins: [
      ...(baseConfig?.plugins || []),
    ],
    resolve: {
      ...(baseConfig?.resolve || {}),
      alias: {
        ...(webpackAliases || {}),
        ...(baseConfig?.resolve?.alias || {}),
      },
    },
    build: {
      outDir: payloadConfig.admin.buildPath,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        plugins: [
          image(),
          commonjs(),
          scss({
            output: path.resolve(payloadConfig.admin.buildPath, 'styles.css'),
            outputStyle: 'compressed',
            include: [`${relativeAdminPath}/**/*.scss`],
          }),
        ],
        external: [
          'vm',
          'stream',
          'fs',
          'path',
          'crypto',
          'util',
          'assert',
          'os',
          'zlib',
          'http',
          'https',
          'url',
          'async_hooks',
          'querystring',
          'net',
          'tls',
          'dns',
          'child_process',
          'module',
          'constants',
        ],
        treeshake: true,
        input: {
          main: path.resolve(__dirname, relativeAdminPath),
        },
      },
    },
  };

  return viteConfig;
};
